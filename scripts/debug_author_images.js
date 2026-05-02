const admin = require("firebase-admin");
const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: pk }) });
const db = admin.firestore();
(async () => {
  for (const id of ["3.5","3.6","3.7"]) {
    const d = await db.collection("articles").doc(id).get();
    const a = d.data() || {};
    console.log(`\n=== ${id} ===`);
    console.log("authorName:  ", a.authorName);
    console.log("authorImage: ", a.authorImage);
    console.log("featuredImage:", a.featuredImage);
    console.log("authorBio:   ", a.authorBio);
  }
  process.exit(0);
})();
