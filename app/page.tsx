"use client";

import Header from "@/components/Header";
import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-background max-w-[680px] mx-auto border-x border-border shadow-2xl overflow-hidden relative">
      <Header />
      <Chat />
    </main>
  );
}
