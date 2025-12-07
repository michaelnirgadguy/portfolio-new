import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 h-12 bg-[hsl(var(--card))]/80 backdrop-blur border-b border-[hsl(var(--border))]">
      <div className="mx-auto flex h-full w-full max-w-4xl items-center gap-3 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Michael Nirgad Guy"
            width={22}
            height={22}
            className="rounded-md"
            priority
          />
        </Link>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Michael Nirgad Guy&nbsp;|&nbsp;Interactive Video Portfolio
        </span>
      </div>
    </header>
  );
}
