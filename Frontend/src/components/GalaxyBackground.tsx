"use client";

import dynamic from "next/dynamic";

const Galaxy = dynamic(() => import("@/components/Galaxy"), { ssr: false });

interface GalaxyBackgroundProps {
  hueShift?: number;
  saturation?: number;
  speed?: number;
  disableAnimation?: boolean;
  hidden?: boolean;
}

export function GalaxyBackground({
  hueShift = 140,
  saturation = 0.2,
  speed = 0.5,
  disableAnimation = false,
  hidden = false,
}: GalaxyBackgroundProps) {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-500"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <Galaxy
        density={0.8}
        speed={speed}
        glowIntensity={0.3}
        saturation={saturation}
        hueShift={hueShift}
        twinkleIntensity={0.4}
        rotationSpeed={0.05}
        mouseInteraction={false}
        mouseRepulsion={false}
        transparent={false}
        disableAnimation={disableAnimation}
      />
    </div>
  );
}
