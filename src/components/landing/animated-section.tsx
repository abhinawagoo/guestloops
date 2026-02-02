"use client";

import { motion } from "framer-motion";

const defaultTransition = { duration: 0.5, ease: "easeOut" as const };
const defaultViewport = { once: true, margin: "-60px" };

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Reduce motion: skip entrance animation */
  reduced?: boolean;
};

export function AnimatedSection({
  children,
  className,
  delay = 0,
  reduced = false,
}: AnimatedSectionProps) {
  if (reduced) {
    return <section className={className}>{children}</section>;
  }
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, delay }}
    >
      {children}
    </motion.section>
  );
}
