/**
 * patch_reading_time.js
 * Calculates and writes readingTime (minutes) for every article that is missing it.
 * Run from antardrishti-magazine/:
 *   node --env-file=.env.local scripts/patch_reading_time.js
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

function calcReadingTime(html) {
  const text = (html || "").replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

(async () => {
  const snap = await db.collection("articles").get();
  console.log(`Found ${snap.size} articles\n`);

  let updated = 0;
  for (const doc of snap.docs) {
    const art = doc.data();
    const rt = calcReadingTime(art.content);
    await db.collection("articles").doc(doc.id).update({
      readingTime: rt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ${doc.id.padEnd(6)} ${rt} min read  (${(art.content || "").length} chars)`);
    updated++;
  }

  console.log(`\n✓ Updated ${updated} articles with readingTime.`);
  process.exit(0);
})();
