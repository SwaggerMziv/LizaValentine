"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePuzzle } from "@/hooks/usePuzzle";
import { ValentineCard } from "@/components/ValentineCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ValentinePage() {
  const router = useRouter();
  const { session, loading } = usePuzzle();
  const [denied, setDenied] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/");
      return;
    }
    if (session.completed || session.current_stage > 11) {
      setDenied(false);
      setShowCard(true);
    } else {
      setDenied(true);
    }
  }, [session, loading, router]);

  return (
    <>
      {/* Hide galaxy when showing the valentine card (PixelSnow takes over) */}
      <GalaxyBackground hidden={showCard} />

      {loading ? (
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
      ) : denied ? (
        <div className="min-h-screen flex flex-col relative">
          <main className="flex-1 flex items-center justify-center px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 max-w-md"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-6xl"
              >
                🚫
              </motion.div>
              <h1 className="text-2xl font-mono font-bold text-neon-pink">
                Нет нет не всё так просто, сученька!
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Думала можно просто в адресную строку ввести и получить валентинку?
                Ха! Сначала пройди все испытания как положено.
              </p>
              <Button
                variant="neon"
                onClick={() => router.push(session && session.current_stage > 0 ? "/puzzle" : "/")}
              >
                Вернуться к испытаниям 😤
              </Button>
            </motion.div>
          </main>
        </div>
      ) : showCard ? (
        <div className="min-h-screen flex flex-col relative">
          <header className="flex items-center justify-between p-4 relative z-10">
            <span className="text-2xl">🪐</span>
            <ThemeToggle />
          </header>
          <main className="flex-1 flex items-center justify-center px-4 relative z-10">
            <ValentineCard />
          </main>
        </div>
      ) : null}
    </>
  );
}
