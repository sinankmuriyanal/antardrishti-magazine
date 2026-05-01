const admin = require("firebase-admin");
const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: pk }) });
const db = admin.firestore();
(async () => {
  const ids = ["2.4","2.5","2.6","3.5","3.6","3.7","4.4","4.5","5.4","6.5","6.6","6.7","6.8"];
  console.log("ID    imgs_in_content  feat_url");
  for (const id of ids) {
    const d = await db.collection("articles").doc(id).get();
    const art = d.data() || {};
    const imgs = ((art.content || "").match(/<img/g) || []).length;
    const feat = art.featuredImage || "";
    const featOk = feat.startsWith("http") ? "OK" : `BAD(${feat.slice(0,40)})`;
    const auth = art.authorImage || "";
    const authOk = auth.startsWith("http") ? "OK" : `BAD(${auth.slice(0,40)})`;
    console.log(`${id.padEnd(5)} content_imgs=${imgs}  feat=${featOk}  auth=${authOk}`);
  }
  process.exit(0);
})();
