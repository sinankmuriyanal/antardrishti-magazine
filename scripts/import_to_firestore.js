/**
 * import_to_firestore.js
 * Seeds Firestore with sections + all articles (edition-1 from HTML migration,
 * edition-2 from docx extraction). Uploads images to Firebase Storage.
 *
 * Usage:
 *   node -e "require('dotenv').config({path:'.env.local'})" scripts/import_to_firestore.js
 *   OR: node --env-file=.env.local scripts/import_to_firestore.js
 *
 * Requires:
 *   npm install firebase-admin dotenv
 *   .env.local with FIREBASE_ADMIN_* keys set
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ── Init ──────────────────────────────────────────────────────────────────────
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* env vars. Copy .env.local.example → .env.local and fill in values.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  storageBucket,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ── Sections seed data ────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "section-1", number: 1, name: "Editorial",        slug: "editorial",         description: "Editorial perspectives from DSE faculty and leadership", order: 1 },
  { id: "section-2", number: 2, name: "Management",       slug: "management",        description: "Management insights and industry perspectives",           order: 2 },
  { id: "section-3", number: 3, name: "Analytics",        slug: "analytics",         description: "Data analytics, AI, and technology deep-dives",          order: 3 },
  { id: "section-4", number: 4, name: "What's Buzzing",   slug: "whats-buzzing",     description: "Trending topics and current affairs in business",         order: 4 },
  { id: "section-5", number: 5, name: "Social",           slug: "social",            description: "Social issues, diversity, and sustainability",            order: 5 },
  { id: "section-6", number: 6, name: "Campus Chronicles",slug: "campus-chronicles", description: "DSE campus life, events, and student stories",           order: 6 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function uploadImage(localPath, destPath) {
  if (!localPath || !fs.existsSync(localPath)) return localPath; // return as-is if already a URL or missing
  try {
    await bucket.upload(localPath, { destination: destPath, metadata: { cacheControl: "public, max-age=31536000" } });
    const file = bucket.file(destPath);
    await file.makePublic();
    return `https://storage.googleapis.com/${storageBucket}/${destPath}`;
  } catch (e) {
    console.warn(`  Could not upload ${localPath}: ${e.message}`);
    return localPath;
  }
}

function toTimestamp(isoOrNull) {
  if (!isoOrNull) return admin.firestore.FieldValue.serverTimestamp();
  return admin.firestore.Timestamp.fromDate(new Date(isoOrNull));
}

// ── Seed sections ─────────────────────────────────────────────────────────────
async function seedSections() {
  console.log("\n── Seeding sections ──");
  const batch = db.batch();
  for (const s of SECTIONS) {
    const ref = db.collection("sections").doc(s.id);
    batch.set(ref, s, { merge: true });
    console.log(`  ${s.id}: ${s.name}`);
  }
  await batch.commit();
  console.log("  Sections done.");
}

// ── Import articles ───────────────────────────────────────────────────────────
async function importArticles(jsonPath, label) {
  if (!fs.existsSync(jsonPath)) {
    console.warn(`  Skipping ${label}: ${jsonPath} not found.`);
    return;
  }

  const articles = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`\n── Importing ${articles.length} ${label} articles ──`);

  for (const art of articles) {
    // Upload images if they are local paths
    if (art.featuredImage && !art.featuredImage.startsWith("http")) {
      const local = art.featuredImage.replace(/^\//, ""); // strip leading /
      art.featuredImage = await uploadImage(local, `articles/${art.displayId}/featured.jpg`);
    }
    if (art.authorImage && !art.authorImage.startsWith("http")) {
      const local = art.authorImage.replace(/^\//, "");
      art.authorImage = await uploadImage(local, `articles/${art.displayId}/author.jpg`);
    }

    const doc = {
      ...art,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    delete doc._body_paragraphs;

    // Use displayId as document ID for easy lookup
    await db.collection("articles").doc(art.displayId).set(doc, { merge: true });
    console.log(`  ${art.displayId}: ${art.title.slice(0, 60)}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await seedSections();
    await importArticles("extracted/existing_articles.json", "edition-1");
    await importArticles("extracted/articles.json", "edition-2");
    console.log("\n✓ Import complete. Check Firestore console to verify.");
  } catch (e) {
    console.error("Import failed:", e);
    process.exit(1);
  }
})();
