"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Bot, Crown, History, Landmark, LogOut, Medal, MessageCircle, ScrollText, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  QuizQuestion,
  askRomanChat,
  clearSession,
  generateQuiz,
  getHistory,
  getRanking,
  getStoredUser,
  saveAttempt,
} from "@/lib/api"

const themes = ["Imperadores", "Exército Romano", "Arquitetura", "Mitologia e Religião", "Política", "Economia", "Cultura e Sociedade"]
const tabs = [
  { id: "quiz", label: "Quiz por tema", Icon: ScrollText },
  { id: "chat", label: "Chat romano", Icon: MessageCircle },
  { id: "ranking", label: "Ranking", Icon: Trophy },
  { id: "history", label: "Histórico", Icon: History },
] as const

type Tab = (typeof tabs)[number]["id"]
type HistoryRow = Awaited<ReturnType<typeof getHistory>>[number]
type RankingRow = Awaited<ReturnType<typeof getRanking>>[number]

export default function DashboardPage() {
  const router = useRouter()
  const [active, setActive] = useState<Tab>("quiz")
  const [userName, setUserName] = useState("Cidadão")

  useEffect(() => {
    const user = getStoredUser()
    if (!user) router.push("/login")
    else setUserName(user.name)
  }, [router])

  function logout() {
    clearSession()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-sidebar-border bg-sidebar p-5 text-sidebar-foreground md:block">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center bg-sidebar-primary text-sidebar-primary-foreground">
            <Crown className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase text-amber-200/70">Roma Ludus</p>
            <h1 className="font-black">Salve, {userName}</h1>
          </div>
        </div>
        <nav className="mt-10 grid gap-2">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex h-11 items-center gap-3 px-3 text-left text-sm transition ${
                active === id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>
        <Button onClick={logout} variant="ghost" className="absolute bottom-5 left-5 right-5 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="size-4" /> Sair
        </Button>
      </aside>

      <section className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <strong>Roma Ludus</strong>
            <Button onClick={logout} variant="ghost" size="icon"><LogOut className="size-4" /></Button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1">
            {tabs.map(({ id, Icon }) => (
              <button key={id} onClick={() => setActive(id)} className={`grid h-10 place-items-center ${active === id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {active === "quiz" ? <QuizPanel /> : null}
          {active === "chat" ? <ChatPanel /> : null}
          {active === "ranking" ? <RankingPanel /> : null}
          {active === "history" ? <HistoryPanel /> : null}
        </div>
      </section>
    </main>
  )
}

function QuizPanel() {
  const [theme, setTheme] = useState(themes[0])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const current = questions[index]
  const answered = selected !== null

  async function loadQuiz(nextTheme = theme) {
    setLoading(true)
    setError("")
    setSelected(null)
    try {
      const data = await generateQuiz(nextTheme)
      setQuestions(data.questions)
      setIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar quiz.")
    } finally {
      setLoading(false)
    }
  }

  async function answer(optionIndex: number) {
    if (!current || answered) return
    setSelected(optionIndex)
    await saveAttempt({
      theme: current.theme,
      question: current.statement,
      selectedAnswer: current.options[optionIndex],
      correctAnswer: current.options[current.correctIndex],
      isCorrect: optionIndex === current.correctIndex,
      explanation: optionIndex === current.correctIndex ? current.explanation : current.wrongFeedback[optionIndex] || current.explanation,
    }).catch(() => undefined)
  }

  const feedback = useMemo(() => {
    if (!current || selected === null) return ""
    return selected === current.correctIndex ? current.explanation : current.wrongFeedback[selected] || current.explanation
  }, [current, selected])

  return (
    <div>
      <PanelTitle icon={<Landmark className="size-5" />} title="Quiz por tema" subtitle="Escolha um tema e gere questões com Gemini." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {themes.map((item) => (
          <button
            key={item}
            onClick={() => {
              setTheme(item)
              loadQuiz(item)
            }}
            className={`border p-4 text-left text-sm font-semibold transition hover:border-primary ${
              theme === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Tema atual</p>
            <h2 className="text-xl font-black">{theme}</h2>
          </div>
          <Button onClick={() => loadQuiz()} disabled={loading}>{loading ? "Gerando..." : "Gerar quiz"}</Button>
        </div>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {current ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
            <div className="min-h-64 overflow-hidden bg-muted">
              {current.imageUrl ? (
                <img src={current.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center p-8 text-center text-muted-foreground">Questão sem imagem</div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Questão {index + 1} de {questions.length}</p>
              <h3 className="mt-2 text-2xl font-black leading-tight">{current.statement}</h3>
              <div className="mt-5 grid gap-3">
                {current.options.map((option, optionIndex) => {
                  const isCorrect = answered && optionIndex === current.correctIndex
                  const isWrong = answered && optionIndex === selected && optionIndex !== current.correctIndex
                  return (
                    <button
                      key={option}
                      onClick={() => answer(optionIndex)}
                      className={`border p-4 text-left transition ${
                        isCorrect ? "border-emerald-700 bg-emerald-50 text-emerald-950" : isWrong ? "border-destructive bg-red-50 text-red-950" : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              {answered ? (
                <div className="mt-5 border border-amber-900/20 bg-amber-50 p-4 text-sm leading-6">
                  <strong>{selected === current.correctIndex ? "Correto." : "Quase."}</strong> {feedback}
                </div>
              ) : null}
              <div className="mt-5 flex justify-end">
                <Button disabled={!answered} onClick={() => {
                  setSelected(null)
                  setIndex((value) => (value + 1) % questions.length)
                }}>Próxima questão</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid min-h-64 place-items-center border border-dashed text-center text-muted-foreground">
            Selecione um tema ou clique em gerar quiz.
          </div>
        )}
      </div>
    </div>
  )
}

function ChatPanel() {
  const [message, setMessage] = useState("")
  const [items, setItems] = useState<Array<{ role: "user" | "assistant"; text: string }>>([])
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!message.trim()) return
    const text = message.trim()
    setItems((current) => [...current, { role: "user", text }])
    setMessage("")
    setLoading(true)
    try {
      const data = await askRomanChat(text)
      setItems((current) => [...current, { role: "assistant", text: data.answer }])
    } catch (err) {
      setItems((current) => [...current, { role: "assistant", text: err instanceof Error ? err.message : "Erro no chat." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PanelTitle icon={<Bot className="size-5" />} title="Chat sobre o Império Romano" subtitle="Conversa temporária, sem persistência de mensagens." />
      <div className="mt-6 grid min-h-[560px] grid-rows-[1fr_auto] border bg-card p-4">
        <div className="space-y-3 overflow-y-auto pr-1">
          {items.length ? items.map((item, index) => (
            <div key={index} className={`max-w-[82%] p-4 text-sm leading-6 ${item.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
              {item.text}
            </div>
          )) : <div className="grid h-full place-items-center text-muted-foreground">Pergunte sobre batalhas, arquitetura, política, sociedade ou imperadores.</div>}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ex: Como funcionava o Senado Romano?" />
          <Button onClick={send} disabled={loading}>{loading ? "Consultando..." : "Enviar"}</Button>
        </div>
      </div>
    </div>
  )
}

function RankingPanel() {
  const [theme, setTheme] = useState("Geral")
  const [rows, setRows] = useState<RankingRow[]>([])
  useEffect(() => {
    getRanking(theme).then(setRows).catch(() => setRows([]))
  }, [theme])

  return (
    <div>
      <PanelTitle icon={<Medal className="size-5" />} title="Ranking" subtitle="Usuários com mais acertos por tema e no geral." />
      <select value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-6 h-10 border bg-card px-3">
        {["Geral", ...themes].map((item) => <option key={item}>{item}</option>)}
      </select>
      <div className="mt-4 overflow-hidden border bg-card">
        {rows.map((row, index) => (
          <div key={`${row.userName}-${row.theme}-${index}`} className="grid grid-cols-[56px_1fr_120px_120px] items-center gap-3 border-b p-4 text-sm last:border-b-0">
            <strong>#{index + 1}</strong>
            <span>{row.userName}</span>
            <span>{row.theme}</span>
            <span className="font-semibold">{row.correct}/{row.total}</span>
          </div>
        ))}
        {!rows.length ? <div className="p-8 text-center text-muted-foreground">Nenhum resultado salvo ainda.</div> : null}
      </div>
    </div>
  )
}

function HistoryPanel() {
  const [theme, setTheme] = useState("Todos")
  const [rows, setRows] = useState<HistoryRow[]>([])
  useEffect(() => {
    getHistory(theme).then(setRows).catch(() => setRows([]))
  }, [theme])

  return (
    <div>
      <PanelTitle icon={<History className="size-5" />} title="Histórico de questões" subtitle="Revise acertos e erros salvos no PostgreSQL." />
      <select value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-6 h-10 border bg-card px-3">
        {["Todos", ...themes].map((item) => <option key={item}>{item}</option>)}
      </select>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <div key={row.id} className="border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-primary">{row.theme}</span>
              <span className={`text-sm font-bold ${row.isCorrect ? "text-emerald-700" : "text-destructive"}`}>{row.isCorrect ? "Acertou" : "Errou"}</span>
            </div>
            <h3 className="mt-2 font-semibold">{row.question}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Sua resposta: {row.selectedAnswer}</p>
            <p className="text-sm text-muted-foreground">Resposta correta: {row.correctAnswer}</p>
            <p className="mt-2 text-sm leading-6">{row.explanation}</p>
          </div>
        ))}
        {!rows.length ? <div className="border border-dashed p-8 text-center text-muted-foreground">Sem histórico para este filtro.</div> : null}
      </div>
    </div>
  )
}

function PanelTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-11 place-items-center bg-primary text-primary-foreground">{icon}</div>
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}
