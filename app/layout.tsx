import "./globals.css";

import { Suspense } from "react";
import LiquidEtherBackground from "@/components/backgrounds/LiquidEtherBackground";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <Suspense fallback={null}>
          <LiquidEtherBackground deferUntilInteraction />
        </Suspense>
        {/* Let pages decide about headers / chrome */}
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
