"use client";

import { useCallback } from "react";

type SoundName = "correct" | "wrong" | "open" | "click";

const SOUND_FILES: Record<SoundName, string> = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  open: "/sounds/open.mp3",
  click: "/sounds/click.wav",
};

export function useSound() {
  const play = useCallback((sound: SoundName) => {
    try {
      // Create a fresh Audio instance each time so overlapping plays work
      const audio = new Audio(SOUND_FILES[sound]);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Audio not supported
    }
  }, []);

  return { play };
}
