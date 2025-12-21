"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const messagePlaceholder = "Hey Michael, cool hasmter! Anyways, i wanted to ask…";

const CONTACTS = [
  { label: "Email", value: "michael.nirgadguy@gmail.com", icon: Mail },
  { label: "Phone", value: "+972 50 4441505", icon: Phone },
  { label: "ICQ", value: "6170791", icon: MessageCircle, playTone: true },
];

type Status = "idle" | "sent" | "error";

type ContactCardProps = {
  className?: string;
};

export default function ContactCard({ className }: ContactCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const subject = useMemo(() => {
    return `New message from ${name?.trim() || "a friend"}`;
  }, [name]);

  const playIcqTone = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const makeTone = (frequency: number, offset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.16, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.27);
    };

    makeTone(540, 0);
    makeTone(420, 0.25);
  };

  const copyToClipboard = async (value: string, label: string, withTone?: boolean) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopied(label);
      if (withTone) {
        playIcqTone();
      }
      setTimeout(() => setCopied((prev) => (prev === label ? null : prev)), 1600);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      setStatus("error");
      return;
    }

    setError(null);

    const lines = [
      `Name: ${name || "(not provided)"}`,
      `Email: ${email}`,
      "",
      message || "(no message)",
    ];

    const mailto = `mailto:michael.nirgadguy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;

    window.location.href = mailto;
    setStatus("sent");
  };

  return (
    <div className={cn("w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-y-0 md:divide-x">
        <div className="relative flex flex-col gap-4 p-6 bg-background/50">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Talk to me here</p>
            <h3 className="text-xl font-semibold text-foreground">Form-first, no pressure</h3>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
            <img
              src="/pointing.png"
              alt="Michael pointing down toward the form"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block space-y-1 text-sm text-foreground">
              <span className="font-medium">Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mimsy fan"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base shadow-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
              />
            </label>

            <label className="block space-y-1 text-sm text-foreground">
              <span className="font-medium">Email (required)</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base shadow-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
              />
            </label>

            <label className="block space-y-1 text-sm text-foreground">
              <span className="font-medium">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={messagePlaceholder}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base shadow-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
              />
            </label>

            <div className="flex items-center gap-3">
              <Button type="submit" className="rounded-full px-5 capitalize">
                send
              </Button>
              {status === "sent" && (
                <div className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--accent))]" aria-live="polite">
                  <Check className="h-4 w-4" />
                  <span>Sent</span>
                </div>
              )}
              {status === "error" && error && (
                <div className="text-sm text-destructive" aria-live="polite">
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4 bg-muted/40 p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Talk to me there</p>
            <h3 className="text-xl font-semibold text-foreground">Direct line, zero fuss</h3>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/50">
            <img
              src="/talking.png"
              alt="Michael on the phone"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-2">
            {CONTACTS.map(({ label, value, icon: Icon, playTone }) => (
              <button
                key={label}
                type="button"
                onClick={() => copyToClipboard(value, label, playTone)}
                className="group flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-border hover:bg-background/70"
              >
                <div className="flex items-center gap-3 text-foreground">
                  <div className="rounded-full bg-background p-2 shadow-sm ring-1 ring-border/60 transition group-hover:ring-[hsl(var(--accent))]/50">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
                    <span className="font-medium leading-tight">{value}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {copied === label ? (
                    <>
                      <Check className="h-4 w-4 text-[hsl(var(--accent))]" />
                      <span className="text-[hsl(var(--accent))]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden text-xs font-medium sm:inline">Click to copy</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            ICQ button gives you the classic “uh-oh” tone while copying. The email and phone lines copy instantly
            so you can paste wherever you’re working.
          </p>
        </div>
      </div>
    </div>
  );
}
