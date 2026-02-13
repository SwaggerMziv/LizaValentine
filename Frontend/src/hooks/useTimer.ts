"use client";

import { useState, useEffect, useCallback } from "react";

export function useTimer(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  const calculate = useCallback(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      setExpired(true);
      return 0;
    }
    return diff;
  }, [expiresAt]);

  useEffect(() => {
    setTimeLeft(calculate());
    const interval = setInterval(() => {
      setTimeLeft(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  const hours = timeLeft !== null ? Math.floor(timeLeft / 3600000) : 0;
  const minutes = timeLeft !== null ? Math.floor((timeLeft % 3600000) / 60000) : 0;
  const seconds = timeLeft !== null ? Math.floor((timeLeft % 60000) / 1000) : 0;

  const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = timeLeft !== null && timeLeft < 30 * 60 * 1000;

  return { timeLeft, formatted, expired, isUrgent };
}
