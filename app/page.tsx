import { Suspense } from "react";
import Header from "@/components/Header";
import Chat from "@/components/Chat";
import { getAllVideos } from "@/lib/videos";

export default async function Home() {
  const videos = await getAllVideos();

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <Suspense fallback={null}>
        <Chat initialVideos={videos} />
      </Suspense>
    </main>
  );
}
