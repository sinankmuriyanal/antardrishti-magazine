/**
 * check_firestore_images.js
 * Prints featuredImage and authorImage URLs for all Edition-2 articles.
 * Run from antardrishti-magazine/:
 *   node --env-file=.env.local scripts/check_firestore_images.js
 */
const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

(async () => {
  const snap = await db.collection("articles").where("edition", "==", 2).get();
  const docs = snap.docs.map(d => d.data()).sort((a,b) => a.displayId.localeCompare(b.displayId, undefined, {numeric:true}));
  console.log(`\n${"ID".padEnd(6)} ${"featuredImage (last 60)".padEnd(62)} ${"authorImage (last 60)"}`);
  console.log("-".repeat(132));
  for (const d of docs) {
    const feat = (d.featuredImage || "").slice(-60).padEnd(62);
    const auth = (d.authorImage || "").slice(-60);
    console.log(`${d.displayId.padEnd(6)} ${feat} ${auth}`);
  }
  process.exit(0);
})();
