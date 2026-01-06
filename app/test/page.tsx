import Header from "@/components/Header";
import DesignPlayground from "@/components/DesignPlayground";
import { getPublicImagePaths } from "@/lib/publicImages";
import { getAllVideos } from "@/lib/videos";

export default async function DesignTestPage() {
  const [videos, backgroundImages] = await Promise.all([getAllVideos(), getPublicImagePaths()]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <DesignPlayground videos={videos} backgroundImages={backgroundImages} />
    </div>
  );
}
