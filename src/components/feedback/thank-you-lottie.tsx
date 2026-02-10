"use client";

/** Celebration after feedback — no external Lottie dependency. Use /public/lottie/thanks.json with a different loader if needed. */
export function ThankYouLottie({
  className = "",
}: {
  src?: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-center overflow-hidden ${className}`}>
      <span
        className="inline-block text-6xl animate-bounce"
        style={{ animationDuration: "1.2s" }}
        role="img"
        aria-label="Thank you"
      >
        🎉
      </span>
    </div>
  );
}
