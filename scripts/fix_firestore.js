/**
 * fix_firestore.js
 * 1. Deletes stale wrong-ID documents left by the previous bad extraction
 * 2. Deletes article 6.7 duplicate (user request)
 * 3. Re-uploads all Edition-2 articles with correct IDs + fresh images
 * 4. Restores Edition-1 articles 6.2, 6.3, 6.4 that were overwritten
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

// ── IDs that the previous bad extraction created with wrong content ──────────
// These won't be overwritten naturally (their correct content is now at a
// different displayId), so we must delete them explicitly.
const STALE_IDS = [
  // Old wrong-labeled Edition-2 articles (content now at different IDs):
  "5.5",  // Was "New Playbook of AI Leadership" (What's Buzzing) — now lives at 4.5
  // Note: 3.5/3.6/3.7 and 2.4/2.5/2.6 will be naturally overwritten
  // by the new correct data in the re-upload step below.
];

// ── Upload one image file to Firebase Storage ────────────────────────────────
async function uploadImage(localPath, destPath) {
  if (!localPath || !fs.existsSync(localPath)) {
    console.warn(`  [skip-img] not found: ${localPath}`);
    return null;
  }
  try {
    await bucket.upload(localPath, {
      destination: destPath,
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    await bucket.file(destPath).makePublic();
    const url = `https://storage.googleapis.com/${storageBucket}/${destPath}`;
    console.log(`  [img-ok]  ${path.basename(localPath)} -> ${destPath}`);
    return url;
  } catch (e) {
    console.warn(`  [img-err] ${localPath}: ${e.message}`);
    return null;
  }
}

function resolveLocalPath(imgPath, edition) {
  if (!imgPath || imgPath.startsWith("http")) return null;
  if (edition === 1) return path.join("public", imgPath.replace(/^\/+/, ""));
  return imgPath.replace(/\\/g, "/");
}

// ── Step 1: Delete stale documents ──────────────────────────────────────────
async function deleteStale() {
  console.log("\n── Step 1: Delete stale wrong-ID documents ──");
  for (const id of STALE_IDS) {
    try {
      await db.collection("articles").doc(id).delete();
      console.log(`  [deleted] ${id}`);
    } catch (e) {
      console.warn(`  [skip]    ${id}: ${e.message}`);
    }
  }
}

// ── Step 2: Re-upload Edition-2 with correct IDs ─────────────────────────────
async function uploadEdition2() {
  const jsonPath = "extracted/articles.json";
  if (!fs.existsSync(jsonPath)) {
    console.error("extracted/articles.json not found. Run extract_docx.py first.");
    process.exit(1);
  }
  const articles = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`\n── Step 2: Upload ${articles.length} Edition-2 articles ──`);

  for (const art of articles) {
    const { displayId, featuredImage, authorImage } = art;
    const imageUpdates = {};

    const featLocal = resolveLocalPath(featuredImage, 2);
    if (featLocal) {
      const url = await uploadImage(featLocal, `articles/${displayId}/featured.jpg`);
      if (url) imageUpdates.featuredImage = url;
    }

    const authLocal = resolveLocalPath(authorImage, 2);
    if (authLocal) {
      const url = await uploadImage(authLocal, `articles/${displayId}/author.jpg`);
      if (url) imageUpdates.authorImage = url;
    }

    await db.collection("articles").doc(displayId).set(
      { ...art, ...imageUpdates, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    console.log(`  [db-ok]   ${displayId}: ${art.title.slice(0, 55)}`);
  }
}

// ── Step 3: Restore Edition-1 articles 6.2, 6.3, 6.4 ───────────────────────
// These were overwritten in the previous bad upload run.
async function restoreEdition1() {
  const jsonPath = "extracted/existing_articles.json";
  if (!fs.existsSync(jsonPath)) {
    console.warn("existing_articles.json not found — skipping Ed-1 restore.");
    return;
  }
  const all = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const toRestore = all.filter((a) => ["6.2", "6.3", "6.4"].includes(a.displayId));
  console.log(`\n── Step 3: Restore ${toRestore.length} Edition-1 articles (6.2, 6.3, 6.4) ──`);

  for (const art of toRestore) {
    const { displayId, featuredImage, authorImage } = art;
    const imageUpdates = {};

    const featLocal = resolveLocalPath(featuredImage, 1);
    if (featLocal) {
      const url = await uploadImage(featLocal, `articles/${displayId}/featured.jpg`);
      if (url) imageUpdates.featuredImage = url;
    }

    const authLocal = resolveLocalPath(authorImage, 1);
    if (authLocal) {
      const url = await uploadImage(authLocal, `articles/${displayId}/author.jpg`);
      if (url) imageUpdates.authorImage = url;
    }

    await db.collection("articles").doc(displayId).set(
      { ...art, ...imageUpdates, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    console.log(`  [db-ok]   ${displayId}: ${art.title.slice(0, 55)}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await deleteStale();
    await uploadEdition2();
    await restoreEdition1();
    console.log("\n✓ Fix complete.");
    console.log("  Note: article 6.7 = TedxDepartmentofCommerce 2026 is CORRECT.");
    console.log("  The old duplicate was at 6.4 (wrong ID) — now 6.4 is restored to Edition-1 content.");
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  }
})();
