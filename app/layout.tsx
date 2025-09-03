import "./globals.css"
import Header from "@/components/Header"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        {/* Fill viewport minus 64px header; prevent page scrolling */}
        <main className="h-[calc(100vh-64px)] overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
