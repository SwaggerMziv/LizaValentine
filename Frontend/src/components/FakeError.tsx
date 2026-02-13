"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const OWNER_PHONE = process.env.NEXT_PUBLIC_OWNER_PHONE || "+79001234567";
const REPAIR_CODE = process.env.NEXT_PUBLIC_REPAIR_CODE || "кириллпидор";

interface FakeErrorProps {
  sessionId: string;
  initialPhase?: string;
  challengeStatus?: string;
  onContinue: () => void;
}

const LOADING_MESSAGES = [
  "Пересборка квантовых модулей...",
  "Перезагрузка серверов на Сатурне...",
  "Откат до последней стабильной версии...",
  "Удаление System32... шутка",
  "Подключение к спутнику...",
  "Скачивание 4 петабайт данных...",
  "Компиляция ядерного реактора...",
  "Поиск смысла жизни... не найден",
  "Установка обновлений Windows...",
  "Перевод сайта на машинный код...",
  "Оптимизация нейронных связей...",
  "Загрузка секретных файлов ЦРУ...",
  "Пересчёт числа Пи...",
  "Дефрагментация облачного хранилища...",
  "Калибровка искусственного интеллекта...",
  "Синхронизация с параллельной вселенной...",
];

const REVIEW_MESSAGES = [
  "Запрос получен, обрабатываю...",
  "Открываю видеозапись...",
  "Качество съёмки 2/10 🎬",
  "Техника отжиманий... спорная 🤔",
  "Админ Валера пошёл заваривать кофе ☕",
  "Админ Валера пролил кофе на клавиатуру...",
  "Ищу запасную клавиатуру...",
  "Админ Валера смотрит тикток пока ждёт...",
  "Админу Валере написала бывшая...",
  "Админ Валера подал на развод 💔",
  "Админ Валера забивает косяк от стресса 🌿",
  "Ладно, возвращаюсь к работе...",
  "Консультируюсь с фитнес-экспертом...",
  "Эксперт в шоке, но ладно",
  "Перепроверяю запись ещё раз...",
  "Админ Валера уронил телефон в унитаз 📱🚽",
  "Достал... вроде работает",
  "Ладно, засчитано. Еле-еле.",
  "Формирую допуск...",
  "✅ Доступ разрешён",
];

const ERROR_TIMER_SECONDS = 5 * 60;

type Phase = "error" | "loading" | "challenge" | "waiting-real" | "admin-review" | "approved";

function resolveInitialPhase(initialPhase?: string, challengeStatus?: string): Phase {
  // If admin already approved but phase hasn't caught up, jump to admin-review
  if (challengeStatus === "approved") {
    if (initialPhase === "approved") return "approved";
    return "admin-review";
  }
  // If challenge is pending, user is waiting for admin
  if (challengeStatus === "pending") return "waiting-real";
  // Otherwise use saved phase
  if (initialPhase && ["error", "loading", "challenge", "waiting-real", "admin-review", "approved"].includes(initialPhase)) {
    return initialPhase as Phase;
  }
  return "error";
}

export function FakeError({ sessionId, initialPhase, challengeStatus, onContinue }: FakeErrorProps) {
  const [phase, setPhase] = useState<Phase>(() => resolveInitialPhase(initialPhase, challengeStatus));

  // Save phase to backend on every transition
  const changePhase = useCallback((newPhase: Phase) => {
    setPhase(newPhase);
    api.saveTrollingPhase(sessionId, newPhase).catch(() => {});
  }, [sessionId]);

  // Error phase state
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [errorTimer, setErrorTimer] = useState(ERROR_TIMER_SECONDS);
  const [errorTimerExpired, setErrorTimerExpired] = useState(false);

  // Loading phase state
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [loadingTimer, setLoadingTimer] = useState(120);

  // Challenge phase state
  const [challengeStarted, setChallengeStarted] = useState(false);

  // Waiting-real phase state
  const [dots, setDots] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin-review phase state
  const [reviewMsgIndex, setReviewMsgIndex] = useState(0);

  // === ERROR PHASE: 3-minute countdown ===
  useEffect(() => {
    if (phase !== "error" || errorTimerExpired) return;
    const interval = setInterval(() => {
      setErrorTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setErrorTimerExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, errorTimerExpired]);

  // === LOADING PHASE: 2-minute wait with rotating messages ===
  useEffect(() => {
    if (phase !== "loading") return;

    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 4000);

    const timerInterval = setInterval(() => {
      setLoadingTimer((t) => {
        if (t <= 1) {
          clearInterval(timerInterval);
          changePhase("challenge");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(timerInterval);
    };
  }, [phase]);

  // === WAITING-REAL PHASE: poll /challenge/status every 3s ===
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.challengeStatus(sessionId);
        if (res.status === "approved") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          changePhase("admin-review");
        }
      } catch {}
    }, 3000);
  }, [sessionId]);

  useEffect(() => {
    if (phase !== "waiting-real") return;
    startPolling();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [phase, startPolling]);

  // Dots animation for waiting
  useEffect(() => {
    if (phase !== "waiting-real") return;
    const dotsInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(dotsInterval);
  }, [phase]);

  // === ADMIN-REVIEW PHASE: show joke messages one by one ===
  useEffect(() => {
    if (phase !== "admin-review") return;

    const msgInterval = setInterval(() => {
      setReviewMsgIndex((i) => {
        if (i >= REVIEW_MESSAGES.length - 1) {
          clearInterval(msgInterval);
          setTimeout(() => changePhase("approved"), 3000);
          return i;
        }
        return i + 1;
      });
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const handleCodeSubmit = () => {
    const normalized = codeInput.trim().toLowerCase().replace(/\s+/g, "");
    const expected = REPAIR_CODE.toLowerCase().replace(/\s+/g, "");
    if (normalized === expected) {
      changePhase("loading");
    } else {
      setCodeError("Неверный код! Попробуй ещё 🤡");
      setTimeout(() => setCodeError(""), 2000);
    }
  };

  const handleChallengeSubmit = async () => {
    try {
      await api.challengeSubmit(sessionId);
      changePhase("waiting-real");
    } catch {
      changePhase("waiting-real");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-2">
      <AnimatePresence mode="wait">
        {/* === PHASE 1: FAKE CRASH + REPAIR CODE === */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-5"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-6xl"
            >
              💀
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-mono font-bold text-neon-pink">
                КРИТИЧЕСКАЯ ОШИБКА
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] font-mono">
                Error 0xDEAD: сайт сломался из-за слишком высокого IQ
                пользователя
              </p>
            </div>

            {!errorTimerExpired ? (
              <div className="space-y-1">
                <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  До уничтожения сайта из-за ошибки
                </p>
                <p
                  className={`text-2xl font-mono font-bold ${
                    errorTimer < 30 ? "text-red-500 animate-pulse" : "text-neon-pink"
                  }`}
                >
                  💣 {formatTime(errorTimer)}
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1"
              >
                <p className="text-lg font-mono font-bold text-[hsl(var(--muted-foreground))]">
                  Время кончилось
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                  (но ничего не произошло...)
                </p>
              </motion.div>
            )}

            <div className="space-y-5 pt-2">
              <div className="space-y-4">
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                  placeholder="Код починки сайта..."
                  className="font-mono text-center"
                />
                {codeError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-neon-pink"
                  >
                    {codeError}
                  </motion.p>
                )}
                <Button
                  variant="neon"
                  className="w-full"
                  onClick={handleCodeSubmit}
                  disabled={!codeInput.trim()}
                >
                  🔧 Ввести код починки сайта
                </Button>
              </div>

              <a href={`tel:${OWNER_PHONE}`}>
                <Button variant="outline" className="w-full">
                  📞 Позвонить в поддержку (твоему господину)
                </Button>
              </a>
            </div>
          </motion.div>
        )}

        {/* === PHASE 2: SPINNING LOADER + 2 MIN WAIT === */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-16 h-16 mx-auto rounded-full border-4 border-[hsl(var(--muted))] border-t-neon-pink"
            />

            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-mono text-[hsl(var(--muted-foreground))] min-h-[1.5em]"
              >
                {LOADING_MESSAGES[loadingMsgIndex]}
              </motion.p>
            </AnimatePresence>

            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Примерное время: {formatTime(loadingTimer)}
            </p>

          </motion.div>
        )}

        {/* === PHASE 3: FINAL BOSS — PUSHUPS === */}
        {phase === "challenge" && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-5"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-5xl"
            >
              🏋️‍♀️
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-mono font-bold text-neon-pink">
                ⚠️ Финальный этап
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Для получения валентинки необходимо пройти физическую
                верификацию
              </p>
            </div>

            <div className="bg-[hsl(var(--card))] border border-neon-purple/30 rounded-xl p-5 space-y-4 text-left">
              <h3 className="font-mono font-bold text-center">Задание:</h3>
              <div className="space-y-2 text-sm">
                <p>
                  1. Отжаться{" "}
                  <span className="text-neon-pink font-bold">5 раз</span>
                </p>
                <p>2. Записать это на камеру 📹</p>
                <p>3. Отправить владельцу Максиму в тг</p>
                <p>4. Дождаться одобрения</p>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] italic text-center">
                Без этого валентинку не получишь. Правила есть правила.
              </p>
            </div>

            {!challengeStarted ? (
              <div className="space-y-5">
                <Button
                  variant="neon"
                  className="w-full"
                  onClick={() => setChallengeStarted(true)}
                >
                  Я отжалась и отправила видео! 💪
                </Button>
                <a href={`tel:${OWNER_PHONE}`}>
                  <Button variant="outline" className="w-full text-xs">
                    📞 Это невозможно, позвать на помощь
                  </Button>
                </a>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Ты точно отжалась? Не врёшь? 🤨
                </p>
                <div className="flex gap-5">
                  <Button
                    variant="neon"
                    className="flex-1"
                    onClick={handleChallengeSubmit}
                  >
                    Клянусь! 🤞
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setChallengeStarted(false)}
                  >
                    Ладно, нет... 😔
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* === PHASE 4: REAL WAITING FOR ADMIN APPROVAL === */}
        {phase === "waiting-real" && (
          <motion.div
            key="waiting-real"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 overflow-y-auto"
          >
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center space-y-6 px-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="text-5xl inline-block"
                >
                  ⏳
                </motion.div>

                <div className="space-y-2">
                  <h2 className="font-mono font-bold text-lg">
                    Ожидание подтверждения от владельца сайта{dots}
                  </h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Видео отправлено на проверку. Это может занять некоторое время.
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                    (Реально ждём, не переключайся)
                  </p>
                </div>
              </div>
            </div>

            {/* Long empty space hiding the skip button */}
            <div className="h-[250vh]" />

            <div className="flex justify-center pb-16">
              <button
                onClick={() => changePhase("approved")}
                className="text-[7px] text-[hsl(var(--muted-foreground))]/5 hover:text-[hsl(var(--muted-foreground))]/20 transition-colors cursor-default select-none"
              >
                skip
              </button>
            </div>
          </motion.div>
        )}

        {/* === PHASE 5: ADMIN REVIEW — JOKE MESSAGES (chat style) === */}
        {phase === "admin-review" && (
          <motion.div
            key="admin-review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 w-full"
          >
            <div className="text-center mb-2">
              <h2 className="font-mono font-bold text-xs text-neon-pink uppercase tracking-wider">
                Проверка Админом Валерой
              </h2>
            </div>

            <div className="space-y-1.5">
              {REVIEW_MESSAGES.slice(0, reviewMsgIndex + 1).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-[10px] bg-neon-purple/20 border border-neon-purple/30 rounded-full px-1.5 py-0.5 shrink-0 mt-0.5">
                    👑 Валера
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-2.5 py-1.5">
                    {msg}
                  </span>
                </motion.div>
              ))}
              {reviewMsgIndex < REVIEW_MESSAGES.length - 1 && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-2 pl-1"
                >
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    печатает...
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* === PHASE 6: APPROVED === */}
        {phase === "approved" && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="text-6xl"
            >
              ✅
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-xl font-mono font-bold text-green-400">
                ОДОБРЕНО!
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Админ Валера впечатлён (нет). Но валентинку ты заслужила.
              </p>
            </div>
            <Button
              variant="neon"
              size="lg"
              className="w-full"
              onClick={onContinue}
            >
              Получить валентинку 💌
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
