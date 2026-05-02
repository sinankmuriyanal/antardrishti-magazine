const admin = require("firebase-admin");
const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: pk }), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET });
const db = admin.firestore();
const bucket = admin.storage().bucket();

async function exists(url) {
  try {
    // Extract GCS path from URL (strip base URL and query params)
    const path = url.split("/o/")[1]?.split("?")[0] || url.replace(/^https:\/\/storage\.googleapis\.com\/[^/]+\//, "").split("?")[0];
    await bucket.file(decodeURIComponent(path)).getMetadata();
    return "OK";
  } catch { return "MISSING"; }
}

(async () => {
  const snap = await db.collection("articles").where("edition","==",2).get();
  const docs = snap.docs.map(d=>d.data()).sort((a,b)=>a.displayId.localeCompare(b.displayId,undefined,{numeric:true}));
  console.log(`${"ID".padEnd(5)} ${"featuredImage URL (last 50)".padEnd(52)} ${"storage"} ${"authorImage URL (last 45)".padEnd(47)} ${"storage"}`);
  console.log("-".repeat(160));
  for (const d of docs) {
    const fUrl = d.featuredImage || "";
    const aUrl = d.authorImage || "";
    const fOk = await exists(fUrl);
    const aOk = await exists(aUrl);
    console.log(`${d.displayId.padEnd(5)} ${fUrl.slice(-52).padEnd(52)} ${fOk.padEnd(7)} ${aUrl.slice(-47).padEnd(47)} ${aOk}`);
  }
  process.exit(0);
})();
