/**
 * Reads .env.local and adds every key to Vercel for all three environments.
 * Handles FIREBASE_ADMIN_PRIVATE_KEY newline conversion automatically.
 * Run: node scripts/add_vercel_env.js
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
const raw = fs.readFileSync(envPath, "utf8");

const vars = {};
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  // Strip surrounding quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  vars[key] = value;
}

// Convert escaped \n sequences to real newlines in private key
if (vars.FIREBASE_ADMIN_PRIVATE_KEY) {
  vars.FIREBASE_ADMIN_PRIVATE_KEY = vars.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
}

const environments = ["production", "preview", "development"];

for (const [key, value] of Object.entries(vars)) {
  for (const env of environments) {
    try {
      execSync(`vercel env add ${key} ${env} --force`, {
        input: value,
        stdio: ["pipe", "pipe", "pipe"],
      });
      console.log(`✓ ${key} → ${env}`);
    } catch (e) {
      const msg = e.stderr?.toString() || e.message;
      console.error(`✗ ${key} → ${env}: ${msg.trim()}`);
    }
  }
}

console.log("\nAll env vars processed.");
