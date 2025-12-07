import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function ProfileBubble() {
  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <Image
          src="/logo.png"
          alt="Michael Nirgad Guy"
          width={56}
          height={56}
          className="rounded-lg"
        />
        <div className="space-y-1">
          <div className="text-base font-semibold leading-tight">Michael Nirgad Guy</div>
          <div className="text-sm text-muted-foreground">Writer & Creative Director for video</div>
          <p className="text-sm text-muted-foreground">
            Scripts, concepts, and story development for tech-forward brands. Let’s build something delightful together.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="mailto:michael@mnx.works"
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm hover:border-foreground transition-colors"
        >
          Email
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <a
          href="https://www.linkedin.com/in/mnguy/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm hover:border-foreground transition-colors"
        >
          LinkedIn
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
        <a
          href="https://mnx.works"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm hover:border-foreground transition-colors"
        >
          Portfolio site
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
