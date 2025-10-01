"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Path without extension, e.g. "/vid/disco-hamster" */
  srcBase: string;
  poster?: string;
  /** Extra classes for the outer wrapper (optional) */
  className?: string;
};

export default function HamsterClip({ srcBase, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const unmute = () => {
    setMuted(false);
    setShowControls(true);
    videoRef.current?.play().catch(() => {
      /* ignore play interruption */
    });
  };

  return (
    <div className={`relative mx-auto w-full max-w-[560px] ${className ?? ""}`}>
      <video
        ref={videoRef}
        className="w-full rounded-xl shadow"
        poster={poster}
        playsInline
        autoPlay
        muted
        loop
        preload="metadata"
        controls={showControls}
        onClick={() => {
          if (muted) unmute();
        }}
      >
        <source src={`${srcBase}.webm`} type="video/webm" />
        <source src={`${srcBase}.mp4`} type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      {muted && (
        <button
          onClick={unmute}
          className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur"
          aria-label="Unmute"
        >
          Tap for sound
        </button>
      )}
    </div>
  );
}
