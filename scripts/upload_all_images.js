/**
 * upload_all_images.js
 * Re-uploads ALL article images (both editions) to Firebase Storage
 * and patches the Firestore documents with the new URLs.
 *
 * Edition 1 (HTML): resolves /assets/images/... → public/assets/images/...
 * Edition 2 (docx): resolves extracted\images\... → extracted/images/...
 *
 * Run from antardrishti-magazine/:
 *   node --env-file=.env.local scripts/upload_all_images.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* env vars.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  storageBucket,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ── Resolve local disk path ──────────────────────────────────────────────────
// Edition 1 images are stored relative to public/:  /assets/images/common/1.1.png
// Edition 2 images are stored relative to project:  extracted\images\article-3.5-featured.jpg
function resolveLocalPath(imgPath, edition) {
  if (!imgPath || imgPath.startsWith("http")) return null;

  if (edition === 1) {
    // Strip leading slash, prepend public/
    const rel = imgPath.replace(/^\/+/, "");
    return path.join("public", rel);
  } else {
    // Normalise backslashes
    return imgPath.replace(/\\/g, "/");
  }
}

// ── Upload one file to Storage ───────────────────────────────────────────────
async function uploadImage(localPath, destPath) {
  if (!localPath || !fs.existsSync(localPath)) {
    console.warn(`  [skip] not found: ${localPath}`);
    return null;
  }
  try {
    await bucket.upload(localPath, {
      destination: destPath,
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    const file = bucket.file(destPath);
    await file.makePublic();
    const url = `https://storage.googleapis.com/${storageBucket}/${destPath}`;
    console.log(`  [ok]   ${localPath} → ${destPath}`);
    return url;
  } catch (e) {
    console.warn(`  [err]  ${localPath}: ${e.message}`);
    return null;
  }
}

// ── Process one edition's articles ───────────────────────────────────────────
async function processEdition(jsonPath, edition) {
  if (!fs.existsSync(jsonPath)) {
    console.warn(`Skipping edition ${edition}: ${jsonPath} not found`);
    return;
  }

  const articles = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`\n── Edition ${edition}: ${articles.length} articles (${jsonPath}) ──`);

  for (const art of articles) {
    const { displayId, featuredImage, authorImage } = art;
    const imageUpdates = {};

    const featLocal = resolveLocalPath(featuredImage, edition);
    if (featLocal) {
      const url = await uploadImage(featLocal, `articles/${displayId}/featured.jpg`);
      if (url) imageUpdates.featuredImage = url;
    }

    const authLocal = resolveLocalPath(authorImage, edition);
    if (authLocal) {
      const url = await uploadImage(authLocal, `articles/${displayId}/author.jpg`);
      if (url) imageUpdates.authorImage = url;
    }

    // Use set+merge so it works whether or not the document already exists
    const docData = {
      ...art,
      ...imageUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Remove any local path fields that weren't uploaded
    if (!imageUpdates.featuredImage) delete docData.featuredImage;
    if (!imageUpdates.authorImage) delete docData.authorImage;

    await db.collection("articles").doc(displayId).set(docData, { merge: true });
    console.log(`  [db]   ${displayId} saved (images: ${Object.keys(imageUpdates).join(", ") || "none"})`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await processEdition("extracted/existing_articles.json", 1);
    await processEdition("extracted/articles.json", 2);
    console.log("\n✓ Done. All images uploaded and Firestore updated.");
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  }
})();
