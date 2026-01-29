export default function MegaCardBubble() {
  return (
    <div className="w-full md:w-[min(90vw,72rem)] md:relative md:left-1/2 md:-translate-x-1/2">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <img
          src="/mega-card-placeholder.svg"
          alt="Mega card placeholder"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
