import path from "path";
import { promises as fs } from "fs";
import DesignLabClient from "./DesignLabClient";
import type { VideoItem } from "@/types/video";
import videos from "@/data/videos.json";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);

async function listPublicImages(rootDir: string) {
  const images: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;

      const relativePath = path.relative(rootDir, fullPath).split(path.sep).join("/");
      images.push(relativePath);
    }
  }

  await walk(rootDir);

  return images.sort((a, b) => a.localeCompare(b));
}

export default async function DesignLabPage() {
  const publicDir = path.join(process.cwd(), "public");
  const backgroundImages = await listPublicImages(publicDir);

  return (
    <DesignLabClient
      videos={videos as VideoItem[]}
      backgroundImages={backgroundImages}
    />
  );
}
