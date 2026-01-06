import "server-only";

import { promises as fs } from "fs";
import path from "path";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

async function walkForImages(currentDir: string, rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await walkForImages(entryPath, rootDir);
      results.push(...nested);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const relativePath = path.relative(rootDir, entryPath).split(path.sep).join("/");
    results.push(`/${relativePath}`);
  }

  return results;
}

export async function getPublicImagePaths(): Promise<string[]> {
  const publicDir = path.join(process.cwd(), "public");
  return walkForImages(publicDir, publicDir);
}
