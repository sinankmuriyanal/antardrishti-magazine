/**
 * fix_firestore.js
 * Uploads ALL images (featured, author, body) to Firebase Storage,
 * rewrites img src paths in content HTML with Storage URLs,
 * then writes the corrected article documents to Firestore.
 *
 * Also restores Edition-1 articles 6.2, 6.3, 6.4 that were overwritten.
 *
 * Run from antardrishti-magazine/:
 *   node --env-file=.env.local scripts/fix_firestore.js
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

// ── Upload one image to Firebase Storage ─────────────────────────────────────
async function uploadImage(localPath, destPath) {
  const normalized = localPath.replace(/\\/g, "/");
  if (!normalized || !fs.existsSync(normalized)) {
    console.warn(`  [skip] not found: ${normalized}`);
    return null;
  }
  try {
    await bucket.upload(normalized, {
      destination: destPath,
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    await bucket.file(destPath).makePublic();
    const url = `https://storage.googleapis.com/${storageBucket}/${destPath}`;
    console.log(`  [img]  ${path.basename(normalized).padEnd(40)} -> ${destPath}`);
    return url;
  } catch (e) {
    console.warn(`  [err]  ${normalized}: ${e.message}`);
    return null;
  }
}

function resolveLocalPath(imgPath, edition) {
  if (!imgPath || imgPath.startsWith("http")) return null;
  if (edition === 1) return path.join("public", imgPath.replace(/^\/+/, "").replace(/\\/g, "/"));
  return imgPath.replace(/\\/g, "/");
}

// ── Upload Edition-2 articles (with body images in content) ──────────────────
async function uploadEdition2() {
  const jsonPath = "extracted/articles.json";
  if (!fs.existsSync(jsonPath)) {
    console.error("extracted/articles.json not found. Run extract_docx.py first.");
    process.exit(1);
  }
  const articles = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`\n── Edition 2: ${articles.length} articles ──`);

  for (const art of articles) {
    const { displayId, featuredImage, authorImage } = art;
    const updates = {};

    // Featured image
    const featLocal = resolveLocalPath(featuredImage, 2);
    if (featLocal) {
      const url = await uploadImage(featLocal, `articles/${displayId}/featured.jpg`);
      if (url) updates.featuredImage = url;
    }

    // Author image
    const authLocal = resolveLocalPath(authorImage, 2);
    if (authLocal) {
      const url = await uploadImage(authLocal, `articles/${displayId}/author.jpg`);
      if (url) updates.authorImage = url;
    }

    // Body images — find all <img src="extracted/..."> in content HTML
    let content = art.content || "";
    const imgRegex = /<img\s+src="(extracted\/images\/[^"]+)"/g;
    let match;
    let bodyIdx = 0;
    const replacements = [];

    while ((match = imgRegex.exec(content)) !== null) {
      const localSrc = match[1];
      if (fs.existsSync(localSrc)) {
        const destPath = `articles/${displayId}/body-${bodyIdx}.jpg`;
        replacements.push({ localSrc, destPath });
        bodyIdx++;
      }
    }

    for (const { localSrc, destPath } of replacements) {
      const url = await uploadImage(localSrc, destPath);
      if (url) {
        content = content.replace(`src="${localSrc}"`, `src="${url}"`);
      }
    }

    if (replacements.length > 0) updates.content = content;

    // Build Firestore document (remove internal-only _bodyImagePaths field)
    const docData = { ...art, ...updates };
    delete docData._bodyImagePaths;

    await db.collection("articles").doc(displayId).set(
      { ...docData, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    const bodyCount = replacements.length;
    console.log(`  [db]   ${displayId}: ${art.title.slice(0, 50)} (body imgs: ${bodyCount})`);
  }
}

// ── Restore Edition-1 articles 6.2, 6.3, 6.4 ────────────────────────────────
async function restoreEdition1() {
  const jsonPath = "extracted/existing_articles.json";
  if (!fs.existsSync(jsonPath)) {
    console.warn("existing_articles.json not found — skipping Ed-1 restore.");
    return;
  }
  const all = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const toRestore = all.filter((a) => ["6.2", "6.3", "6.4"].includes(a.displayId));
  console.log(`\n── Restoring ${toRestore.length} Edition-1 articles (6.2, 6.3, 6.4) ──`);

  for (const art of toRestore) {
    const { displayId, featuredImage, authorImage } = art;
    const updates = {};

    const featLocal = resolveLocalPath(featuredImage, 1);
    if (featLocal) {
      const url = await uploadImage(featLocal, `articles/${displayId}/featured.jpg`);
      if (url) updates.featuredImage = url;
    }

    const authLocal = resolveLocalPath(authorImage, 1);
    if (authLocal) {
      const url = await uploadImage(authLocal, `articles/${displayId}/author.jpg`);
      if (url) updates.authorImage = url;
    }

    await db.collection("articles").doc(displayId).set(
      { ...art, ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    console.log(`  [db]   ${displayId}: ${art.title.slice(0, 55)}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await uploadEdition2();
    await restoreEdition1();
    console.log("\n✓ All done. Body images are now embedded in article content.");
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  }
})();
