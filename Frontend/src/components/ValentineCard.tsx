"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import { useSound } from "@/hooks/useSound";
import {
  VALENTINE_TITLE,
  VALENTINE_PARAGRAPHS,
  VALENTINE_PS,
} from "@/lib/valentine-text";

const PixelSnow = dynamic(() => import("@/components/PixelSnow"), { ssr: false });

type Phase = "envelope" | "card";

export function ValentineCard() {
  const [phase, setPhase] = useState<Phase>("envelope");
  const [showText, setShowText] = useState(false);
  const { play: playSound } = useSound();

  // Card opened — confetti + reveal text
  useEffect(() => {
    if (phase === "card") {
      const duration = 4000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 4,
          angle: 60 + Math.random() * 60,
          spread: 70,
          origin: { x: Math.random(), y: Math.random() * 0.5 },
          colors: ["#ff2d95", "#b829dd", "#ff69b4", "#ff1493", "#fff"],
        });
      }, 40);
      setTimeout(() => setShowText(true), 800);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Pink pixel snow */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <PixelSnow
          color="#ff00ae"
          flakeSize={0.01}
          minFlakeSize={1.25}
          pixelResolution={200}
          speed={1.25}
          density={0.3}
          direction={125}
          brightness={1}
          depthFade={8}
          farPlane={20}
          gamma={0.4545}
          variant="square"
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Envelope — opens directly to card */}
        {phase === "envelope" && (
          <motion.div
            key="envelope"
            className="cursor-pointer relative z-20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playSound("open"); setPhase("card"); }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center space-y-4"
            >
              <div className="text-8xl">💌</div>
              <p className="font-mono text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
                Нажми чтобы открыть...
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Valentine card — fullscreen */}
        {phase === "card" && (
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto"
          >
            <div className="w-full min-h-full flex items-start justify-center px-4 py-8 sm:py-12">
              <div className="w-full max-w-2xl">
                {/* Decorative top heart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 10 }}
                  className="text-center mb-6"
                >
                  <span className="text-5xl">💝</span>
                </motion.div>

                {/* Card body */}
                <div className="bg-gradient-to-b from-neon-pink/5 via-neon-purple/5 to-transparent border border-neon-pink/20 rounded-3xl p-6 sm:p-10 backdrop-blur-sm">
                  {showText && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-8"
                    >
                      {/* Title */}
                      <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl sm:text-3xl font-romantic font-bold text-center bg-gradient-to-r from-neon-pink via-pink-300 to-neon-purple bg-clip-text text-transparent italic"
                      >
                        {VALENTINE_TITLE}
                      </motion.h2>

                      {/* Paragraphs */}
                      <div className="space-y-5">
                        {VALENTINE_PARAGRAPHS.map((text, i) => (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.3 }}
                            className="font-romantic text-base sm:text-lg leading-relaxed text-[hsl(var(--foreground))]/90"
                          >
                            {text}
                          </motion.p>
                        ))}
                      </div>

                      {/* P.S. */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: 0.4 + VALENTINE_PARAGRAPHS.length * 0.3 + 0.5,
                        }}
                        className="pt-6 border-t border-neon-pink/15"
                      >
                        <p className="text-sm text-[hsl(var(--muted-foreground))]/70 italic font-romantic">
                          {VALENTINE_PS}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
