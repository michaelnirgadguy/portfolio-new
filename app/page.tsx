"use client";

import Header from "@/components/Header";
import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <Header />
      <Chat />
    </main>
  );
}
