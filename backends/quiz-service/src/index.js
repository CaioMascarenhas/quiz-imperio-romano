require("dotenv").config()

const cors = require("cors")
const express = require("express")
const jwt = require("jsonwebtoken")

const app = express()
const port = process.env.PORT || 4002
const jwtSecret = process.env.JWT_SECRET || "roma-ludus-secret"
const geminiKey = process.env.GEMINI_API_KEY || ""

const imageCatalog = [
  { name: "colosseum", url: "/roman-assets/colosseum.svg", description: "Coliseu, anfiteatro e arquitetura publica" },
  { name: "legion", url: "/roman-assets/legion.svg", description: "Legiao romana, escudo, exercito e organizacao militar" },
  { name: "senate", url: "/roman-assets/senate.svg", description: "Senado, politica, republica e debates publicos" },
  { name: "aqueduct", url: "/roman-assets/aqueduct.svg", description: "Aquedutos, engenharia, agua e infraestrutura" },
]

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }))
app.use(express.json())

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "")
  try {
    req.user = jwt.verify(token, jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: "Sessao invalida." })
  }
}

function fallbackQuestions(theme) {
  return [
    {
      id: `${theme}-1`,
      theme,
      statement: `Qual alternativa melhor representa o tema ${theme} no contexto romano?`,
      imageUrl: imageCatalog[0].url,
      options: ["Expansao politica e cultural", "Uso de tecnologia moderna", "Monarquia medieval", "Colonizacao americana"],
      correctIndex: 0,
      explanation: "A historia romana combina expansao, administracao, cultura e integracao de povos.",
      wrongFeedback: [
        "Correto: Roma expandiu poder, cultura e administracao por grande parte do Mediterraneo.",
        "Tecnologia moderna nao pertence ao periodo romano.",
        "Monarquia medieval e posterior ao Imperio Romano do Ocidente.",
        "Colonizacao americana e um processo muito posterior.",
      ],
    },
  ]
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  const first = cleaned.indexOf("{")
  const last = cleaned.lastIndexOf("}")
  return JSON.parse(cleaned.slice(first, last + 1))
}

async function askGemini(prompt) {
  if (!geminiKey) throw new Error("GEMINI_API_KEY nao configurada.")
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || "Erro na Gemini API.")
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "quiz" }))

app.post("/quiz/generate", requireAuth, async (req, res) => {
  const theme = req.body.theme || "Imperadores"
  const prompt = `
Gere um quiz educativo, nao violento, sobre o Imperio Romano no tema "${theme}".
Responda apenas JSON valido no formato:
{"questions":[{"id":"string","theme":"${theme}","statement":"string","imageUrl":"string ou null","options":["A","B","C","D"],"correctIndex":0,"explanation":"string","wrongFeedback":["feedback A","feedback B","feedback C","feedback D"]}]}
Regras: gere 5 questoes, 4 alternativas cada, correctIndex entre 0 e 3, feedbacks explicam por que cada alternativa errada esta errada e indicam a correta quando necessario.
Use imageUrl apenas se o assunto combinar com uma destas imagens locais do frontend:
${JSON.stringify(imageCatalog)}
`
  try {
    const text = await askGemini(prompt)
    const payload = extractJson(text)
    res.json(payload)
  } catch (error) {
    res.json({ questions: fallbackQuestions(theme), warning: error.message })
  }
})

app.post("/chat", requireAuth, async (req, res) => {
  const message = req.body.message || ""
  if (!message.trim()) return res.status(400).json({ error: "Informe uma pergunta." })

  const prompt = `
Voce e um tutor de historia do Imperio Romano em um jogo academico nao violento.
Responda em portugues do Brasil, com precisao historica, tom educativo e ate 140 palavras.
Pergunta do usuario: ${message}
`
  try {
    const answer = await askGemini(prompt)
    res.json({ answer })
  } catch (error) {
    res.json({ answer: "Nao consegui consultar a IA agora. Mesmo assim, posso te ajudar: reformule a pergunta ou tente novamente em instantes." })
  }
})

app.listen(port, () => console.log(`quiz-service on ${port}`))
