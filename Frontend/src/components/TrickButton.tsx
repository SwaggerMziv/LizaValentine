"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import { Loader2 } from "lucide-react";

interface TrickButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  trickProbability?: number;
}

type TrickType = "shrink" | "spin" | "text-change" | "disable";

const TRICKS: TrickType[] = ["shrink", "spin", "text-change", "disable"];

export function TrickButton({
  onClick,
  disabled,
  loading: isLoading,
  children,
  className,
  trickProbability = 0.3,
}: TrickButtonProps) {
  const [trick, setTrick] = useState<TrickType | null>(null);
  const tricked = useRef(false);
  const [tempDisabled, setTempDisabled] = useState(false);
  const { play: playSound } = useSound();

  const handleClick = useCallback(() => {
    if (disabled || tempDisabled) return;
    playSound("click");

    // Only trick once per mount, and with given probability
    if (!tricked.current && Math.random() < trickProbability) {
      tricked.current = true;
      const chosen = TRICKS[Math.floor(Math.random() * TRICKS.length)];
      setTrick(chosen);

      if (chosen === "disable") {
        setTempDisabled(true);
        setTimeout(() => {
          setTempDisabled(false);
          setTrick(null);
        }, 1500);
      } else {
        setTimeout(() => setTrick(null), 1200);
      }
      return;
    }

    onClick();
  }, [onClick, disabled, tempDisabled, trickProbability]);

  const animateProps = (() => {
    switch (trick) {
      case "shrink":
        return { scale: [1, 0.3, 0.3, 1], transition: { duration: 1.2 } };
      case "spin":
        return { rotate: [0, 360], transition: { duration: 0.8 } };
      default:
        return {};
    }
  })();

  const displayText = isLoading
    ? <Loader2 className="h-5 w-5 animate-spin" />
    : trick === "text-change" ? "Не тыкай! 😤" : children;

  return (
    <motion.div animate={animateProps}>
      <Button
        variant="neon"
        className={className}
        onClick={handleClick}
        disabled={disabled || tempDisabled}
      >
        {displayText}
      </Button>
    </motion.div>
  );
}
