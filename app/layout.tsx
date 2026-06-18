import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-950">
        {/* Let pages decide about headers / chrome */}
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
