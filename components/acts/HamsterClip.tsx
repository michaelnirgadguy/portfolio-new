"use client";

type Props = {
  /** Path without extension, e.g. "/hamster/chew-paper" (files: chew-paper.mp4/.webm) */
  srcBase: string;
  /** Optional poster image, e.g. "/hamster/chew-paper.jpg" */
  poster?: string;
  /** Rounded corners/sizing from parent */
  className?: string;
};

export default function HamsterClip({ srcBase, poster, className }: Props) {
  return (
    <div className={className}>
      <video
        className="w-full rounded-xl shadow"
        poster={poster}
        playsInline
        autoPlay
        muted
        loop
        controls
      >
        <source src={`${srcBase}.webm`} type="video/webm" />
        <source src={`${srcBase}.mp4`} type="video/mp4" />
        {/* Basic fallback text */}
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
}
