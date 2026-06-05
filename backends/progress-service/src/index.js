require("dotenv").config()

const cors = require("cors")
const crypto = require("crypto")
const express = require("express")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")

const app = express()
const port = process.env.PORT || 4003
const jwtSecret = process.env.JWT_SECRET || "roma-ludus-secret"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://roma:roma@localhost:5432/roma_ludus",
})

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }))
app.use(express.json())

async function init() {
  await pool.query(`
    create table if not exists users (
      id uuid primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    );
    create table if not exists quiz_attempts (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      theme text not null,
      question text not null,
      selected_answer text not null,
      correct_answer text not null,
      is_correct boolean not null,
      explanation text not null,
      created_at timestamptz not null default now()
    );
  `)
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "")
  try {
    req.user = jwt.verify(token, jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: "Sessao invalida." })
  }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "progress" }))

app.post("/attempts", requireAuth, async (req, res) => {
  const { theme, question, selectedAnswer, correctAnswer, isCorrect, explanation } = req.body
  if (!theme || !question || !selectedAnswer || !correctAnswer) {
    return res.status(400).json({ error: "Tentativa incompleta." })
  }
  const result = await pool.query(
    `insert into quiz_attempts
      (id, user_id, theme, question, selected_answer, correct_answer, is_correct, explanation)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [crypto.randomUUID(), req.user.sub, theme, question, selectedAnswer, correctAnswer, Boolean(isCorrect), explanation || ""],
  )
  res.status(201).json({ id: result.rows[0].id })
})

app.get("/ranking", requireAuth, async (req, res) => {
  const params = []
  let where = ""
  if (req.query.theme) {
    params.push(req.query.theme)
    where = "where a.theme = $1"
  }
  const result = await pool.query(
    `
    select u.name as "userName",
      ${req.query.theme ? "a.theme" : "'Geral'"} as theme,
      count(*) filter (where a.is_correct) :: int as correct,
      count(*) :: int as total
    from quiz_attempts a
    join users u on u.id = a.user_id
    ${where}
    group by u.name ${req.query.theme ? ", a.theme" : ""}
    order by correct desc, total asc, u.name asc
    limit 20
    `,
    params,
  )
  res.json(result.rows)
})

app.get("/history", requireAuth, async (req, res) => {
  const params = [req.user.sub]
  let themeFilter = ""
  if (req.query.theme) {
    params.push(req.query.theme)
    themeFilter = "and theme = $2"
  }
  const result = await pool.query(
    `
    select id, theme, question, selected_answer as "selectedAnswer",
      correct_answer as "correctAnswer", is_correct as "isCorrect",
      explanation, created_at as "createdAt"
    from quiz_attempts
    where user_id = $1 ${themeFilter}
    order by created_at desc
    limit 100
    `,
    params,
  )
  res.json(result.rows)
})

init()
  .then(() => app.listen(port, () => console.log(`progress-service on ${port}`)))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
