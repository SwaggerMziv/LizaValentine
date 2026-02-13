"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PuzzleStage } from "./PuzzleStage";
import { api, type CaptchaQuestion } from "@/lib/api";
import { useSound } from "@/hooks/useSound";
import confetti from "canvas-confetti";

interface CaptchaPuzzleProps {
  stage: number;
  title: string;
  description: string;
  sessionId: string;
  onComplete: () => void;
}

export function CaptchaPuzzle({ stage, title, description, sessionId, onComplete }: CaptchaPuzzleProps) {
  const [questions, setQuestions] = useState<CaptchaQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const { play: playSound } = useSound();

  useEffect(() => {
    api.getCaptcha(stage).then(({ questions: q }) => {
      setQuestions(q);
      setAnswers(new Array(q.length).fill(-1));
    });
  }, [stage]);

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (answers.includes(-1) || loading) return;
    setLoading(true);
    try {
      const result = await api.checkAnswer(sessionId, stage, answers.join(","));
      setMessage(result.message);
      if (result.correct) {
        setSolved(true);
        playSound("correct");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(onComplete, 3500);
      } else {
        playSound("wrong");
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
      <div className={`space-y-6 ${shaking ? "animate-shake" : ""}`}>
        {questions.map((q, qi) => (
          <motion.div
            key={qi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.15 }}
            className="space-y-2"
          >
            {q.photo_url && (
              <img
                src={q.photo_url}
                alt={`Вопрос ${qi + 1}`}
                className="w-full rounded-lg border border-[hsl(var(--border))]"
              />
            )}
            <p className="text-sm font-medium">{q.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <Button
                  key={oi}
                  variant={answers[qi] === oi ? "neon" : "outline"}
                  size="sm"
                  className="text-xs h-auto py-2 px-3"
                  onClick={() => selectAnswer(qi, oi)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </motion.div>
        ))}
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
            disabled={loading || answers.includes(-1)}
          >
            {loading ? "Проверяю..." : "Подтвердить"}
          </Button>
        )}
      </div>
    </PuzzleStage>
  );
}
