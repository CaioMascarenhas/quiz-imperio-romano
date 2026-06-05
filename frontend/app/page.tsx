import Link from "next/link"
import { cookies } from "next/headers"
import { ArrowRight, Crown, Landmark, ScrollText, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const hasSession = Boolean((await cookies()).get("roma_token")?.value)

  return (
    <main className="min-h-screen overflow-hidden bg-[#170f0b] text-stone-50">
      <section className="relative flex min-h-screen items-center">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center blur-[3px]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,12,8,.93),rgba(86,20,18,.74),rgba(15,10,7,.5))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#170f0b] to-transparent" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.05fr_.95fr] md:px-10">
          <div className="flex max-w-3xl flex-col justify-center">
            <div className="mb-6 flex w-fit items-center gap-2 border border-amber-300/40 bg-black/30 px-3 py-2 text-sm text-amber-100 backdrop-blur">
              <Crown className="size-4 text-amber-300" />
              Jogo digital online nao violento
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-stone-50 sm:text-6xl lg:text-7xl">
              Roma Ludus
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">
              Um quiz sobre o Imperio Romano com questoes geradas por IA,
              feedback educativo, ranking por tema e historico de desempenho.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {hasSession ? (
                <Button asChild size="lg" className="bg-amber-400 text-stone-950 hover:bg-amber-300">
                  <Link href="/dashboard">
                    Ir para o dashboard <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-amber-400 text-stone-950 hover:bg-amber-300">
                    <Link href="/login">Va para o login</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-stone-200/60 bg-black/20 text-stone-50 hover:bg-stone-50 hover:text-stone-950">
                    <Link href="/register">Va para criar conta</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid content-end gap-4 pt-20 md:pt-48">
            {[
              { title: "Microservices", text: "Auth, quiz/chat IA e progresso em APIs Express separadas.", Icon: Shield },
              { title: "Aprendizado", text: "Questoes de alternativas com explicacao do erro e resposta correta.", Icon: ScrollText },
              { title: "Temas", text: "Politica, exercito, cultura, arquitetura, economia e imperadores.", Icon: Landmark },
            ].map(({ title, text, Icon }) => (
              <div key={title} className="border border-amber-200/20 bg-stone-950/45 p-5 backdrop-blur-md">
                <div className="flex items-start gap-4">
                  <Icon className="mt-1 size-5 text-amber-300" />
                  <div>
                    <h2 className="font-semibold text-amber-100">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-stone-300">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
