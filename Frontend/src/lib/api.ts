const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface SessionStatus {
  session_id: string;
  current_stage: number;
  started_at: string;
  expires_at: string;
  completed: boolean;
  expired: boolean;
  challenge_status: string;
  trolling_phase: string;
}

export interface PuzzleData {
  stage: number;
  title: string;
  description: string;
  type: string;
  photo_urls: string[];
  options: string[];
  audio_url?: string | null;
  complex_data?: ComplexCaptchaData | null;
}

export interface ComplexCaptchaOption {
  label: string;
  photo_url: string;
}

export interface ComplexCaptchaQuestion {
  text: string;
  options: ComplexCaptchaOption[];
}

export interface ComplexCaptchaRound {
  instruction: string;
  grid_urls: string[];
}

export interface ComplexCaptchaData {
  part_a: { questions: ComplexCaptchaQuestion[] };
  part_b: { rounds: ComplexCaptchaRound[] };
}

export interface PuzzleResult {
  correct: boolean;
  message: string;
  next_stage: number | null;
}

export interface CaptchaQuestion {
  text: string;
  options: string[];
  photo_url: string | null;
}

export interface ChallengeStatusResponse {
  status: string;
}

export interface AdminSessionInfo {
  session_id: string;
  fingerprint: string;
  ip_address: string | null;
  current_stage: number;
  challenge_status: string;
  started_at: string;
  completed: boolean;
}

export interface AdminAttempt {
  stage: number;
  answer: string;
  correct: boolean;
  created_at: string;
}

export interface AdminSessionDetail extends AdminSessionInfo {
  expires_at: string;
  attempts: AdminAttempt[];
  total_correct: number;
  total_wrong: number;
}

export const api = {
  startSession: (fingerprint: string) =>
    request<SessionStatus>("/session/start", {
      method: "POST",
      body: JSON.stringify({ fingerprint }),
    }),

  getStatus: (sessionId: string) =>
    request<SessionStatus>(`/session/status?session_id=${sessionId}`),

  getPuzzle: (stage: number, sessionId: string) =>
    request<PuzzleData>(`/puzzle/${stage}?session_id=${sessionId}`),

  checkAnswer: (sessionId: string, stage: number, answer: string) =>
    request<PuzzleResult>("/puzzle/check", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, stage, answer }),
    }),

  advanceStage: (sessionId: string, stage: number) =>
    request<{ ok: boolean }>(`/puzzle/advance?session_id=${sessionId}&stage=${stage}`, {
      method: "POST",
    }),

  getCaptcha: (stage: number) =>
    request<{ questions: CaptchaQuestion[] }>(`/puzzle/${stage}/captcha`),

  getPhotoUrl: (key: string) =>
    request<{ url: string }>(`/photos/${key}`),

  // Trolling phase persistence
  saveTrollingPhase: (sessionId: string, phase: string) =>
    request<{ ok: boolean }>(`/trolling/phase?session_id=${sessionId}&phase=${encodeURIComponent(phase)}`, {
      method: "POST",
    }),

  // Challenge endpoints
  challengeSubmit: (sessionId: string) =>
    request<ChallengeStatusResponse>(`/challenge/submit?session_id=${sessionId}`, {
      method: "POST",
    }),

  challengeStatus: (sessionId: string) =>
    request<ChallengeStatusResponse>(`/challenge/status?session_id=${sessionId}`),

  // Admin endpoints
  adminLogin: (password: string) =>
    request<{ ok: boolean }>("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Password": password },
    }),

  adminSessions: (password: string) =>
    request<AdminSessionInfo[]>("/admin/sessions", {
      headers: { "Content-Type": "application/json", "X-Admin-Password": password },
    }),

  adminSessionDetail: (password: string, sessionId: string) =>
    request<AdminSessionDetail>(`/admin/session/${sessionId}`, {
      headers: { "Content-Type": "application/json", "X-Admin-Password": password },
    }),

  adminApprove: (password: string, sessionId: string) =>
    request<ChallengeStatusResponse>(`/admin/approve/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Password": password },
    }),
};
