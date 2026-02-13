"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GalaxyBackground } from "@/components/GalaxyBackground";

export default function ExpiredPage() {
  const router = useRouter();

  return (
    <>
      <GalaxyBackground />
      <div className="min-h-screen flex flex-col relative">
        <header className="flex items-center justify-between p-4 relative z-10">
          <span className="text-2xl">🪐</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-6xl"
            >
              ⏰
            </motion.div>
            <h1 className="text-2xl font-mono font-bold">
              Время кончилось
            </h1>
            <p className="text-[hsl(var(--muted-foreground))]">
              (но ничего не произошло...)
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Ладно, ты реально долго думала 😤 Но я не настолько злой.
            </p>
            <Button
              variant="neon"
              size="lg"
              onClick={() => router.push("/puzzle")}
            >
              Продолжить как ни в чём не бывало 😅
            </Button>
          </motion.div>
        </main>
      </div>
    </>
  );
}
