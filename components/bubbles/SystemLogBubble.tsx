export default function SystemLogBubble({
  text,
  active,
}: {
  text: string;
  active?: boolean;
}) {
  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 text-center text-base font-semibold text-foreground/90 md:text-lg">
        {active && (
          <div
            className="hamster-wheel hamster-wheel--small shrink-0"
            aria-label="hamster is working"
          />
        )}
        <span className="leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
