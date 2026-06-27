import fs from "node:fs";
import path from "node:path";

const DATA_DIR = "public/data";
const ASSET_DIR = "public/assets";

const REQUIRED_FILES = [
  "assetRefs.json",
  "beats.json",
  "characters.json",
  "choices.json",
  "config.json",
  "customers.json",
  "documents.json",
  "endings.json",
  "linkedAccounts.json",
  "manifest.json",
  "runtimeConfig.json",
  "s2Resolutions.json",
  "s3Hubs.json",
  "statements.json",
  "tactics.json",
];

const BACKGROUND_FILES = {
  bg_bank_counter: "backgrounds/bank.png",
  bg_consult_desk: "backgrounds/consult.png",
  bg_home: "backgrounds/home.png",
  bg_temple: "backgrounds/temple.png",
};

const SPECIAL_CHARACTERS = new Set(["guidebook", "narrator", "player", "system"]);
const SPECIAL_DOCUMENT_OWNERS = new Set(["MOM", "S3"]);
const VIRTUAL_BEATS = new Set(["HUB_D1", "HUB_D2"]);

const errors = [];

function readData(file) {
  const fullPath = path.join(DATA_DIR, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing data file: ${fullPath}`);
    return { rows: [] };
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function idSet(rows, field, label) {
  const ids = new Set();
  for (const row of rows) {
    const id = row[field];
    if (!id) {
      errors.push(`${label} row missing ${field}`);
      continue;
    }
    if (ids.has(id)) errors.push(`${label} has duplicate ${field}: ${id}`);
    ids.add(id);
  }
  return ids;
}

function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function assetExists(relativePath) {
  return fs.existsSync(path.join(ASSET_DIR, relativePath));
}

function resolveCharacterAsset(raw) {
  if (!raw) return null;
  const id = String(raw).replace(/^char_/, "");
  if (id.startsWith("me_")) return "me";
  if (id.startsWith("thay_scammer") || id.startsWith("thay")) return "thay_scammer";
  if (id.startsWith("ba_hanh")) return "ba_hanh";
  if (id.startsWith("anh_tam")) return "anh_tam";
  if (id.startsWith("son")) return "son";
  if (id.startsWith("player")) return "player";
  if (id.startsWith("di_tu")) return "di_tu";
  if (id.startsWith("su_thay")) return "su_thay";
  return id.split("_")[0] || null;
}

function validateRuntimeConfig(runtimeConfig, beatIds) {
  const values = runtimeConfig.values ?? {};
  const firstBeat = values["flow.firstBeat"];
  if (!firstBeat || !beatIds.has(firstBeat)) {
    errors.push(`Config flow.firstBeat points to missing beat: ${firstBeat}`);
  }
  const clamp = values["meter.clamp"];
  const clampParts = typeof clamp === "string" ? clamp.match(/-?\d+(?:\.\d+)?/g) : null;
  if (!clampParts || clampParts.length < 2 || Number(clampParts[0]) >= Number(clampParts[1])) {
    errors.push(`Config meter.clamp must contain an ascending [min,max] range: ${clamp}`);
  }
  for (const key of [
    "meter.money.start",
    "meter.openness.start",
    "meter.relationship.start",
    "meter.wellbeing.start",
    "s1.repStart",
  ]) {
    const value = Number(values[key]);
    if (!Number.isFinite(value)) errors.push(`Config ${key} must be numeric`);
  }
}

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(DATA_DIR, file))) errors.push(`Missing required runtime JSON: ${file}`);
}

const beats = readData("beats.json").rows;
const choices = readData("choices.json").rows;
const characters = readData("characters.json").rows;
const customers = readData("customers.json").rows;
const documents = readData("documents.json").rows;
const tactics = readData("tactics.json").rows;
const s3Hubs = readData("s3Hubs.json").rows;
const assetRefs = readData("assetRefs.json").rows;
const runtimeConfig = readData("runtimeConfig.json");

const beatIds = idSet(beats, "beat_id", "Beats");
const characterIds = idSet(characters, "char_id", "Characters");
const customerIds = idSet(customers, "customer_id", "Customers");
const documentIds = idSet(documents, "doc_id", "Documents");
const tacticIds = idSet(tactics, "tactic_id", "Tactics");
idSet(choices, "choice_id", "Choices");
idSet(s3Hubs, "action_id", "S3_Hubs");
idSet(assetRefs, "asset_id", "AssetRefs");

validateRuntimeConfig(runtimeConfig, beatIds);

for (const customer of customers) {
  if (!characterIds.has(customer.char_id)) errors.push(`Customer ${customer.customer_id} references missing char_id: ${customer.char_id}`);
  for (const tacticId of splitList(customer.tactics)) {
    if (!tacticIds.has(tacticId)) errors.push(`Customer ${customer.customer_id} references missing tactic: ${tacticId}`);
  }
}

for (const document of documents) {
  if (document.customer_id && !customerIds.has(document.customer_id) && !SPECIAL_DOCUMENT_OWNERS.has(document.customer_id)) {
    errors.push(`Document ${document.doc_id} references missing customer_id: ${document.customer_id}`);
  }
  for (const tacticId of splitList(document.tactic_id)) {
    if (!tacticIds.has(tacticId)) errors.push(`Document ${document.doc_id} references missing tactic_id: ${tacticId}`);
  }
  if (!assetExists(`documents/${document.doc_id}.png`)) {
    errors.push(`Document ${document.doc_id} is missing PNG asset: public/assets/documents/${document.doc_id}.png`);
  }
}

for (const beat of beats) {
  if (beat.customer_id && !customerIds.has(beat.customer_id)) errors.push(`Beat ${beat.beat_id} references missing customer_id: ${beat.customer_id}`);
  if (beat.next_beat_id && !beatIds.has(beat.next_beat_id) && !VIRTUAL_BEATS.has(beat.next_beat_id)) {
    errors.push(`Beat ${beat.beat_id} next_beat_id missing: ${beat.next_beat_id}`);
  }
  if (beat.speaker_id && !SPECIAL_CHARACTERS.has(beat.speaker_id) && !characterIds.has(beat.speaker_id)) {
    errors.push(`Beat ${beat.beat_id} speaker_id missing: ${beat.speaker_id}`);
  }
  if (beat.reveal_tactic && !tacticIds.has(beat.reveal_tactic)) {
    errors.push(`Beat ${beat.beat_id} reveal_tactic missing: ${beat.reveal_tactic}`);
  }
  if (beat.bg_asset) {
    const bgPath = BACKGROUND_FILES[beat.bg_asset];
    if (!bgPath) errors.push(`Beat ${beat.beat_id} bg_asset has no runtime mapping: ${beat.bg_asset}`);
    else if (!assetExists(bgPath)) errors.push(`Beat ${beat.beat_id} missing background PNG: ${bgPath}`);
  }
  if (beat.char_asset) {
    const characterAsset = resolveCharacterAsset(beat.char_asset);
    if (!characterAsset || !assetExists(`characters/${characterAsset}.png`)) {
      errors.push(`Beat ${beat.beat_id} char_asset missing PNG: ${beat.char_asset}`);
    }
  }
  for (const docId of splitList(beat.doc_assets)) {
    if (!documentIds.has(docId)) errors.push(`Beat ${beat.beat_id} references missing doc_assets id: ${docId}`);
  }
}

for (const choice of choices) {
  if (!beatIds.has(choice.beat_id)) errors.push(`Choice ${choice.choice_id} references missing beat_id: ${choice.beat_id}`);
  if (choice.goto && !beatIds.has(choice.goto) && !VIRTUAL_BEATS.has(choice.goto)) {
    errors.push(`Choice ${choice.choice_id} goto missing: ${choice.goto}`);
  }
  if (choice.reveal_tactic && !tacticIds.has(choice.reveal_tactic)) {
    errors.push(`Choice ${choice.choice_id} reveal_tactic missing: ${choice.reveal_tactic}`);
  }
}

const s3FirstScenes = new Set(beats.filter((beat) => beat.stage === "S3" && beat.beat_idx === 1).map((beat) => beat.scene));
for (const action of s3Hubs) {
  if (!s3FirstScenes.has(action.opens_scene)) {
    errors.push(`S3_Hubs ${action.action_id} opens missing S3 first scene: ${action.opens_scene}`);
  }
}

for (const ref of assetRefs) {
  const id = ref.asset_id;
  if (id.startsWith("bg_") && !BACKGROUND_FILES[id]) errors.push(`AssetRefs background has no runtime mapping: ${id}`);
  if (id.startsWith("doc_") && !assetExists(`documents/${id}.png`)) errors.push(`AssetRefs document missing PNG: ${id}`);
  if (id.startsWith("char_")) {
    const characterAsset = resolveCharacterAsset(id);
    if (!characterAsset || !assetExists(`characters/${characterAsset}.png`)) errors.push(`AssetRefs character missing PNG: ${id}`);
  }
}

if (errors.length > 0) {
  console.error(`Data validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Data validation passed.");
