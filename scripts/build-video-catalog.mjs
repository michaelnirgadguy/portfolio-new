import fs from "node:fs/promises";
import path from "node:path";

const CATALOG_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsyffgrGna9bQ93whnV7qqpjQxFvUx2uzrLlKlt96APcNyo603v9i7C-eKk_3pVtnWDSd_ervGcx3W/pub?output=csv";

// CSV list delimiter for array fields like tags, my_roles, and related_ids.
const LIST_DELIMITER = "|";

const REQUIRED_HEADERS = [
  "id",
  "title",
  "url",
  "thumbnail",
  "client",
  "description",
  "language",
  "duration_seconds",
  "priority",
  "tags",
  "my_roles",
  "long_description",
  "display_credits",
  "related_ids",
];

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        const nextChar = text[i + 1];
        if (nextChar === '"') {
          currentValue += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length || currentRow.length) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

function buildHeaderIndex(headers) {
  const normalized = headers.map((header) => header.trim());
  const indexMap = new Map();

  normalized.forEach((header, index) => {
    indexMap.set(header, index);
  });

  const missing = REQUIRED_HEADERS.filter((header) => !indexMap.has(header));
  if (missing.length) {
    throw new Error(`Missing required CSV headers: ${missing.join(", ")}`);
  }

  return REQUIRED_HEADERS.reduce((acc, header) => {
    acc[header] = indexMap.get(header) ?? -1;
    return acc;
  }, {});
}

function getCell(row, index) {
  return row[index] ?? "";
}

function parseRequiredString(row, index, header) {
  const value = getCell(row, index).trim();
  if (!value) {
    throw new Error(`Missing required value for column: ${header}`);
  }
  return value;
}

function parseOptionalString(row, index) {
  const value = getCell(row, index).trim();
  return value ? value : null;
}

function parseOptionalNumber(row, index) {
  const value = getCell(row, index).trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalList(row, index) {
  const value = getCell(row, index).trim();
  if (!value) return null;
  const items = value
    .split(LIST_DELIMITER)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function isEmptyRow(row) {
  return row.every((cell) => cell.trim() === "");
}

async function fetchCatalog() {
  const response = await fetch(CATALOG_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch video catalog: ${response.status}`);
  }

  const text = await response.text();
  const rows = parseCsv(text).filter((row) => !isEmptyRow(row));

  if (!rows.length) {
    return [];
  }

  const headers = rows[0];
  const headerIndex = buildHeaderIndex(headers);

  return rows.slice(1).map((row) => ({
    id: parseRequiredString(row, headerIndex.id, "id"),
    title: parseRequiredString(row, headerIndex.title, "title"),
    url: parseRequiredString(row, headerIndex.url, "url"),
    thumbnail: parseRequiredString(row, headerIndex.thumbnail, "thumbnail"),
    client: parseOptionalString(row, headerIndex.client),
    description: parseOptionalString(row, headerIndex.description),
    language: parseOptionalString(row, headerIndex.language),
    duration_seconds: parseOptionalNumber(row, headerIndex.duration_seconds),
    priority: parseOptionalString(row, headerIndex.priority),
    tags: parseOptionalList(row, headerIndex.tags),
    my_roles: parseOptionalList(row, headerIndex.my_roles),
    long_description: parseOptionalString(row, headerIndex.long_description),
    display_credits: parseOptionalString(row, headerIndex.display_credits),
    related_ids: parseOptionalList(row, headerIndex.related_ids),
  }));
}

async function main() {
  const catalog = await fetchCatalog();
  const outputPath = path.join(process.cwd(), "data", "videos.json");

  await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Wrote ${catalog.length} videos to ${outputPath}`);
}

try {
  await main();
} catch (error) {
  console.error("Failed to build video catalog:", error);
  process.exitCode = 1;
}
