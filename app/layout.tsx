"use client";

import "./globals.css";
import Header from "@/components/Header";
import { Acts } from "@/lib/acts";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    try {
      // In your code:
      // - "none" means the visitor has NOT completed Act1
      // - "1", "2", "all" are post-Act1 phases
      const act = Acts.get();
      setShowHeader(act !== "none");
    } catch {
      setShowHeader(true);
    }
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Only render header after Act1 */}
        {showHeader && <Header />}

        {/* If header is hidden, main should use full height */}
        <main
          className={
            showHeader
              ? "h-[calc(100vh-64px)] overflow-hidden"
              : "h-[100vh] overflow-hidden"
          }
        >
          {children}
        </main>
      </body>
    </html>
  );
}
