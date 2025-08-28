// components/Header.tsx
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-3">
        <Link href="/" className="group inline-flex items-center gap-3">
          {/* Logo */}
          <Image
            src="/logo.png"            // put your PNG at /public/logo.png
            alt="Michael Nirgad Guy"
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          {/* Name (optional): subtle, with accent on hover */}
          <span className="text-sm font-medium tracking-tight">
            Michael Nirgad Guy
          </span>
        </Link>

        {/* Thin accent rule under header on hover focus (subtle) */}
        <style jsx>{`
          header:hover,
          header:focus-within {
            box-shadow: inset 0 -1px 0 0 #BF8EFF;
          }
        `}</style>
      </div>
    </header>
  );
}
