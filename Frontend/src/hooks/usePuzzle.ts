"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type SessionStatus } from "@/lib/api";

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("vs_fingerprint");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("vs_fingerprint", fp);
  }
  return fp;
}

export function usePuzzle() {
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    try {
      const fp = getFingerprint();
      if (!fp) return;
      const status = await api.startSession(fp);
      setSession(status);
      localStorage.setItem("vs_session_id", status.session_id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    const sid = session?.session_id || localStorage.getItem("vs_session_id");
    if (!sid) return;
    try {
      const status = await api.getStatus(sid);
      setSession(status);
    } catch {}
  }, [session]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const retryInit = useCallback(() => {
    setLoading(true);
    setError(null);
    initSession();
  }, [initSession]);

  return { session, loading, error, refreshStatus, setSession, retryInit };
}
