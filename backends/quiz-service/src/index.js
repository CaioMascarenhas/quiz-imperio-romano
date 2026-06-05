require("dotenv").config()

const cors = require("cors")
const express = require("express")
const jwt = require("jsonwebtoken")

const app = express()
const port = process.env.PORT || 4002
const jwtSecret = process.env.JWT_SECRET || "roma-ludus-secret"
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash"

let geminiClientPromise

const imageCatalog = [
  { name: "colosseum", url: "/roman-assets/colosseum.svg", description: "Coliseu, anfiteatro e arquitetura pública" },
  { name: "legion", url: "/roman-assets/legion.svg", description: "Legião romana, escudo, exército e organização militar" },
  { name: "senate", url: "/roman-assets/senate.svg", description: "Senado, política, república e debates públicos" },
  { name: "aqueduct", url: "/roman-assets/aqueduct.svg", description: "Aquedutos, engenharia, água e infraestrutura" },
]

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }))
app.use(express.json())

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "")
  try {
    req.user = jwt.verify(token, jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: "Sessão inválida." })
  }
}

function fallbackQuestions(theme) {
  return [
    {
      id: `${theme}-1`,
      theme,
      statement: `Qual alternativa melhor representa o tema ${theme} no contexto romano?`,
      imageUrl: imageCatalog[0].url,
      options: ["Expansão política e cultural", "Uso de tecnologia moderna", "Monarquia medieval", "Colonização americana"],
      correctIndex: 0,
      explanation: "A história romana combina expansão, administração, cultura e integração de povos.",
      wrongFeedback: [
        "Correto: Roma expandiu poder, cultura e administração por grande parte do Mediterrâneo.",
        "Tecnologia moderna não pertence ao período romano.",
        "Monarquia medieval é posterior ao Império Romano do Ocidente.",
        "Colonização americana é um processo muito posterior.",
      ],
    },
  ]
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  const first = cleaned.indexOf("{")
  const last = cleaned.lastIndexOf("}")
  if (first === -1 || last === -1) throw new Error("A Gemini não retornou JSON válido.")
  return JSON.parse(cleaned.slice(first, last + 1))
}

async function getGeminiClient() {
  if (!geminiKey) throw new Error("GEMINI_API_KEY não configurada.")

  if (!geminiClientPromise) {
    process.env.GOOGLE_API_KEY = geminiKey
    geminiClientPromise = import("@google/genai").then(({ GoogleGenAI }) => {
      return new GoogleGenAI({ apiKey: geminiKey })
    })
  }

  return geminiClientPromise
}

async function askGemini(prompt) {
  const ai = await getGeminiClient()
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
  })

  const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || ""
  if (!text.trim()) throw new Error("A Gemini respondeu sem texto.")
  return text
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "quiz", model: geminiModel }))

app.post("/quiz/generate", requireAuth, async (req, res) => {
  const theme = req.body.theme || "Imperadores"
  const prompt = `
Gere um quiz educativo, não violento, sobre o Império Romano no tema "${theme}".
Responda apenas JSON válido no formato:
{"questions":[{"id":"string","theme":"${theme}","statement":"string","imageUrl":"string ou null","options":["A","B","C","D"],"correctIndex":0,"explanation":"string","wrongFeedback":["feedback A","feedback B","feedback C","feedback D"]}]}
Regras: gere 5 questões, 4 alternativas cada, correctIndex entre 0 e 3, feedbacks explicam por que cada alternativa errada está errada e indicam a correta quando necessário.
Use imageUrl apenas se o assunto combinar com uma destas imagens locais do frontend:
${JSON.stringify(imageCatalog)}
`
  try {
    const text = await askGemini(prompt)
    const payload = extractJson(text)
    res.json(payload)
  } catch (error) {
    console.error("Falha ao gerar quiz com Gemini:", error.message)
    res.json({ questions: fallbackQuestions(theme), warning: error.message })
  }
})

app.post("/chat", requireAuth, async (req, res) => {
  const message = req.body.message || ""
  if (!message.trim()) return res.status(400).json({ error: "Informe uma pergunta." })

  const prompt = `
Você é um tutor de história do Império Romano em um jogo acadêmico não violento.
Responda em português do Brasil, com precisão histórica, tom educativo e até 140 palavras.
Pergunta do usuário: ${message}
`
  try {
    const answer = await askGemini(prompt)
    res.json({ answer })
  } catch (error) {
    console.error("Falha no chat com Gemini:", error.message)
    res.status(503).json({
      error:
        "Não consegui consultar a IA agora. Verifique a chave GEMINI_API_KEY, o GEMINI_MODEL e os logs do quiz-service.",
    })
  }
})

app.listen(port, () => console.log(`quiz-service on ${port} using ${geminiModel}`))
