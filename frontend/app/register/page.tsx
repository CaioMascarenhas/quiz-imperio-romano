"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { register, setSession } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await register(name, email, password)
      setSession(data.token, data.user)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-amber-900/20 bg-card p-8 shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center bg-primary text-primary-foreground">
            <ScrollText className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Criar conta</h1>
            <p className="text-sm text-muted-foreground">Salve seu ranking e histórico.</p>
          </div>
        </div>
        <div className="grid gap-4">
          <Input placeholder="Nome" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input type="password" minLength={6} placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button disabled={loading} className="h-11">{loading ? "Criando..." : "Criar conta"}</Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Já possui conta? <Link className="font-semibold text-primary underline" href="/login">Entrar</Link>
        </p>
      </form>
    </main>
  )
}
