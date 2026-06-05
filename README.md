# Roma Quiz

Roma Quiz é um quiz online sobre o Império Romano, feito como projeto acadêmico com frontend em Next.js, microserviços Express e um banco PostgreSQL compartilhado.

## Arquitetura

O projeto é dividido em 5 serviços no Docker Compose:

| Serviço | Porta | Função |
| --- | --- | --- |
| `frontend` | `3000` | Interface Next.js com landing page, login, dashboard, quiz, chat, ranking e histórico. |
| `auth-service` | `4001` | Cadastro, login, hash de senha e geração de JWT. |
| `quiz-service` | `4002` | Geração de questões e chat sobre o Império Romano usando Gemini/IA. |
| `progress-service` | `4003` | Registro de tentativas, histórico do usuário e ranking. |
| `postgres` | `5432` | Banco PostgreSQL único usado pelos serviços. |

## Módulos Da Aplicação

### Landing Page

Página inicial com logo, imagem do Coliseu ao fundo e botões para login, criação de conta ou dashboard quando o usuário já possui sessão.

### Autenticação

O usuário pode criar conta e entrar no sistema. O frontend guarda o token em `localStorage` e cookie `roma_token`. Os microserviços validam o JWT nas rotas protegidas.

### Quiz Por Tema

O usuário escolhe um tema do Império Romano. O `quiz-service` consulta a IA e retorna questões em JSON com:

- enunciado;
- alternativas;
- índice da resposta correta;
- feedback por alternativa;
- imagem relacionada quando aplicável.

Enquanto as questões são geradas, o frontend mostra uma animação Lottie do Coliseu.

### Chat

Chat sobre o Império Romano usando IA. O frontend envia a pergunta atual e até 5 mensagens recentes como contexto para dar continuidade à conversa.

### Ranking

Mostra usuários ordenados por acertos. As posições possuem títulos:

- 1º lugar: Imperador;
- 2º lugar: Senador;
- 3º lugar: General;
- demais posições: Centurião.

### Histórico

Mostra as questões respondidas pelo usuário, separadas por tema, com resposta escolhida, resposta correta e explicação.

## Variáveis De Ambiente

O arquivo principal usado pelo Compose é:

```text
frontend/.env
```

Exemplo:

```env
AUTH_SECRET=sua_chave_para_jwt
GEMINI_API_KEY=sua_chave_do_gemini
GEMINI_MODEL=gemini-3.5-flash
```

### Variáveis

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `AUTH_SECRET` | Sim | Segredo usado para assinar e validar JWT. |
| `GEMINI_API_KEY` | Sim | Chave da API Gemini usada pelo `quiz-service`. |
| `GEMINI_MODEL` | Sim | Modelo Gemini usado para quiz e chat. Exemplo: `gemini-3.5-flash`. |
| `NEXT_PUBLIC_AUTH_API_URL` | Docker define | URL pública do `auth-service` para o frontend. |
| `NEXT_PUBLIC_QUIZ_API_URL` | Docker define | URL pública do `quiz-service` para o frontend. |
| `NEXT_PUBLIC_PROGRESS_API_URL` | Docker define | URL pública do `progress-service` para o frontend. |
| `DATABASE_URL` | Docker define | String de conexão PostgreSQL para backends. |
| `JWT_SECRET` | Docker define | Mesmo valor de `AUTH_SECRET`, usado nos serviços. |

## Como Rodar Com Docker

Na raiz do projeto:

```bash
cd "C:\Users\caio-estg\Desktop\Projetos\ufal\quizimperioromano"
docker compose up --build
```

Depois acesse:

```text
http://localhost:3000
```

Para parar:

```bash
docker compose down
```

Para apagar também os dados do banco:

```bash
docker compose down -v
```

## Rodando Para Desenvolvimento

Você pode subir banco e backends no Docker:

```bash
docker compose up --build postgres auth-service quiz-service progress-service
```

Em outro terminal, rode o frontend local:

```bash
cd "C:\Users\caio-estg\Desktop\Projetos\ufal\quizimperioromano\frontend"
npm.cmd install
npm.cmd run dev -- -p 3010
```

Acesse:

```text
http://localhost:3010
```

Se a porta `3000` estiver livre, também pode usar:

```bash
npm.cmd run dev
```

## Comandos Úteis

### Build Do Frontend

```bash
cd frontend
npm.cmd run build
```

### Ver Logs Do Serviço De IA

```bash
docker compose logs quiz-service
```

### Rebuild Apenas Do Quiz Service

```bash
docker compose up --build quiz-service
```

### Rebuild Apenas Do Frontend

```bash
docker compose up --build frontend
```

## Estrutura De Pastas

```text
quizimperioromano/
  docker-compose.yml
  frontend/
    app/
      page.tsx
      login/
      register/
      dashboard/
    lib/
      api.ts
    public/
      animations/
      roman-assets/
      logo.jpeg
  backends/
    auth-service/
    quiz-service/
    progress-service/
```

## Observações

- O banco é único para simplificar o projeto acadêmico, embora a aplicação esteja organizada em microserviços.
- O chat não persiste conversas no banco.
- O histórico e o ranking persistem as tentativas do quiz no PostgreSQL.
- Se a IA falhar, o backend não retorna questões mockadas; o usuário verá mensagem de erro e poderá tentar novamente.
