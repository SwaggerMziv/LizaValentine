"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PuzzleStage } from "./PuzzleStage";
import { api } from "@/lib/api";
import { useSound } from "@/hooks/useSound";
import { Loader2 } from "lucide-react";

interface ColorTrickPuzzleProps {
  stage: number;
  title: string;
  description: string;
  sessionId: string;
  onComplete: () => void;
}

const COLORS = [
  { label: "Зеленый", bg: "bg-green-500", hover: "hover:bg-green-400" },
  { label: "Синий", bg: "bg-blue-500", hover: "hover:bg-blue-400" },
  { label: "Розовый", bg: "bg-pink-500", hover: "hover:bg-pink-400" },
  { label: "Оранжевый", bg: "bg-orange-500", hover: "hover:bg-orange-400" },
];

export function ColorTrickPuzzle({ stage, title, description, sessionId, onComplete }: ColorTrickPuzzleProps) {
  const [phase, setPhase] = useState<"picking" | "wrong" | "reveal">("picking");
  const [clickedColor, setClickedColor] = useState<string | null>(null);
  const { play: playSound } = useSound();

  const handlePick = (label: string) => {
    setClickedColor(label);
    playSound("click");
    playSound("wrong");
    setPhase("wrong");
    // Log attempt for admin tracking
    api.checkAnswer(sessionId, stage, label).catch(() => {});

    // After 3s, fade to reveal
    setTimeout(() => {
      setPhase("reveal");
      // After 5s on reveal, advance
      setTimeout(() => {
        onComplete();
      }, 5000);
    }, 3000);
  };

  return (
    <PuzzleStage stage={stage} title={title} description={description}>
      <AnimatePresence mode="wait">
        {phase === "picking" && (
          <motion.div
            key="picking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {COLORS.map((c) => (
              <button
                key={c.label}
                onClick={() => handlePick(c.label)}
                disabled={clickedColor !== null}
                className={`${c.bg} ${c.hover} text-white font-bold py-4 px-6 rounded-xl transition-colors text-sm flex items-center justify-center`}
              >
                {clickedColor === c.label ? <Loader2 className="h-5 w-5 animate-spin" /> : c.label}
              </button>
            ))}
          </motion.div>
        )}

        {phase === "wrong" && (
          <motion.div
            key="wrong"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-2"
          >
            <p className="text-2xl font-bold text-red-500">Неправильно!</p>
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-sm text-[hsl(var(--muted-foreground))]"
            >
              Хммм...
            </motion.p>
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <p className="text-xl font-mono font-bold text-neon-pink leading-snug">
              Я знаю что у тебя нет любимого цвета, зачем ты меня обманываешь? 🤨
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </PuzzleStage>
  );
}
