"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSound } from "@/hooks/useSound";

interface ConfirmLizaProps {
  onConfirm: () => void;
}

export function ConfirmLiza({ onConfirm }: ConfirmLizaProps) {
  const [lied, setLied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { play: playSound } = useSound();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-neon-pink/30">
        <CardHeader>
          <CardTitle className="text-center font-mono">
            А ты точно Лиза? 🤔
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {lied ? (
              <motion.div
                key="lied"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <p className="text-neon-pink font-medium">
                  Ах ты врушка, не стыдно тебе? 😤
                </p>
                <Button
                  variant="outline"
                  onClick={() => { playSound("click"); setLied(false); }}
                >
                  Ладно, я Лиза...
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="ask"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 justify-center"
              >
                <Button
                  variant="neon"
                  size="lg"
                  disabled={confirming}
                  onClick={() => {
                    playSound("click");
                    setConfirming(true);
                    onConfirm();
                  }}
                >
                  {confirming ? <Loader2 className="h-5 w-5 animate-spin" /> : "Да, это я! 👋"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => { playSound("click"); setLied(true); }}
                >
                  Нет 🤷
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
