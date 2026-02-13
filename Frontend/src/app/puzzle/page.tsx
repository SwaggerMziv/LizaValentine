"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { usePuzzle } from "@/hooks/usePuzzle";
import { api, type PuzzleData } from "@/lib/api";
import { Timer } from "@/components/Timer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HelpButton } from "@/components/HelpButton";
import { ConfirmLiza } from "@/components/ConfirmLiza";
import { PhotoPuzzle } from "@/components/PhotoPuzzle";
import { TextPuzzle } from "@/components/TextPuzzle";
import { AudioCaptcha } from "@/components/AudioCaptcha";
import { ComplexCaptcha } from "@/components/ComplexCaptcha";
import { FakeError } from "@/components/FakeError";
import { ColorTrickPuzzle } from "@/components/ColorTrickPuzzle";
import { ChoosePersonPuzzle } from "@/components/ChoosePersonPuzzle";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { motion } from "framer-motion";

// stage mapping:
// 0 = confirm liza
// 1-8 = puzzles
// 9 = color trick puzzle
// 10 = choose person puzzle
// 11 = fake error (trolling)
// 12 = done → redirect to /valentine

export default function PuzzlePage() {
  const router = useRouter();
  const { session, loading, refreshStatus, setSession } = usePuzzle();
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [localStage, setLocalStage] = useState<number | null>(null);

  // Background flash state for correct/wrong answers
  const [bgFlash, setBgFlash] = useState<"red" | "green" | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStage = localStage ?? session?.current_stage ?? 0;

  const triggerFlash = useCallback((color: "red" | "green") => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setBgFlash(color);
    flashTimerRef.current = setTimeout(() => setBgFlash(null), 3000);
  }, []);

  const loadPuzzle = useCallback(async (stage: number) => {
    if (stage < 1 || stage > 10 || !session) return;
    try {
      const data = await api.getPuzzle(stage, session.session_id);
      setPuzzleData(data);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (session) {
      setLocalStage(session.current_stage);
      if (session.current_stage >= 1 && session.current_stage <= 10) {
        loadPuzzle(session.current_stage);
      }
    }
  }, [session, loadPuzzle]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/");
      return;
    }
    if (session.expired) router.replace("/expired");
    if (session.completed) router.replace("/valentine");
  }, [session, loading, router]);

  const advanceToStage = async (stage: number) => {
    if (!session) return;
    await api.advanceStage(session.session_id, stage);
    setLocalStage(stage);
    if (stage >= 1 && stage <= 10) {
      loadPuzzle(stage);
    }
    await refreshStatus();
    if (stage > 11) {
      router.push("/valentine");
    }
  };

  const onPuzzleComplete = () => {
    const next = currentStage + 1;
    advanceToStage(next > 10 ? 11 : next);
  };

  const puzzleLoading = !loading && session && currentStage >= 1 && currentStage <= 10 && !puzzleData;

  // Galaxy background props based on current state
  const isFakeError = currentStage === 11;
  const galaxyHueShift = bgFlash === "green" ? 120 : 140;
  const galaxySaturation = bgFlash === "green" ? 1.5 : 0.2;
  const galaxySpeed = isFakeError ? 0 : 0.5;
  const galaxyFrozen = isFakeError;

  return (
    <>
      <GalaxyBackground
        hueShift={galaxyHueShift}
        saturation={galaxySaturation}
        speed={galaxySpeed}
        disableAnimation={galaxyFrozen}
      />

      {/* Red overlay for wrong answers + persistent during fake error */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none transition-opacity"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,0,0,0.35) 0%, rgba(255,0,0,0.15) 60%, transparent 100%)",
          opacity: bgFlash === "red" || isFakeError ? 1 : 0,
          transitionDuration: bgFlash === "red" || isFakeError ? "200ms" : "1500ms",
        }}
      />

      {(loading || puzzleLoading) ? (
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
      ) : !session ? null : (
        <div className="min-h-screen flex flex-col relative">
          {/* Header */}
          <header className="flex items-center justify-between px-3 py-2 relative z-10 gap-2">
            <div className="flex items-center gap-1.5 min-w-0 shrink">
              <span className="text-xl shrink-0">🪐</span>
              <Timer expiresAt={session.expires_at} compact />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <HelpButton />
              <ThemeToggle />
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 flex items-center justify-center px-4 pb-24 relative z-10">
            <AnimatePresence mode="wait">
              {currentStage === 0 && (
                <ConfirmLiza
                  key="confirm"
                  onConfirm={() => advanceToStage(1)}
                />
              )}

              {currentStage === 1 && puzzleData && (
                <PhotoPuzzle
                  key="puzzle1"
                  stage={1}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  photoUrls={puzzleData.photo_urls}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 2 && puzzleData && (
                <TextPuzzle
                  key="puzzle2"
                  stage={2}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 3 && puzzleData && (
                <TextPuzzle
                  key="puzzle3"
                  stage={3}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 4 && puzzleData && puzzleData.audio_url && (
                <AudioCaptcha
                  key="puzzle4"
                  stage={4}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  audioUrl={puzzleData.audio_url}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 5 && puzzleData && puzzleData.complex_data && (
                <ComplexCaptcha
                  key="puzzle5"
                  stage={5}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  complexData={puzzleData.complex_data}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 6 && puzzleData && (
                <TextPuzzle
                  key="puzzle6"
                  stage={6}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 7 && puzzleData && (
                <TextPuzzle
                  key="puzzle7"
                  stage={7}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 8 && puzzleData && (
                <TextPuzzle
                  key="puzzle8"
                  stage={8}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                  onFlash={triggerFlash}
                />
              )}

              {currentStage === 9 && puzzleData && (
                <ColorTrickPuzzle
                  key="puzzle9"
                  stage={9}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                />
              )}

              {currentStage === 10 && puzzleData && (
                <ChoosePersonPuzzle
                  key="puzzle10"
                  stage={10}
                  title={puzzleData.title}
                  description={puzzleData.description}
                  sessionId={session.session_id}
                  onComplete={onPuzzleComplete}
                />
              )}

              {currentStage === 11 && (
                <FakeError
                  key="trolling"
                  sessionId={session.session_id}
                  initialPhase={session.trolling_phase}
                  challengeStatus={session.challenge_status}
                  onContinue={() => advanceToStage(12)}
                />
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </>
  );
}
