"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const messagePlaceholder = "Hey Michael, cool hasmter! Anyways, i wanted to ask…";

type ContactAction = "copy" | "tone";

type ContactMethod = {
  label: string;
  value: string;
  icon: typeof Mail;
  action: ContactAction;
};

const CONTACTS: ContactMethod[] = [
  { label: "Email", value: "michael.nirgadguy@gmail.com", icon: Mail, action: "copy" },
  { label: "Phone", value: "+972 50 4441505", icon: Phone, action: "copy" },
  { label: "ICQ", value: "6170791", icon: MessageCircle, action: "tone" },
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [icqBuffer, setIcqBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const subject = useMemo(() => {
    return `New message from ${name?.trim() || "a friend"}`;
  }, [name]);

  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    fetch("/icq.mp3")
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => setIcqBuffer(buffer))
      .catch((err) => console.error("Failed to load ICQ tone", err));

    return () => {
      ctx.close();
    };
  }, []);

  const playIcqTone = async () => {
    const ctx = audioContextRef.current;
    if (!ctx || !icqBuffer) return;

    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const source = ctx.createBufferSource();
    source.buffer = icqBuffer;
    source.connect(ctx.destination);
    source.start(0);
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopied(label);
      setTimeout(() => setCopied((prev) => (prev === label ? null : prev)), 1600);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      setStatus("error");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const formData = new FormData();
      formData.append("access_key", "c54fcf1d-f6e6-4319-99bc-4f4160d6d7e6");
      formData.append("name", name.trim() || "Portfolio visitor");
      formData.append("email", email.trim());
      formData.append("subject", subject);
      formData.append("message", message.trim() || "(no message provided)");

      const resp = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json().catch(() => ({}));
      if (!data?.success) {
        throw new Error(data?.message || "Failed to send your message. Please try again.");
      }

      setStatus("sent");
      setMessage("");
      setName("");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setError(err?.message || "Unable to send message right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-y-0 md:divide-x">
        <div className="relative flex flex-col gap-4 p-6 bg-background/50">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="flex items-center justify-center text-center">
                <h3 className="text-3xl font-semibold leading-tight text-foreground">
                  <span className="block">Talk to Me</span>
                  <span className="block">Here</span>
                </h3>
              </div>
            </div>
            <div className="w-full max-w-[200px] overflow-hidden rounded-lg border border-border/70 bg-muted/30 sm:w-1/2">
              <img
                src="/pointing.png"
                alt="Michael pointing toward the form"
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block space-y-1 text-sm text-foreground">
              <span className="font-medium">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mimsy fan"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base shadow-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))]/40"
              />
            </label>

            <label className="block space-y-1 text-sm text-foreground">
              <span className="font-medium">Email*</span>
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
              <Button type="submit" className="rounded-full px-5 capitalize" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "send"}
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
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="flex items-center justify-center text-center">
                <h3 className="text-3xl font-semibold leading-tight text-foreground">
                  <span className="block">Talk to Me</span>
                  <span className="block">There</span>
                </h3>
              </div>
            </div>
            <div className="w-full max-w-[200px] overflow-hidden rounded-lg border border-border/70 bg-muted/50 sm:w-1/2">
              <img
                src="/talking.png"
                alt="Michael on the phone"
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-2">
            {CONTACTS.map((contact) => (
              <button
                key={contact.label}
                type="button"
                onClick={() => {
                  if (contact.action === "tone") {
                    setCopied(null);
                    playIcqTone();
                    return;
                  }
                  copyToClipboard(contact.value, contact.label);
                }}
                className="group flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-border hover:bg-background/70"
              >
                <div className="flex items-center gap-3 text-foreground">
                  <div className="rounded-full bg-background p-2 shadow-sm ring-1 ring-border/60 transition group-hover:ring-[hsl(var(--accent))]/50">
                    <contact.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{contact.label}</span>
                    <span className="font-medium leading-tight">{contact.value}</span>
                    {contact.action === "copy" && copied === contact.label && (
                      <span className="text-xs font-medium text-[hsl(var(--accent))]">Copied</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
