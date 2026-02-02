"use client";

import { useState } from "react";
import { Player } from "@lottiefiles/react-lottie-player";

/** Add /public/lottie/thanks.json for your own animation, or pass a LottieFiles CDN URL. Fallback: emoji. */
const DEFAULT_LOTTIE_URL = "/lottie/thanks.json";

export function ThankYouLottie({
  src = DEFAULT_LOTTIE_URL,
  className = "",
}: {
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex justify-center ${className}`}>
        <span className="text-5xl" role="img" aria-label="Celebration">
          🎉
        </span>
      </div>
    );
  }

  return (
    <div className={`flex justify-center overflow-hidden ${className}`}>
      <Player
        src={src}
        autoplay
        loop={false}
        style={{ height: "140px", width: "140px" }}
        onEvent={(e: string) => {
          if (e === "error") setFailed(true);
        }}
      />
    </div>
  );
}
