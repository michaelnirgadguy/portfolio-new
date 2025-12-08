"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={null}>
        <Chat />
      </Suspense>
    </main>
  );
}
