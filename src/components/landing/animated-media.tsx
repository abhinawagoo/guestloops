"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type AnimatedMediaProps = {
  /** Image src (path or URL). Use /hero-guestloops.png or external URL */
  src?: string;
  alt: string;
  /** Optional video URL for embed (e.g. YouTube embed) */
  videoUrl?: string;
  /** Poster image for video placeholder */
  poster?: string;
  className?: string;
  /** Aspect ratio, e.g. aspect-video, aspect-[4/3] */
  aspectRatio?: string;
  /** video-placeholder = play button overlay; image = show image or gradient placeholder */
  variant?: "image" | "video-placeholder";
  /** Next/Image priority for above-fold hero image */
  priority?: boolean;
};

export function AnimatedMedia({
  src,
  alt,
  videoUrl,
  poster,
  className = "",
  aspectRatio = "aspect-video",
  variant = "image",
  priority = false,
}: AnimatedMediaProps) {
  const isVideoPlaceholder = variant === "video-placeholder" && !videoUrl;
  const hasImage = Boolean(src);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 shadow-lg ${aspectRatio} ${className}`}
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
    >
      {hasImage && (
        <Image
          src={src!}
          alt={alt}
          width={800}
          height={500}
          className="h-full w-full object-cover object-center"
          sizes="(max-width: 768px) 100vw, 800px"
          priority={priority}
        />
      )}
      {videoUrl && (
        <iframe
          src={videoUrl}
          title="Product video"
          className="absolute inset-0 h-full w-full rounded-2xl border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      {isVideoPlaceholder && !hasImage && (
        <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10">
          {poster && (
            <Image
              src={poster}
              alt=""
              fill
              className="object-cover opacity-60"
              sizes="800px"
            />
          )}
          <motion.div
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/90 text-white shadow-xl"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="ml-1 h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
          <p className="absolute bottom-4 left-0 right-0 z-10 text-center text-sm font-medium text-[var(--muted-foreground)]">
            See GuestLoops in action
          </p>
        </div>
      )}
      {!hasImage && !videoUrl && !isVideoPlaceholder && (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent)]/5">
          <div className="text-center text-[var(--muted-foreground)]">
            <p className="text-sm">Add image or video here</p>
            <p className="mt-1 text-xs">e.g. /hero-guestloops.png</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
