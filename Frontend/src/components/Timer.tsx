"use client";

import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface TimerProps {
  expiresAt: string | null;
  compact?: boolean;
}

export function Timer({ expiresAt, compact = false }: TimerProps) {
  const { formatted, expired, isUrgent } = useTimer(expiresAt);
  const [expiredMsg, setExpiredMsg] = useState("");

  useEffect(() => {
    if (expired && !expiredMsg) {
      const msgs = ["💀 Сдохло", "⏰ Бум!", "🪦 R.I.P.", "😵 Приехали", "🫠 Растаяло"];
      setExpiredMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [expired, expiredMsg]);

  if (compact) {
    return (
      <div
        className={cn(
          "font-mono text-xs px-2 py-0.5 rounded-full border whitespace-nowrap",
          expired
            ? "border-[hsl(var(--muted-foreground))] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50"
            : isUrgent
            ? "border-red-500 text-red-400 animate-pulse bg-red-500/10"
            : "border-neon-pink/30 text-neon-pink bg-neon-pink/5"
        )}
      >
        {expired ? (
          <span className="text-[10px]">{expiredMsg} <span className="opacity-60">(но ничего не произошло)</span></span>
        ) : (
          `💣 ${formatted}`
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-2"
    >
      <p className="text-xs font-mono uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
        ⚠️ До самоуничтожения сайта
      </p>
      <AnimatePresence mode="wait">
        {expired ? (
          <motion.div
            key="expired"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
            className="space-y-1"
          >
            <p className="text-3xl font-bold font-mono text-red-500">
              {expiredMsg}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
              (но ничего не произошло...)
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            className={cn(
              "text-4xl md:text-5xl font-mono font-bold tracking-wider tabular-nums",
              isUrgent ? "text-red-500" : "text-neon-pink"
            )}
          >
            {isUrgent && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="inline-block mr-2"
              >
                💣
              </motion.span>
            )}
            {formatted}
          </motion.div>
        )}
      </AnimatePresence>
      {isUrgent && !expired && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400 font-mono animate-pulse"
        >
          ПОТОРОПИСЬ! Осталось меньше 30 минут!
        </motion.p>
      )}
      {!isUrgent && !expired && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
          Потом всё исчезнет навсегда... или нет 😈
        </p>
      )}
    </motion.div>
  );
}
