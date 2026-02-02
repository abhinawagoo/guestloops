"use client";

import { motion } from "framer-motion";

export function HeroIllustration() {
  return (
    <motion.div
      className="relative mx-auto max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <svg
        viewBox="0 0 400 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
      >
        {/* Phone left - QR */}
        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <rect x="40" y="60" width="120" height="200" rx="16" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
          <rect x="60" y="90" width="80" height="80" rx="4" fill="var(--foreground)" opacity="0.1" />
          <rect x="68" y="98" width="16" height="16" fill="var(--primary)" />
          <rect x="92" y="98" width="16" height="16" fill="var(--primary)" />
          <rect x="68" y="122" width="16" height="16" fill="var(--primary)" />
          <rect x="92" y="122" width="16" height="16" fill="var(--primary)" />
          <circle cx="100" cy="230" r="12" fill="var(--muted)" />
        </motion.g>
        {/* Arrow / flow */}
        <motion.path
          d="M170 160 L230 160"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        />
        <motion.polygon
          points="220,155 235,160 220,165"
          fill="var(--accent)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        />
        {/* Phone right - stars */}
        <motion.g
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <rect x="240" y="60" width="120" height="200" rx="16" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
          <rect x="260" y="90" width="80" height="24" rx="4" fill="var(--muted)" />
          <path d="M272 102 L276 108 L283 109 L278 114 L279 121 L272 118 L265 121 L266 114 L261 109 L268 108 Z" fill="var(--accent)" />
          <path d="M292 102 L296 108 L303 109 L298 114 L299 121 L292 118 L285 121 L286 114 L281 109 L288 108 Z" fill="var(--accent)" />
          <path d="M312 102 L316 108 L323 109 L318 114 L319 121 L312 118 L305 121 L306 114 L301 109 L308 108 Z" fill="var(--accent)" />
          <path d="M332 102 L336 108 L343 109 L338 114 L339 121 L332 118 L325 121 L326 114 L321 109 L328 108 Z" fill="var(--accent)" />
          <path d="M352 102 L356 108 L363 109 L358 114 L359 121 L352 118 L345 121 L346 114 L341 109 L348 108 Z" fill="var(--accent)" />
          <rect x="260" y="130" width="80" height="60" rx="4" fill="var(--primary)" opacity="0.08" />
          <text x="300" y="165" textAnchor="middle" fill="var(--primary)" fontSize="12" fontWeight="600" fontFamily="system-ui">5★</text>
          <circle cx="300" cy="230" r="12" fill="var(--muted)" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
