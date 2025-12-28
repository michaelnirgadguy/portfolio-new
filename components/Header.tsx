import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky inset-x-0 top-0 z-30 min-h-12 bg-[hsl(var(--card))]/80 backdrop-blur border-b border-[hsl(var(--border))] md:h-12">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-2 md:h-full md:px-6 md:py-0">
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

        <span className="text-xs text-muted-foreground whitespace-normal sm:text-sm sm:whitespace-nowrap">
          Michael Nirgad Guy&nbsp;|&nbsp;Interactive Video Portfolio
        </span>
      </div>
    </header>
  );
}
