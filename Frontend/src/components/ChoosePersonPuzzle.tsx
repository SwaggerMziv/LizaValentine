"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PuzzleStage } from "./PuzzleStage";
import { api } from "@/lib/api";
import { useSound } from "@/hooks/useSound";
import { Loader2 } from "lucide-react";

interface ChoosePersonPuzzleProps {
  stage: number;
  title: string;
  description: string;
  sessionId: string;
  onComplete: () => void;
}

const GUYS = [
  { id: 0, name: "Парень 1", image: "/images/guy1.png", selectedImage: "/images/guy_selected.png" },
  { id: 1, name: "Парень 2", image: "/images/guy2.png", selectedImage: "/images/guy_selected.png" },
  { id: 2, name: "Парень 3", image: "/images/guy3.png", selectedImage: "/images/guy_selected.png" },
];

export function ChoosePersonPuzzle({ stage, title, description, sessionId, onComplete }: ChoosePersonPuzzleProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { play: playSound } = useSound();
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleChoose = (id: number) => {
    if (chosen !== null) return;
    playSound("click");
    setChosen(id);
    playSound("correct");
    // Log attempt for admin tracking
    api.checkAnswer(sessionId, stage, GUYS[id].name).catch(() => {});

    // After 1.5s, expand the selected image
    setTimeout(() => {
      setExpanded(true);
    }, 1500);

    // After 5.5s total (was 3.5), advance
    setTimeout(() => {
      onComplete();
    }, 5500);
  };

  const chosenGuy = chosen !== null ? GUYS[chosen] : null;

  return (
    <PuzzleStage stage={stage} title={title} description={description}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {GUYS.map((guy) => {
            const isChosen = chosen === guy.id;
            const isRejected = chosen !== null && chosen !== guy.id;

            return (
              <motion.div
                key={guy.id}
                className="flex flex-col items-center gap-2"
                animate={isRejected ? { opacity: 0.3, scale: 0.9 } : {}}
              >
                <motion.div
                  ref={(el) => { imgRefs.current[guy.id] = el; }}
                  className="relative w-28 h-36 rounded-xl overflow-hidden border-2 border-[hsl(var(--border))] cursor-pointer"
                  whileHover={chosen === null ? { scale: 1.05 } : {}}
                  whileTap={chosen === null ? { scale: 0.95 } : {}}
                  onClick={() => handleChoose(guy.id)}
                  animate={isChosen ? { borderColor: "rgb(34, 197, 94)" } : {}}
                >
                  <img
                    src={isChosen ? guy.selectedImage : guy.image}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.classList.add("bg-gradient-to-b", "from-purple-600/50", "to-pink-600/50", "flex", "items-center", "justify-center");
                    }}
                  />
                  {isChosen && !expanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-green-500/30 flex items-center justify-center"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-4xl"
                      >
                        ✅
                      </motion.span>
                    </motion.div>
                  )}
                  {isRejected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-3xl"
                      >
                        ❌
                      </motion.span>
                    </motion.div>
                  )}
                </motion.div>

                <button
                  onClick={() => handleChoose(guy.id)}
                  disabled={chosen !== null}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center min-w-[80px] ${
                    chosen !== null
                      ? "bg-gray-600 text-gray-400 cursor-default"
                      : "bg-neon-pink/80 hover:bg-neon-pink text-white cursor-pointer"
                  }`}
                >
                  {isChosen ? <Loader2 className="h-4 w-4 animate-spin" /> : "Трахнуть"}
                </button>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {chosen !== null && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-green-400 font-mono text-sm"
            >
              Я знал что ты его выберешь)) 😏
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded selected image overlay */}
      <AnimatePresence>
        {expanded && chosenGuy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.img
              src={chosenGuy.selectedImage}
              alt="Selected"
              initial={{ scale: 0.3, opacity: 0, borderRadius: "12px" }}
              animate={{ scale: 1, opacity: 1, borderRadius: "16px" }}
              transition={{ type: "spring", damping: 20, stiffness: 120 }}
              className="w-[80vw] h-[80vh] max-w-lg max-h-[600px] object-cover rounded-2xl shadow-2xl shadow-neon-pink/30 border-2 border-neon-pink/50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PuzzleStage>
  );
}
