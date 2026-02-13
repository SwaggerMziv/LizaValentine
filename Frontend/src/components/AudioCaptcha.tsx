"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PuzzleStage } from "./PuzzleStage";
import { api } from "@/lib/api";
import { useSound } from "@/hooks/useSound";
import confetti from "canvas-confetti";

interface AudioCaptchaProps {
  stage: number;
  title: string;
  description: string;
  audioUrl: string;
  sessionId: string;
  onComplete: () => void;
  onFlash?: (color: "red" | "green") => void;
}

export function AudioCaptcha({ stage, title, description, audioUrl, sessionId, onComplete, onFlash }: AudioCaptchaProps) {
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { play: playSound } = useSound();

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

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
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
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
        {/* Audio player */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={togglePlay}
            className="flex items-center gap-3 px-6 py-4"
          >
            <motion.span
              animate={playing ? { scale: [1, 1.2, 1] } : {}}
              transition={playing ? { repeat: Infinity, duration: 0.8 } : {}}
              className="text-3xl"
            >
              {playing ? "🔊" : "🔈"}
            </motion.span>
            <span className="font-mono text-sm">
              {playing ? "Пауза" : "Прослушать"}
            </span>
          </Button>
        </div>

        {!solved && (
          <div className={shaking ? "animate-shake" : ""}>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Введи код..."
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
