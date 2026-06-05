"use client"

export type User = {
  id: string
  name: string
  email: string
}

export type QuizQuestion = {
  id: string
  theme: string
  statement: string
  imageUrl?: string | null
  options: string[]
  correctIndex: number
  explanation: string
  wrongFeedback: string[]
}

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4001"
const QUIZ_URL = process.env.NEXT_PUBLIC_QUIZ_API_URL || "http://localhost:4002"
const PROGRESS_URL = process.env.NEXT_PUBLIC_PROGRESS_API_URL || "http://localhost:4003"

export function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("roma_token") || ""
}

export function setSession(token: string, user: User) {
  localStorage.setItem("roma_token", token)
  localStorage.setItem("roma_user", JSON.stringify(user))
  document.cookie = `roma_token=${token}; path=/; max-age=604800; SameSite=Lax`
}

export function clearSession() {
  localStorage.removeItem("roma_token")
  localStorage.removeItem("roma_user")
  document.cookie = "roma_token=; path=/; max-age=0; SameSite=Lax"
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("roma_user")
  return raw ? JSON.parse(raw) : null
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Não foi possível concluir a operação.")
  }
  return data as T
}

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>(`${AUTH_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function register(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>(`${AUTH_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })
}

export function generateQuiz(theme: string) {
  return request<{ questions: QuizQuestion[] }>(`${QUIZ_URL}/quiz/generate`, {
    method: "POST",
    body: JSON.stringify({ theme }),
  })
}

export function askRomanChat(message: string) {
  return request<{ answer: string }>(`${QUIZ_URL}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export function saveAttempt(payload: {
  theme: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}) {
  return request(`${PROGRESS_URL}/attempts`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getRanking(theme?: string) {
  const params = theme && theme !== "Geral" ? `?theme=${encodeURIComponent(theme)}` : ""
  return request<Array<{ userName: string; theme: string; correct: number; total: number }>>(
    `${PROGRESS_URL}/ranking${params}`,
  )
}

export function getHistory(theme?: string) {
  const params = theme && theme !== "Todos" ? `?theme=${encodeURIComponent(theme)}` : ""
  return request<Array<{
    id: string
    theme: string
    question: string
    selectedAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string
    createdAt: string
  }>>(`${PROGRESS_URL}/history${params}`)
}
