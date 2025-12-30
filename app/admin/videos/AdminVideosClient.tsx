"use client";

import { useEffect, useMemo, useState } from "react";
import type { VideoItem } from "@/types/video";

const EMPTY_VIDEO: VideoItem = {
  id: "",
  title: "",
  url: "",
  thumbnail: "",
  client: null,
  description: null,
  language: null,
  duration_seconds: null,
  priority: null,
  tags: null,
  my_roles: null,
  long_description: null,
  display_credits: null,
  related_ids: null,
};

const COLUMN_LABELS: { key: keyof VideoItem; label: string; wide?: boolean }[] = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
  { key: "client", label: "Client" },
  { key: "url", label: "Video URL", wide: true },
  { key: "thumbnail", label: "Thumbnail URL", wide: true },
  { key: "description", label: "Description", wide: true },
  { key: "language", label: "Lang" },
  { key: "duration_seconds", label: "Duration (sec)" },
  { key: "priority", label: "Priority" },
  { key: "tags", label: "Tags" },
  { key: "my_roles", label: "Roles" },
  { key: "long_description", label: "Long Description", wide: true },
  { key: "display_credits", label: "Credits", wide: true },
  { key: "related_ids", label: "Related IDs" },
];

function serializeList(value: string | string[] | null) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseList(value: string) {
  const cleaned = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : null;
}

function normalizeVideo(video: VideoItem): VideoItem {
  return {
    id: video.id.trim(),
    title: video.title.trim(),
    url: video.url.trim(),
    thumbnail: video.thumbnail.trim(),
    client: normalizeText(serializeList(video.client)),
    description: normalizeText(serializeList(video.description)),
    language: normalizeText(serializeList(video.language)),
    duration_seconds:
      typeof video.duration_seconds === "number" && !Number.isNaN(video.duration_seconds)
        ? video.duration_seconds
        : null,
    priority: normalizeText(serializeList(video.priority)),
    tags: Array.isArray(video.tags) ? video.tags : parseList(serializeList(video.tags)),
    my_roles: Array.isArray(video.my_roles)
      ? video.my_roles
      : parseList(serializeList(video.my_roles)),
    long_description: normalizeText(serializeList(video.long_description)),
    display_credits: normalizeText(serializeList(video.display_credits)),
    related_ids: Array.isArray(video.related_ids)
      ? video.related_ids
      : parseList(serializeList(video.related_ids)),
  };
}

export default function AdminVideosClient() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [status, setStatus] = useState<string>("Loading...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/videos")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load videos.");
        const data = (await res.json()) as { videos: VideoItem[] };
        if (active) {
          setVideos(data.videos ?? []);
          setStatus("");
        }
      })
      .catch((error: Error) => {
        if (active) setStatus(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () => videos.map((video) => ({ ...EMPTY_VIDEO, ...video })),
    [videos]
  );

  const handleChange = (
    index: number,
    key: keyof VideoItem,
    value: string
  ) => {
    setVideos((prev) => {
      const next = [...prev];
      const updated = { ...next[index] } as VideoItem;

      if (key === "duration_seconds") {
        updated.duration_seconds = value ? Number(value) : null;
      } else if (key === "tags" || key === "my_roles" || key === "related_ids") {
        updated[key] = parseList(value);
      } else {
        updated[key] = value as never;
      }

      next[index] = updated;
      return next;
    });
  };

  const handleAdd = () => {
    setVideos((prev) => [...prev, { ...EMPTY_VIDEO }]);
  };

  const handleDelete = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("");

    const cleaned = videos.map(normalizeVideo);

    try {
      const response = await fetch("/api/admin/videos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videos: cleaned }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "Failed to save videos.");
      }

      setStatus("Saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save.";
      setStatus(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
          onClick={handleAdd}
        >
          Add video
        </button>
        <button
          type="button"
          className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {status ? (
          <p className="text-sm text-white/70">{status}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
            <tr>
              <th className="px-3 py-3">Actions</th>
              {COLUMN_LABELS.map((column) => (
                <th key={column.key} className="px-3 py-3">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((video, index) => (
              <tr key={`${video.id}-${index}`} className="align-top">
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-300 hover:text-red-200"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </td>
                {COLUMN_LABELS.map((column) => {
                  const value = video[column.key];
                  const displayValue =
                    typeof value === "number"
                      ? String(value)
                      : serializeList(value as string | string[] | null);

                  const isTextArea = column.wide;
                  return (
                    <td key={column.key} className="px-3 py-3">
                      {isTextArea ? (
                        <textarea
                          className="min-h-[72px] w-56 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white outline-none focus:border-[var(--accent)]"
                          value={displayValue}
                          onChange={(event) =>
                            handleChange(index, column.key, event.target.value)
                          }
                        />
                      ) : (
                        <input
                          className="w-44 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white outline-none focus:border-[var(--accent)]"
                          value={displayValue}
                          onChange={(event) =>
                            handleChange(index, column.key, event.target.value)
                          }
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td
                  colSpan={COLUMN_LABELS.length + 1}
                  className="px-3 py-6 text-center text-white/60"
                >
                  No videos yet. Click “Add video” to get started.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
