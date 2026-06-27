import fs from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";

const SOURCE = process.env.TINH_DATA_XLSX ??
  "outputs/2026-06-27-tinh-split-stage3-enriched/TINH_MVP_engine_data_v0_6_stage3_enriched.xlsx";
const OUT_DIR = "public/data";

const sheets = [
  ["Tactics", "tactics"],
  ["Characters", "characters"],
  ["Customers", "customers"],
  ["Documents", "documents"],
  ["Statements", "statements"],
  ["LinkedAccounts", "linkedAccounts"],
  ["Beats", "beats"],
  ["Choices", "choices"],
  ["S2_Resolutions", "s2Resolutions"],
  ["S3_Hubs", "s3Hubs"],
  ["Endings", "endings"],
  ["Config", "configRows"],
  ["AssetRefs", "assetRefs"],
];

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
  return { title: titleRow?.[0] ?? "", rows: objects };
}

function configObject(rows) {
  const config = {};
  for (const row of rows) {
    if (!row.key) continue;
    config[row.key] = row.value;
  }
  return config;
}

function localizeRows(sheetName, rows) {
  if (sheetName === "Beats") {
    return rows.map((row) => {
      if (row.beat_id === "s0_00") {
        return {
          ...row,
          text_vi: "Chọn nhân vật của bạn — Nam / Nữ. Đây chỉ là lựa chọn chân dung; lời thoại vẫn dùng cách xưng hô trung tính.",
        };
      }
      return row;
    });
  }
  if (sheetName === "Characters") {
    return rows.map((row) => {
      if (row.char_id === "player") return { ...row, name_vi: "Bạn", function: "Nhân vật đại diện người chơi." };
      if (row.char_id === "system") return { ...row, name_vi: "Hệ thống", function: "Thông báo hệ thống và chuyển cảnh." };
      if (row.char_id === "narrator") return { ...row, name_vi: "Người kể", function: "Dẫn cảnh, không có chân dung." };
      if (row.char_id === "guidebook") return { ...row, name_vi: "Cẩm nang", function: "Lớp phủ cẩm nang 8 chiêu." };
      return row;
    });
  }
  return rows;
}

const workbook = XLSX.readFile(SOURCE);
await fs.mkdir(OUT_DIR, { recursive: true });

const manifest = {
  sourceWorkbook: SOURCE,
  generatedAt: new Date().toISOString(),
  files: {},
};

for (const [sheetName, fileBase] of sheets) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Missing required sheet: ${sheetName}`);
  const { title, rows: rawRows } = rowObjects(sheet);
  const rows = localizeRows(sheetName, rawRows);
  const fileName = `${fileBase}.json`;
  manifest.files[fileBase] = fileName;
  await fs.writeFile(
    path.join(OUT_DIR, fileName),
    JSON.stringify({ title, rows }, null, 2),
    "utf8",
  );
  if (sheetName === "Config") {
    await fs.writeFile(
      path.join(OUT_DIR, "runtimeConfig.json"),
      JSON.stringify({ title, values: configObject(rows), rows }, null, 2),
      "utf8",
    );
    manifest.files.runtimeConfig = "runtimeConfig.json";
  }
}

await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Exported ${sheets.length} sheets from ${SOURCE} to ${OUT_DIR}`);
