"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type AdminSessionInfo, type AdminSessionDetail } from "@/lib/api";

const STAGE_NAMES: Record<number, string> = {
  0: "Подтверждение",
  1: "Фото-пазл",
  2: "Текст (дисс)",
  3: "Текст (аватарка)",
  4: "Аудио",
  5: "Мега-капча",
  6: "Текст (песня)",
  7: "Текст (игра)",
  8: "Текст (банда)",
  9: "Любимый цвет",
  10: "Выбери парня",
  11: "Троллинг/FakeError",
  12: "Завершено",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [sessions, setSessions] = useState<AdminSessionInfo[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, AdminSessionDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!authed) return;
    try {
      const data = await api.adminSessions(password);
      setSessions(data);
    } catch {}
  }, [authed, password]);

  useEffect(() => {
    if (!authed) return;
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [authed, fetchSessions]);

  const handleLogin = async () => {
    try {
      await api.adminLogin(password);
      setAuthed(true);
      setLoginError("");
    } catch {
      setLoginError("Неверный пароль");
    }
  };

  const handleApprove = async (sessionId: string) => {
    try {
      await api.adminApprove(password, sessionId);
      fetchSessions();
      if (details[sessionId]) {
        const d = await api.adminSessionDetail(password, sessionId);
        setDetails((prev) => ({ ...prev, [sessionId]: d }));
      }
    } catch {}
  };

  const handleDeleteSession = async (sessionId: string) => {
    // TODO: add backend endpoint for session deletion
  };

  const handleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    setLoadingDetail(sessionId);
    try {
      const d = await api.adminSessionDetail(password, sessionId);
      setDetails((prev) => ({ ...prev, [sessionId]: d }));
    } catch {}
    setLoadingDetail(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTimeSince = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин назад`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ч назад`;
    return `${Math.floor(hrs / 24)} дн назад`;
  };

  const challengeBadge = (status: string) => {
    if (status === "pending")
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    if (status === "approved")
      return "bg-green-500/20 text-green-300 border-green-500/40";
    return "bg-gray-800 text-gray-500 border-gray-700";
  };

  const challengeLabel = (status: string) => {
    if (status === "pending") return "⏳ ожидает";
    if (status === "approved") return "✅ одобрено";
    return "—";
  };

  // Stats
  const totalSessions = sessions.length;
  const pendingCount = sessions.filter((s) => s.challenge_status === "pending").length;
  const completedCount = sessions.filter((s) => s.completed).length;
  const activeCount = sessions.filter((s) => !s.completed && s.current_stage > 0).length;

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="text-4xl">🪐</div>
            <h1 className="text-xl font-mono font-bold text-purple-400">
              ValentineSaturn Admin
            </h1>
            <p className="text-xs text-gray-500">Панель управления</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[\x20-\x7E]*$/.test(val)) {
                  setPassword(val);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Пароль..."
              autoFocus
              className="w-full px-4 py-3 bg-[#12121a] border border-gray-800 rounded-xl text-white font-mono text-center focus:outline-none focus:border-purple-500 transition-colors"
            />
            {loginError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs text-center"
              >
                {loginError}
              </motion.p>
            )}
            <button
              onClick={handleLogin}
              disabled={!password.trim()}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-mono font-bold transition-all active:scale-[0.98]"
            >
              Войти
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🪐</span>
            <h1 className="font-mono font-bold text-sm text-purple-400">
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 rounded-full text-[10px] font-mono font-bold"
              >
                {pendingCount} ждут одобрения
              </motion.span>
            )}
            <span className="text-[10px] text-gray-600 font-mono">
              auto-refresh 5s
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Всего", value: totalSessions, color: "text-purple-400" },
            { label: "Активных", value: activeCount, color: "text-blue-400" },
            { label: "Ожидают", value: pendingCount, color: "text-yellow-400" },
            { label: "Завершили", value: completedCount, color: "text-green-400" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-[#12121a] border border-gray-800/50 rounded-xl p-3 text-center"
            >
              <div className={`text-2xl font-mono font-bold ${color}`}>
                {value}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Sessions list */}
        <div className="space-y-2">
          {sessions.map((s) => {
            const d = details[s.session_id];
            const isExpanded = expandedId === s.session_id;
            const isPending = s.challenge_status === "pending";

            return (
              <div key={s.session_id}>
                {/* Session row */}
                <div
                  onClick={() => handleExpand(s.session_id)}
                  className={`rounded-xl border cursor-pointer transition-all ${
                    isPending
                      ? "bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10"
                      : isExpanded
                      ? "bg-[#16161f] border-purple-500/30"
                      : "bg-[#12121a] border-gray-800/50 hover:border-gray-700/50"
                  }`}
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    {/* Status indicator */}
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        s.completed
                          ? "bg-green-400"
                          : isPending
                          ? "bg-yellow-400 animate-pulse"
                          : s.current_stage > 0
                          ? "bg-blue-400"
                          : "bg-gray-600"
                      }`}
                    />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-300">
                          {s.fingerprint.slice(0, 8)}
                        </span>
                        {s.ip_address && (
                          <span className="font-mono text-[10px] text-gray-500">
                            {s.ip_address}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-mono">
                          Этап {s.current_stage}/12
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {STAGE_NAMES[s.current_stage] || `Stage ${s.current_stage}`}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {formatTimeSince(s.started_at)}
                        </span>
                      </div>
                    </div>

                    {/* Challenge badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono ${challengeBadge(
                        s.challenge_status
                      )}`}
                    >
                      {challengeLabel(s.challenge_status)}
                    </span>

                    {/* Completed badge */}
                    {s.completed && (
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-300 border border-green-500/40 rounded-md">
                        ✅ завершено
                      </span>
                    )}

                    {/* Approve button */}
                    {isPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(s.session_id);
                        }}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
                      >
                        ✅ Одобрить
                      </button>
                    )}

                    {/* Expand arrow */}
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="text-gray-600 text-xs"
                    >
                      ▼
                    </motion.span>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#0e0e16] border border-gray-800/50 border-t-0 rounded-b-xl px-4 py-4 space-y-4">
                        {loadingDetail === s.session_id ? (
                          <div className="text-gray-500 text-xs font-mono text-center py-4">
                            Загрузка...
                          </div>
                        ) : d ? (
                          <>
                            {/* Info grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {[
                                { label: "Session ID", value: d.session_id },
                                { label: "IP адрес", value: d.ip_address || "не определён" },
                                { label: "Fingerprint", value: d.fingerprint },
                                { label: "Текущий этап", value: `${d.current_stage} — ${STAGE_NAMES[d.current_stage] || `#${d.current_stage}`}` },
                                { label: "Challenge", value: challengeLabel(d.challenge_status) },
                                { label: "Завершено", value: d.completed ? "✅ Да" : "❌ Нет" },
                                { label: "Начало", value: formatDate(d.started_at) },
                                { label: "Истекает", value: formatDate(d.expires_at) },
                              ].map(({ label, value }) => (
                                <div key={label} className="space-y-0.5">
                                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    {label}
                                  </div>
                                  <div className="text-xs font-mono text-gray-200 break-all">
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                                Прогресс
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (d.current_stage / 12) * 100)}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-gray-500 text-right">
                                {d.current_stage}/12 этапов
                              </div>
                            </div>

                            {/* Stats bar */}
                            <div className="flex items-center gap-4 py-2 px-3 bg-[#12121a] rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" />
                                <span className="text-xs font-mono text-green-400">
                                  {d.total_correct} правильных
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50" />
                                <span className="text-xs font-mono text-red-400">
                                  {d.total_wrong} ошибок
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-purple-500/30 border border-purple-500/50" />
                                <span className="text-xs font-mono text-purple-400">
                                  {d.attempts.length} всего
                                </span>
                              </div>
                              {d.total_correct + d.total_wrong > 0 && (
                                <span className="text-[10px] text-gray-500 ml-auto">
                                  точность:{" "}
                                  {Math.round(
                                    (d.total_correct /
                                      (d.total_correct + d.total_wrong)) *
                                      100
                                  )}
                                  %
                                </span>
                              )}
                            </div>

                            {/* Attempts table */}
                            {d.attempts.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider px-1">
                                  История попыток
                                </div>
                                <div className="rounded-lg border border-gray-800/50 overflow-hidden max-h-64 overflow-y-auto">
                                  {/* Header */}
                                  <div className="grid grid-cols-[50px_1fr_50px_auto] gap-2 px-3 py-1.5 bg-[#12121a] text-[10px] text-gray-500 uppercase tracking-wider sticky top-0">
                                    <span>Этап</span>
                                    <span>Ответ</span>
                                    <span>Верно</span>
                                    <span>Время</span>
                                  </div>
                                  {d.attempts.map((a, i) => (
                                    <div
                                      key={i}
                                      className={`grid grid-cols-[50px_1fr_50px_auto] gap-2 px-3 py-1.5 text-xs font-mono border-t border-gray-800/30 ${
                                        a.correct
                                          ? "bg-green-500/5"
                                          : "bg-red-500/5"
                                      }`}
                                    >
                                      <span className="text-gray-400">
                                        #{a.stage}
                                      </span>
                                      <span className="text-gray-200 truncate">
                                        {a.answer}
                                      </span>
                                      <span>
                                        {a.correct ? (
                                          <span className="text-green-400">✓</span>
                                        ) : (
                                          <span className="text-red-400">✗</span>
                                        )}
                                      </span>
                                      <span className="text-gray-600">
                                        {formatDate(a.created_at)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {d.attempts.length === 0 && (
                              <div className="text-center text-gray-600 text-xs py-3 font-mono">
                                Нет попыток
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500 text-xs font-mono text-center py-4">
                            Ошибка загрузки
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <div className="text-3xl">🪐</div>
              <p className="text-gray-600 text-sm font-mono">Нет сессий</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
