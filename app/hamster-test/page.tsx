import HamsterClip from "@/components/acts/HamsterClip";

export default function HamsterTestPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Hamster Test Page</h1>
      <HamsterClip srcBase="/vid/disco-hamster" />
    </main>
  );
}
