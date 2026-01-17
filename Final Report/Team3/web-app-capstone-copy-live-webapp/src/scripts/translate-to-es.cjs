const fs = require("fs");
const path = require("path");
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");

// Load the English source JSON
const en = require("../src/languages/en.json");

const REGION = process.env.AWS_REGION || "us-east-1";

const client = new TranslateClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function translateText(text) {
  const cmd = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: "en",
    TargetLanguageCode: "es"
  });
  const res = await client.send(cmd);
  return res.TranslatedText ?? text;
}

async function main() {
  console.log("Starting Spanish translation...");

  const result = {};
  const entries = Object.entries(en);

  for (const [key, value] of entries) {
    console.log("Translating:", key);
    try {
      const translated = await translateText(value);
      result[key] = translated;
    } catch (err) {
      console.error("Error translating key:", key, err);
      result[key] = value; // fallback to English
    }

    // small delay to avoid throttling
    await new Promise((r) => setTimeout(r, 150));
  }

  const outPath = path.join(process.cwd(), "src/languages/es.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");

  console.log("✔ Spanish translations saved to src/languages/es.json");
}

main().catch((err) => {
  console.error("Translation script failed:", err);
  process.exit(1);
});
