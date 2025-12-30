import AdminVideosClient from "@/app/admin/videos/AdminVideosClient";

export const metadata = {
  title: "Video Admin",
};

export default function AdminVideosPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">Video Catalog Editor</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Update the video list without touching the JSON file directly. Edit fields,
            add rows, or remove entries, then save to persist the catalog.
          </p>
        </header>
        <AdminVideosClient />
      </div>
    </main>
  );
}
