"use client";

// Press: the element sinks the moment the finger lands and springs back (soft tone: 0.98, rows 0.99).
import { Slot } from "radix-ui";
import { motion } from "motion/react";

const MotionSlot = motion.create(Slot.Root);

export function Press({ children, large, asChild, className }: { children: React.ReactNode; large?: boolean; asChild?: boolean; className?: string }) {
  const Comp = asChild ? MotionSlot : motion.div;
  return (
    <Comp
      className={className}
      whileTap={{ scale: large ? 0.99 : 0.98, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ type: "spring", visualDuration: 0.35, bounce: 0 }}
    >
      {children}
    </Comp>
  );
}
