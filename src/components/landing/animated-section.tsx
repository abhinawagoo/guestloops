"use client";

import { motion } from "framer-motion";

const defaultTransition = { duration: 0.5, ease: "easeOut" as const };
const defaultViewport = { once: true, margin: "-60px" };

type AnimatedSectionProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Reduce motion: skip entrance animation */
  reduced?: boolean;
  /** Accessibility label for the section */
  "aria-label"?: string;
};

export function AnimatedSection({
  children,
  id,
  className,
  delay = 0,
  reduced = false,
  "aria-label": ariaLabel,
}: AnimatedSectionProps) {
  const sectionProps = { id, className, "aria-label": ariaLabel };
  if (reduced) {
    return <section {...sectionProps}>{children}</section>;
  }
  return (
    <motion.section
      {...sectionProps}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, delay }}
    >
      {children}
    </motion.section>
  );
}
