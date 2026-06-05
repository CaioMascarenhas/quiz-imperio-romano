import Link from "next/link"
import { cookies } from "next/headers"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const hasSession = Boolean((await cookies()).get("roma_token")?.value)

  return (
    <main className="min-h-screen overflow-hidden bg-[#170f0b] text-stone-50">
      <section className="relative flex min-h-screen items-center">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-[6px]"
          style={{ backgroundImage: "url('/roman-assets/coliseu.jpg')" }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url('/roman-assets/coliseu.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(245,217,130,.16),transparent_28rem),linear-gradient(90deg,rgba(23,15,11,.96),rgba(76,20,17,.82),rgba(23,15,11,.38))]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#170f0b] to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-12 md:px-10">
          <div className="flex max-w-3xl flex-col justify-center">
            <img src="/logo.jpeg" alt="Roma Quiz" className="mb-7 h-auto w-full max-w-[320px] border border-amber-300/30 shadow-2xl" />
            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-stone-50 sm:text-6xl lg:text-7xl">
              Roma Quiz
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">
              Teste seus conhecimentos sobre o Império Romano com questões por tema,
              feedback educativo, ranking e histórico de desempenho.
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
                    <Link href="/login">Vá para o login</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-stone-200/60 bg-black/20 text-stone-50 hover:bg-stone-50 hover:text-stone-950">
                    <Link href="/register">Vá para criar conta</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
