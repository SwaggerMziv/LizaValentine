"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PuzzleStage } from "./PuzzleStage";
import { api } from "@/lib/api";
import { useSound } from "@/hooks/useSound";
import confetti from "canvas-confetti";

interface TextPuzzleProps {
  stage: number;
  title: string;
  description: string;
  sessionId: string;
  onComplete: () => void;
  onFlash?: (color: "red" | "green") => void;
}

export function TextPuzzle({ stage, title, description, sessionId, onComplete, onFlash }: TextPuzzleProps) {
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const { play: playSound } = useSound();

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;
    playSound("click");
    setLoading(true);
    try {
      const result = await api.checkAnswer(sessionId, stage, answer);
      setMessage(result.message);
      if (result.correct) {
        setSolved(true);
        playSound("correct");
        onFlash?.("green");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(onComplete, 3500);
      } else {
        playSound("wrong");
        onFlash?.("red");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      setMessage("Ошибка сети, попробуй ещё");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PuzzleStage stage={stage} title={title} description={description}>
      <div className="space-y-4">
        {!solved && (
          <div className={shaking ? "animate-shake" : ""}>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Твой ответ..."
              className="font-mono"
            />
          </div>
        )}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm text-center ${solved ? "text-green-400" : "text-neon-pink"}`}
          >
            {message}
          </motion.p>
        )}
        {!solved && (
          <Button
            variant="neon"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !answer.trim()}
          >
            Проверить
          </Button>
        )}
      </div>
    </PuzzleStage>
  );
}
