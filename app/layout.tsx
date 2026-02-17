import "./globals.css";

import BackgroundRuntime from "@/components/BackgroundRuntime";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <BackgroundRuntime>{children}</BackgroundRuntime>
      </body>
    </html>
  );
}
