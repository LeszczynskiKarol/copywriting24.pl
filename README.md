# Copywriting24.pl — Darmowy Generator Tekstów AI

Kompletna aplikacja full-stack: darmowy generator treści AI pozycjonujący Smart-Copy.ai.

## Stack technologiczny

**Backend:** Fastify + Prisma + PostgreSQL + Zod + Claude Haiku 4.5  
**Frontend:** Vite + React + TypeScript + Tailwind CSS

## Szybki start

### 1. PostgreSQL

```bash
# Opcja A: Docker
docker compose up -d

# Opcja B: lokalny PostgreSQL — stwórz bazę "copywriting24"
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Uzupełnij .env: ANTHROPIC_API_KEY, DATABASE_URL

npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend startuje na `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend startuje na `http://localhost:5173`

## Konfiguracja `.env` (backend)

```env
DATABASE_URL="postgresql://copywriting24:copywriting24_dev@localhost:5432/copywriting24"
ANTHROPIC_API_KEY="sk-ant-..."
PORT=3001
FRONTEND_URL="http://localhost:5173"
DAILY_LIMIT=3
SMART_COPY_URL="https://smart-copy.ai"
```

## API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/generate` | Generuj tekst (JSON response) |
| POST | `/api/generate/stream` | Generuj tekst (SSE stream) |
| GET | `/api/limit-status?fingerprint=xxx` | Sprawdź limit |
| GET | `/api/health` | Health check |

## Rate Limiting

- **3 generacje dziennie** per fingerprint + IP
- Fingerprint generowany w przeglądarce (userAgent + screen + timezone)
- IP jako dodatkowe zabezpieczenie (shared IP protection)
- Reset o północy

## Architektura

```
copywriting24/
├── docker-compose.yml          # PostgreSQL
├── backend/
│   ├── prisma/schema.prisma    # Model bazy danych
│   └── src/
│       ├── server.ts           # Fastify setup
│       ├── routes/generate.ts  # Endpointy + rate limiting
│       └── services/textGenerator.ts  # Claude API
└── frontend/
    ├── index.html              # SEO meta tags + structured data
    └── src/
        ├── App.tsx             # Główny komponent (generator + SEO sekcje)
        ├── index.css           # Tailwind + custom styles
        └── main.tsx            # Entry point
```

## SEO

Frontend zawiera:
- Pełna optymalizacja meta tags (title, description, keywords)
- Open Graph + Twitter Cards
- Schema.org structured data (WebApplication + FAQPage)
- Semantyczny HTML z nagłówkami H1-H3
- Treści SEO pod frazy: "darmowy generator tekstów AI", "kreator treści za darmo", "bezpłatne AI do copywritingu"

## Deployment (produkcja)

### Backend (np. AWS EB, Railway, Render)
```bash
cd backend
npm run build
npm start
```

### Frontend (np. Vercel, Netlify, CloudFront)
```bash
cd frontend
npm run build
# dist/ → deploy
```

Ustaw zmienną `VITE_API_URL` na URL backendu (np. `https://api.copywriting24.pl`).
