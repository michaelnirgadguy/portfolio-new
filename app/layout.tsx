import "./globals.css"
import Header from "@/components/Header"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-clip">
        <Header />
        {/* on desktop: Fill viewport minus 64px header; prevent page scrolling. on mobile: 100svh and no overflow-hidden. */}
         <main className="h-auto md:h-[calc(100vh-64px)] md:overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
