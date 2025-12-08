import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Let pages decide about headers / chrome */}
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
