const admin = require("firebase-admin");
const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: pk }), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET });
const db = admin.firestore();
const bucket = admin.storage().bucket();
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

(async () => {
  const localPath = "public/assets/images/common/2.2.png";
  const dest = "articles/2.2/featured-v2.jpg";

  await bucket.upload(localPath, { destination: dest, metadata: { cacheControl: "public, max-age=31536000" } });
  await bucket.file(dest).makePublic();
  const url = `https://storage.googleapis.com/${BUCKET}/${dest}`;

  await db.collection("articles").doc("2.2").update({
    featuredImage: url,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✓ 2.2 featuredImage updated to: ${url}`);
  process.exit(0);
})();
