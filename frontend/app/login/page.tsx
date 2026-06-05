"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { Landmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login, setSession } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await login(email, password)
      setSession(data.token, data.user)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-amber-900/20 bg-card p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Entrar em Roma Ludus</h1>
            <p className="text-sm text-muted-foreground">Acesse seu painel de estudos.</p>
          </div>
        </div>
        <div className="grid gap-4">
          <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input type="password" placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button disabled={loading} className="h-11">{loading ? "Entrando..." : "Vá para o dashboard"}</Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Ainda não tem conta? <Link className="font-semibold text-primary underline" href="/register">Criar conta</Link>
        </p>
      </form>
    </main>
  )
}
