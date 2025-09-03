// components/Header.tsx
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-transparent transition-colors hover:border-[#BF8EFF]">
      <div className="mx-auto h-full max-w-7xl px-6 py-3 flex items-center gap-3">
        <Link href="/" className="group inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Michael Nirgad Guy"
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
