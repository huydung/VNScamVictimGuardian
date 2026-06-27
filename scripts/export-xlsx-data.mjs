import fs from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";

const SOURCE = process.env.TINH_DATA_XLSX ??
  "outputs/2026-06-27-tinh-split-stage3-enriched/TINH_MVP_engine_data_v0_7_source_clean.xlsx";
const OUT_DIR = "public/data";
const RUNTIME_HEADER_MARKERS = new Set([
  "account_id",
  "action_id",
  "asset_id",
  "beat_id",
  "case_id",
  "char_id",
  "choice_id",
  "customer_id",
  "doc_id",
  "ending_id",
  "key",
  "resolution_id",
  "statement_id",
  "tactic_id",
]);

function normalizeValue(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    if (trimmed === "TRUE") return true;
    if (trimmed === "FALSE") return false;
    return trimmed;
  }
  return value;
}

function rowObjects(sheet) {
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  const nonEmpty = matrix.filter((row) => row.some((cell) => cell != null && cell !== ""));
  const [titleRow, headerRow, ...rows] = nonEmpty;
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  const objects = rows
    .map((row) => {
      const object = {};
      headers.forEach((header, index) => {
        if (!header) return;
        object[header] = normalizeValue(row[index]);
      });
      return object;
    })
    .filter((row) => Object.values(row).some((value) => value != null));
  return { title: titleRow?.[0] ?? "", headers, rows: objects };
}

function fileBaseFromSheetName(sheetName) {
  const parts = sheetName
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "sheet";
  return parts
    .map((part, index) => {
      if (index === 0) return part.charAt(0).toLowerCase() + part.slice(1);
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function configObject(rows) {
  const config = {};
  for (const row of rows) {
    if (!row.key) continue;
    config[row.key] = row.value;
  }
  return config;
}

function isRuntimeTable(headers) {
  return headers.some((header) => RUNTIME_HEADER_MARKERS.has(header));
}

const workbook = XLSX.readFile(SOURCE);
await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const manifest = {
  sourceWorkbook: SOURCE,
  generatedBy: "scripts/export-xlsx-data.mjs",
  files: {},
};
let exportedCount = 0;

for (const sheetName of workbook.SheetNames) {
  const fileBase = fileBaseFromSheetName(sheetName);
  const sheet = workbook.Sheets[sheetName];
  const { title, headers, rows } = rowObjects(sheet);
  if (!isRuntimeTable(headers)) continue;
  const fileName = `${fileBase}.json`;
  manifest.files[fileBase] = fileName;
  exportedCount += 1;
  await fs.writeFile(
    path.join(OUT_DIR, fileName),
    JSON.stringify({ title, rows }, null, 2),
    "utf8",
  );
  if (fileBase === "config") {
    await fs.writeFile(
      path.join(OUT_DIR, "runtimeConfig.json"),
      JSON.stringify({ title, values: configObject(rows), rows }, null, 2),
      "utf8",
    );
    manifest.files.runtimeConfig = "runtimeConfig.json";
  }
}

await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Exported ${exportedCount} runtime sheets from ${SOURCE} to ${OUT_DIR}`);
