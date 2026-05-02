/**
 * bust_image_cache.js
 * Appends ?v=2 to every Storage image URL in Firestore for Edition-2 articles.
 * GCS CDN treats ?v=2 as a new cache key → forces fresh fetch from origin.
 * No re-upload needed — the Storage bytes are already correct.
 *
 * Run from antardrishti-magazine/:
 *   node --env-file=.env.local scripts/bust_image_cache.js
 */
const admin = require("firebase-admin");
const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: pk,
  }),
});
const db = admin.firestore();

function bust(url) {
  if (!url || !url.startsWith("http")) return url;
  // Remove any existing ?v= param before adding fresh one
  const base = url.split("?")[0];
  return `${base}?v=2`;
}

(async () => {
  const snap = await db.collection("articles").where("edition", "==", 2).get();
  console.log(`Found ${snap.size} Edition-2 articles\n`);

  for (const doc of snap.docs) {
    const art = doc.data();
    const updates = {};

    if (art.featuredImage) updates.featuredImage = bust(art.featuredImage);
    if (art.authorImage)   updates.authorImage   = bust(art.authorImage);

    // Rewrite all img src URLs inside content HTML
    if (art.content && art.content.includes("storage.googleapis.com")) {
      updates.content = art.content.replace(
        /https:\/\/storage\.googleapis\.com\/[^"]+\.(jpg|jpeg|png|webp)/g,
        (url) => bust(url)
      );
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("articles").doc(doc.id).update(updates);
    console.log(`  ${doc.id.padEnd(5)} feat=${updates.featuredImage?.slice(-30)}  auth=${updates.authorImage?.slice(-25)}`);
  }

  console.log("\n✓ Cache-busted. All URLs now include ?v=2.");
  process.exit(0);
})();
