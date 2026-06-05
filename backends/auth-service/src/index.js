require("dotenv").config()

const bcrypt = require("bcryptjs")
const cors = require("cors")
const express = require("express")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")

const app = express()
const port = process.env.PORT || 4001
const jwtSecret = process.env.JWT_SECRET || "roma-ludus-secret"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://roma:roma@localhost:5432/roma_ludus",
})

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }))
app.use(express.json())

async function init() {
  await pool.query(`
    create extension if not exists "uuid-ossp";
    create table if not exists users (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    );
  `)
}

function signUser(user) {
  return jwt.sign({ sub: user.id, name: user.name, email: user.email }, jwtSecret, { expiresIn: "7d" })
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "auth" }))

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Informe nome, email e senha com pelo menos 6 caracteres." })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      "insert into users (name, email, password_hash) values ($1, lower($2), $3) returning id, name, email",
      [name, email, passwordHash],
    )
    const user = result.rows[0]
    res.status(201).json({ token: signUser(user), user: publicUser(user) })
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Email ja cadastrado." })
    res.status(500).json({ error: "Erro ao criar usuario." })
  }
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: "Informe email e senha." })

  const result = await pool.query("select * from users where email = lower($1)", [email])
  const user = result.rows[0]
  if (!user) return res.status(401).json({ error: "Credenciais invalidas." })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: "Credenciais invalidas." })

  res.json({ token: signUser(user), user: publicUser(user) })
})

app.get("/me", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "")
  try {
    const payload = jwt.verify(token, jwtSecret)
    res.json({ user: { id: payload.sub, name: payload.name, email: payload.email } })
  } catch {
    res.status(401).json({ error: "Sessao invalida." })
  }
})

init()
  .then(() => app.listen(port, () => console.log(`auth-service on ${port}`)))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
