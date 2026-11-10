"use client";

import React, { useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { cn } from "@/lib/utils";

// Aceternity-style Card Spotlight: a radial spotlight follows the pointer and reveals the
// canvas dot matrix only inside it. Keyboard focus centres the spotlight on the card.
export const CardSpotlight = ({
  children,
  radius = 350,
  color = "#fdb905",
  dotColors = [[255, 255, 255]],
  dotOpacities,
  className,
  ...props
}: {
  radius?: number;
  color?: string;
  dotColors?: number[][];
  dotOpacities?: number[];
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);
  const reduceMotion = useReducedMotion();

  const moveTo = (el: HTMLElement, x?: number, y?: number) => {
    const { left, top, width, height } = el.getBoundingClientRect();
    mouseX.set(x === undefined ? width / 2 : x - left);
    mouseY.set(y === undefined ? height / 2 : y - top);
  };

  const maskImage = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, white, transparent 80%)`;

  return (
    <div
      className={cn("group/spotlight relative", className)}
      onMouseMove={(e) => moveTo(e.currentTarget, e.clientX, e.clientY)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={(e) => {
        moveTo(e.currentTarget);
        setIsHovering(true);
      }}
      onBlur={() => setIsHovering(false)}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-px z-0 transition-opacity duration-300",
          isHovering ? "opacity-100" : "opacity-0",
        )}
        style={{ backgroundColor: color, maskImage, WebkitMaskImage: maskImage }}
      >
        {/* reduced motion: keep the spotlight glow, skip the animated dots */}
        {isHovering && !reduceMotion && (
          <CanvasRevealEffect
            animationSpeed={5}
            containerClassName="bg-transparent absolute inset-0 pointer-events-none"
            colors={dotColors}
            opacities={dotOpacities}
            dotSize={3}
            showGradient={false}
          />
        )}
      </motion.div>
      {children}
    </div>
  );
};
