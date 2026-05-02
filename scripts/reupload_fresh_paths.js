/**
 * reupload_fresh_paths.js
 * Uploads all Edition-2 images to NEW versioned Storage paths (articles/v2/...)
 * so the URLs change and bypass any CDN / browser cache from earlier bad uploads.
 * Rewrites Firestore authorImage, featuredImage, and content img src URLs.
 *
 * Run from antardrishti-magazine/:
 *   node --env-file=.env.local scripts/reupload_fresh_paths.js
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const pk = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: pk,
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const VERSION = "v2"; // bump this whenever we need cache-busted re-uploads

async function upload(localPath, destPath) {
  const normalized = localPath.replace(/\\/g, "/");
  if (!normalized || !fs.existsSync(normalized)) {
    console.warn(`  [skip] ${normalized}`);
    return null;
  }
  await bucket.upload(normalized, {
    destination: destPath,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  await bucket.file(destPath).makePublic();
  return `https://storage.googleapis.com/${BUCKET}/${destPath}`;
}

function localPath(imgPath) {
  if (!imgPath || imgPath.startsWith("http")) return null;
  return imgPath.replace(/\\/g, "/");
}

(async () => {
  const articles = JSON.parse(fs.readFileSync("extracted/articles.json", "utf8"));
  console.log(`\nRe-uploading ${articles.length} Edition-2 articles to /${VERSION}/...\n`);

  for (const art of articles) {
    const { displayId, featuredImage, authorImage } = art;
    const updates = {};

    // Featured
    const fl = localPath(featuredImage);
    if (fl) {
      const url = await upload(fl, `articles/${VERSION}/${displayId}/featured.jpg`);
      if (url) { updates.featuredImage = url; console.log(`  [feat] ${displayId}`); }
    }

    // Author
    const al = localPath(authorImage);
    if (al) {
      const url = await upload(al, `articles/${VERSION}/${displayId}/author.jpg`);
      if (url) { updates.authorImage = url; console.log(`  [auth] ${displayId}`); }
    }

    // Body images in content HTML
    let content = art.content || "";
    const imgRegex = /<img\s+src="(extracted\/images\/[^"]+)"/g;
    let match;
    let bodyIdx = 0;
    const replacements = [];
    while ((match = imgRegex.exec(content)) !== null) {
      if (fs.existsSync(match[1])) {
        replacements.push({ src: match[1], dest: `articles/${VERSION}/${displayId}/body-${bodyIdx}.jpg` });
        bodyIdx++;
      }
    }
    for (const { src, dest } of replacements) {
      const url = await upload(src, dest);
      if (url) {
        content = content.replace(`src="${src}"`, `src="${url}"`);
        console.log(`  [body] ${displayId} body-${replacements.indexOf({ src, dest })}`);
      }
    }
    if (replacements.length) updates.content = content;

    // Write to Firestore
    const doc = { ...art, ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    delete doc._bodyImagePaths;
    await db.collection("articles").doc(displayId).set(doc, { merge: true });
    console.log(`  [db]  ${displayId}: ${art.title.slice(0, 55)}`);
  }

  console.log("\n✓ Done. All URLs point to fresh /v2/ paths — cache busted.");
  process.exit(0);
})();
