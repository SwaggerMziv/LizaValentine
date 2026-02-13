"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePuzzle } from "@/hooks/usePuzzle";
import { useTimer } from "@/hooks/useTimer";
import { HelpButton } from "@/components/HelpButton";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Loader2 } from "lucide-react";

// Phases: "typing" → "greeting" → "timer-fullscreen" → "timer-shrink" → "ready"
type Phase = "typing" | "greeting" | "timer-fullscreen" | "timer-shrink" | "ready";

function FullscreenTimer({ expiresAt }: { expiresAt: string }) {
  const { formatted, isUrgent } = useTimer(expiresAt);
  return (
    <div className="text-center space-y-3">
      <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
        ⚠️ До самоуничтожения сайта
      </p>
      <div className={`text-5xl sm:text-7xl font-mono font-bold tracking-wider tabular-nums ${isUrgent ? "text-red-500" : "text-neon-pink"}`}>
        💣 {formatted}
      </div>
      <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] font-mono">
        Потом всё исчезнет навсегда... или нет 😈
      </p>
    </div>
  );
}

function CompactTimer({ expiresAt }: { expiresAt: string }) {
  const { formatted, expired, isUrgent } = useTimer(expiresAt);
  return (
    <div className={`font-mono text-base px-4 py-2 rounded-full border ${
      expired
        ? "border-[hsl(var(--muted-foreground))] text-[hsl(var(--muted-foreground))]"
        : isUrgent
        ? "border-red-500 text-red-400 animate-pulse bg-red-500/10"
        : "border-neon-pink/30 text-neon-pink bg-neon-pink/5"
    }`}>
      {expired ? "💀 Бум!" : `💣 ${formatted}`}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { session, loading, error, retryInit } = usePuzzle();
  const [phase, setPhase] = useState<Phase>("typing");
  const [sessionError, setSessionError] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const greeting = "Спасибо что зашла, сучка ❤️";

  // Typewriter
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= greeting.length) {
        setTypedText(greeting.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setPhase("greeting"), 500);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Redirect if session already in progress
  useEffect(() => {
    if (session && session.current_stage > 0 && !session.completed) {
      router.push("/puzzle");
    }
    if (session?.completed) {
      router.push("/valentine");
    }
    if (session?.expired) {
      router.push("/expired");
    }
  }, [session, router]);

  const handleDavaiDalshe = useCallback(() => {
    setBtnLoading(true);
    setTimeout(() => {
      setPhase("timer-fullscreen");
      setBtnLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (phase === "timer-fullscreen") {
      const t = setTimeout(() => setPhase("timer-shrink"), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "timer-shrink") {
      const t = setTimeout(() => setPhase("ready"), 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleGo = useCallback(() => {
    if (!session) {
      setSessionError(true);
      return;
    }
    setBtnLoading(true);
    setTimeout(() => {
      router.push("/puzzle");
    }, 600);
  }, [router, session]);

  // Determine content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 relative z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="text-6xl"
            >
              🪐
            </motion.div>
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sm font-mono text-[hsl(var(--muted-foreground))]"
            >
              Загрузка...
            </motion.p>
          </div>
        </div>
      );
    }

    if (error && !session && phase === "typing") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 relative z-10 text-center px-4">
            <span className="text-6xl">😵</span>
            <p className="text-sm font-mono text-red-400">{error}</p>
            <Button variant="neon" onClick={retryInit}>
              Попробовать снова
            </Button>
          </div>
        </div>
      );
    }

    if (phase === "timer-fullscreen" || phase === "timer-shrink") {
      return (
        <div className="min-h-screen flex flex-col relative">
          <AnimatePresence>
            {phase === "timer-fullscreen" && (
              <motion.div
                key="fullscreen-timer"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", damping: 15, stiffness: 100, duration: 0.8 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {session ? (
                    <FullscreenTimer expiresAt={session.expires_at} />
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="text-5xl sm:text-7xl font-mono font-bold tracking-wider text-neon-pink">
                        💣 --:--:--
                      </div>
                      <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-xs sm:text-sm font-mono text-[hsl(var(--muted-foreground))]"
                      >
                        Инициализация...
                      </motion.p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "timer-shrink" && (
            <motion.div
              initial={{
                position: "fixed",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                scale: 1,
              }}
              animate={{
                top: "1rem",
                left: "1rem",
                x: "0%",
                y: "0%",
                scale: 0.5,
              }}
              transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
              className="fixed z-50 origin-top-left"
            >
              {session ? (
                <FullscreenTimer expiresAt={session.expires_at} />
              ) : (
                <div className="text-center space-y-3">
                  <div className="text-5xl sm:text-7xl font-mono font-bold tracking-wider text-neon-pink">
                    💣 --:--:--
                  </div>
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs sm:text-sm font-mono text-[hsl(var(--muted-foreground))]"
                  >
                    Инициализация...
                  </motion.p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      );
    }

    if (phase === "ready") {
      return (
        <div className="min-h-screen flex flex-col relative">
          <header className="flex items-center justify-between p-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {session && <CompactTimer expiresAt={session.expires_at} />}
            </motion.div>
            <div className="flex items-center gap-2">
              <HelpButton />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-5 max-w-md w-full"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-5xl"
              >
                🪐
              </motion.div>

              <h1 className="text-[clamp(0.9rem,4.5vw,1.875rem)] font-mono font-bold whitespace-nowrap">
                Замечена подозрительная активность!
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Придется пройти серию этапов для верификации личности, удачки тебе
              </p>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <Button
                  variant="neon"
                  size="lg"
                  onClick={handleGo}
                  disabled={btnLoading}
                  className="text-base px-6 min-w-[280px]"
                >
                  {btnLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Пройти верификацию"
                  )}
                </Button>
                {sessionError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-2 mt-3"
                  >
                    <p className="text-sm text-red-400 font-mono">
                      Не удалось подключиться к серверу 😵
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSessionError(false);
                        retryInit();
                      }}
                    >
                      Попробовать снова
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </main>
        </div>
      );
    }

    // Default: typing + greeting phases
    return (
      <div className="min-h-screen flex flex-col relative">
        <header className="flex items-center justify-between p-4 relative z-10">
          <span className="text-2xl">🪐</span>
          <div className="flex items-center gap-2">
            <HelpButton />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-5 max-w-md w-full"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-5xl"
            >
              🪐
            </motion.div>

            <h1 className="text-[clamp(0.9rem,4.5vw,1.875rem)] font-mono font-bold min-h-[2em] whitespace-nowrap">
              {typedText}
              <span className="animate-pulse text-neon-pink">|</span>
            </h1>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Чтобы получить валентинку нажми кнопку ниже дорогая!
            </p>

            <AnimatePresence>
              {phase === "greeting" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Button
                    variant="neon"
                    size="lg"
                    onClick={handleDavaiDalshe}
                    disabled={btnLoading}
                    className="text-lg px-8 min-w-[200px]"
                  >
                    {btnLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Получить валентинку →"
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    );
  };

  return (
    <>
      <GalaxyBackground />
      {renderContent()}
    </>
  );
}
