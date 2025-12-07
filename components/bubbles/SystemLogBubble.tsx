export default function SystemLogBubble({ text }: { text: string }) {
  return (
    <div className="w-full text-center text-xs font-mono text-muted-foreground">
      {text}
    </div>
  );
}
