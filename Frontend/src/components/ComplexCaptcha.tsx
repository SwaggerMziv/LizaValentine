"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PuzzleStage } from "./PuzzleStage";
import { api, type ComplexCaptchaData } from "@/lib/api";
import { useSound } from "@/hooks/useSound";
import { Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface ComplexCaptchaProps {
  stage: number;
  title: string;
  description: string;
  complexData: ComplexCaptchaData;
  sessionId: string;
  onComplete: () => void;
  onFlash?: (color: "red" | "green") => void;
}

export function ComplexCaptcha({ stage, title, description, complexData, sessionId, onComplete, onFlash }: ComplexCaptchaProps) {
  const [phase, setPhase] = useState<"a" | "b">("a");
  const [partAAnswers, setPartAAnswers] = useState<(number | null)[]>(
    new Array(complexData.part_a.questions.length).fill(null)
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [partBAnswers, setPartBAnswers] = useState<number[][]>([]);
  const [gridSelection, setGridSelection] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [comment, setComment] = useState("");
  const { play: playSound } = useSound();

  const questions = complexData.part_a.questions;
  const rounds = complexData.part_b.rounds;

  // Part A: select answer for current question
  const handlePartASelect = (optionIndex: number) => {
    playSound("click");
    const newAnswers = [...partAAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setPartAAnswers(newAnswers);
  };

  const handlePartANext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Move to Part B
      setPhase("b");
      setCurrentRound(0);
      setGridSelection([]);
      setPartBAnswers([]);
    }
  };

  // Part B: toggle grid cell
  const toggleGridCell = (index: number) => {
    playSound("click");
    setGridSelection((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGridConfirm = () => {
    const newPartB = [...partBAnswers, gridSelection];
    if (currentRound < rounds.length - 1) {
      setPartBAnswers(newPartB);
      setCurrentRound(currentRound + 1);
      setGridSelection([]);
    } else {
      // All rounds done, submit everything
      setPartBAnswers(newPartB);
      submitAnswer(partAAnswers as number[], newPartB);
    }
  };

  const submitAnswer = async (partA: number[], partB: number[][]) => {
    setLoading(true);
    try {
      const answerJson = JSON.stringify({ part_a: partA, part_b: partB });
      const result = await api.checkAnswer(sessionId, stage, answerJson);
      setMessage(result.message);
      if (result.correct) {
        setSolved(true);
        playSound("correct");
        onFlash?.("green");
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        setTimeout(onComplete, 3500);
      } else {
        playSound("wrong");
        onFlash?.("red");
        // Reset to Part A
        setPhase("a");
        setCurrentQuestion(0);
        setPartAAnswers(new Array(questions.length).fill(null));
        setPartBAnswers([]);
        setCurrentRound(0);
        setGridSelection([]);
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
        <AnimatePresence mode="wait">
          {!solved && phase === "a" && (
            <motion.div
              key={`q-${currentQuestion}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-3"
            >
              <p className="text-sm font-mono text-center text-[hsl(var(--muted-foreground))]">
                Часть A — Вопрос {currentQuestion + 1}/{questions.length}
              </p>
              <h3 className="text-center font-bold">{questions[currentQuestion].text}</h3>
              <div className="grid grid-cols-3 gap-2">
                {questions[currentQuestion].options.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePartASelect(i)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                      partAAnswers[currentQuestion] === i
                        ? "border-neon-purple ring-2 ring-neon-purple/50"
                        : "border-[hsl(var(--border))]"
                    }`}
                  >
                    <img
                      src={opt.photo_url}
                      alt=""
                      className="w-full aspect-[3/4] object-cover"
                    />
                  </motion.button>
                ))}
              </div>
              {comment && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-center text-green-400"
                >
                  {comment}
                </motion.p>
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
              <Button
                variant="neon"
                className="w-full"
                onClick={() => {
                  setComment("");
                  handlePartANext();
                }}
                disabled={partAAnswers[currentQuestion] === null}
              >
                {currentQuestion < questions.length - 1 ? "Далее" : "К части B"}
              </Button>
            </motion.div>
          )}

          {!solved && phase === "b" && (
            <motion.div
              key={`r-${currentRound}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {/* Google-style captcha header */}
              <div className="bg-blue-600 text-white rounded-t-lg p-3 text-center">
                <p className="text-xs font-mono mb-1">
                  Раунд {currentRound + 1}/{rounds.length}
                </p>
                <p className="font-bold text-sm">
                  {rounds[currentRound].instruction}
                </p>
              </div>
              {/* 3x3 grid */}
              <div className="grid grid-cols-3 gap-1 bg-[hsl(var(--border))] p-1 rounded-b-lg">
                {rounds[currentRound].grid_urls.map((url, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleGridCell(i)}
                    className={`relative aspect-square overflow-hidden rounded-sm transition-all ${
                      gridSelection.includes(i)
                        ? "ring-4 ring-green-500 opacity-80"
                        : ""
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Grid ${i}`}
                      className="w-full h-full object-cover"
                    />
                    {gridSelection.includes(i) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 bg-green-500/30 flex items-center justify-center"
                      >
                        <span className="text-white text-2xl font-bold">✓</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              {message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm text-center ${solved ? "text-green-400" : "text-neon-pink"}`}
                >
                  {message}
                </motion.p>
              )}
              <Button
                variant="neon"
                className="w-full"
                onClick={handleGridConfirm}
                disabled={loading || gridSelection.length === 0}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Подтвердить"}
              </Button>
            </motion.div>
          )}
          {solved && (
            <motion.div
              key="solved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3 py-4"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 font-mono text-sm"
              >
                {message}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PuzzleStage>
  );
}
