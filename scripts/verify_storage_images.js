/**
 * Downloads author.jpg from Storage for articles 3.5, 3.6, 3.7
 * and prints their MD5 hashes to confirm they're actually different files.
 */
const admin = require("firebase-admin");
const crypto = require("crypto");
const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: pk }), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET });
const bucket = admin.storage().bucket();

async function hashStorageFile(path) {
  const [buf] = await bucket.file(path).download();
  return { size: buf.length, hash: crypto.createHash("md5").update(buf).digest("hex") };
}

(async () => {
  const paths = ["3.5","3.6","3.7"].map(id => [`articles/${id}/author.jpg`, id]);
  for (const [p, id] of paths) {
    const r = await hashStorageFile(p);
    console.log(`${id} author.jpg  ${Math.round(r.size/1024)}KB  ${r.hash}`);
  }
  process.exit(0);
})();
