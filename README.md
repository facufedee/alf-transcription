# ALF — Real-Time Conference Transcription & Translation

**¿Te acordás de ALF?** Volvió en forma de transcriptor open source para
[Nerdearla 2026](https://nerdearla.com) — construido para la **Vibeathon 2026**.

ALF toma audio en vivo de **varios escenarios en paralelo**, lo transcribe con
**Gemini** en el idioma original, lo traduce (EN↔ES) y lo emite como
**subtítulos en tiempo real** a una web donde cada persona elige sesión e idioma.
Open source (MIT), pensado para que cualquier conferencia lo despliegue.

Ver [docs/ROADMAP.md](docs/ROADMAP.md) para el detalle completo de decisiones de
arquitectura, fases y contra qué nos evalúa el challenge.

## Qué incluye

- 🎙️ Transcripción con la Live API de Gemini (`gemini-3.8-live`) — llega en tandas
  cada ~5-10 s, no palabra por palabra (ver **Latencia** abajo)
- 🌍 Traducción EN↔ES por oración con Gemini (`gemini-3.5-flash-lite`)
- 🖥️ Múltiples escenarios en paralelo, cada uno con su propia sesión de Gemini
- 👀 Vista de audiencia (`/watch`) — elegís sesión + idioma
- 📺 Overlay transparente para OBS/vMix (`/overlay/[id]`)
- 🔐 Login solo para operadores (Google OAuth vía Auth.js) — la audiencia nunca se loguea
- 🛠️ Panel de administración (`/admin`)
- 🐳 Docker Compose para levantar todo local

## Arquitectura

```
 [Operador]                          [Backend]                        [Audiencia]
  /admin, mic → PCM16 16kHz  ──ws──▶  Express + Socket.IO               /watch/[id]?lang=es
                                       ├─ namespace /ingest (con token)
                                       ├─ StageManager (1 pipeline por sala)
                                       │   ├─ Gemini Live  → transcripción
                                       │   └─ Gemini Flash → traducción
                                       └─ namespace /watch (público, solo lectura) ──ws──▶ subtítulos

 [Frontend Next.js]  landing · login · admin · watch · overlay
```

El contrato de eventos entre frontend y backend vive en
[`shared/events.ts`](shared/events.ts) — es la fuente de verdad de namespaces,
eventos de Socket.IO y formato de audio (PCM16 mono, 16 kHz).

## Estructura del repo

```
alf-transcription/
├── shared/events.ts          # contrato frontend↔backend
├── backend/
│   ├── src/
│   │   ├── index.ts          # bootstrap
│   │   ├── config/           # env (zod) y stages predefinidas
│   │   ├── http/routes/      # health, stages
│   │   ├── realtime/         # namespaces /ingest y /watch (Socket.IO)
│   │   └── services/
│   │       ├── gemini/       # liveTranscriber, translator, client
│   │       ├── pipeline/     # segmentador de oraciones
│   │       └── stages/       # StageManager
│   └── scripts/simulate.ts   # streamea un .wav de samples/ como si fuera un operador
├── frontend/
│   ├── app/                  # landing, login, admin, watch, watch/[id], overlay/[id]
│   ├── auth.ts, middleware.ts, auth.config.ts  # Auth.js (Google OAuth)
│   └── lib/, hooks/
├── samples/                  # audios de prueba (EN y ES)
├── docker-compose.yml
└── docs/ROADMAP.md
```

## Requisitos

- Node.js 20+
- Una API key de [Google AI Studio](https://aistudio.google.com/apikey) con
  acceso a Gemini (necesita **facturación habilitada** en el proyecto de
  Google Cloud — el free tier limita a 15 requests/min, insuficiente para
  varias sesiones en paralelo)
- Docker + Docker Compose (opcional, para levantar todo junto)

## Setup local

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Completar GEMINI_API_KEY en .env (ver backend/.env.example)
npm run dev
```

Levanta en `http://localhost:5000`. Variables relevantes en
[`backend/.env.example`](backend/.env.example):

| Variable | Qué es |
|---|---|
| `GEMINI_API_KEY` | Requerida. API key de AI Studio, nunca en el frontend |
| `GEMINI_LIVE_MODEL` | Modelo de transcripción (default `gemini-3.8-live`) |
| `GEMINI_TRANSLATE_MODEL` | Modelo de traducción (default `gemini-3.5-flash-lite`) |
| `INGEST_TOKEN` | Token que deben mandar los operadores para transmitir audio. Vacío = abierto (solo para dev local) |
| `AUTH_SECRET` | Compartido con el frontend para validar el JWT de los operadores |

### Probar el pipeline sin micrófono

Con el backend corriendo, streameá los audios de prueba como si fueran
operadores en vivo:

```bash
cd backend
npm run simulate -- sala-1:en:../samples/en-kubernetes-tts.wav sala-2:es:../samples/es-postgres-tts.wav
```

Imprime cada oración transcripta y su traducción a medida que llegan.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Completar NEXT_PUBLIC_BACKEND_URL, AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAILS
npm run dev
```

Levanta en `http://localhost:3000`. El login de operadores usa Google OAuth —
necesitás un Client ID/Secret de Google Cloud Console y agregar los emails
autorizados a `ADMIN_EMAILS` (separados por coma).

### Con Docker

```bash
docker compose up --build
```

Backend en `:5000`, frontend en `:3000`. El backend lee `backend/.env` (no se
commitea, no se copia a la imagen — ver `.dockerignore`).

## Latencia

Medido con audio real (una charla completa de Nerdearla, no un clip de prueba):
los subtítulos llegan en **tandas de ~5-10 segundos**, no palabra por palabra.

Por qué: la Live API de Gemini solo entrega `inputTranscription` al cerrar una
"actividad" (`activityEnd`). Probamos acortar ese ciclo a 2s esperando texto
más fluido, pero **empeoró** la latencia (12s → 12s → 28s, creciendo) — Gemini
no transcribe tan rápido como se lo pedimos, y pedirle más seguido solo genera
una cola. 5s es el punto medido como estable contra una charla real de 15+
minutos. El detalle completo está en los comentarios de
[`liveTranscriber.ts`](backend/src/services/gemini/liveTranscriber.ts)
(`CYCLE_MS`) — activar `DEBUG_LIVE=1` antes de tocar ese valor.

## Configurar salas / glosario

Las salas de la demo están predefinidas en
[`backend/src/config/stages.ts`](backend/src/config/stages.ts): id, nombre,
idioma de origen y un glosario de texto libre (nombres de speakers,
tecnologías) que se inyecta en el prompt de Gemini para mejorar precisión.
Editá ese archivo para agregar más salas o cambiar el glosario.

## Tests

```bash
cd backend
npm test          # segmentador de oraciones + reconexión de la sesión Live (mockeado, no gasta cuota)
npm run type-check
```

## Deploy

- **Frontend → Vercel** (ya desplegado: https://alf-transcription.vercel.app/)
- **Backend → Google Cloud Run** — Vercel no soporta WebSockets persistentes.
  Usar `min-instances=1` para no perder la conexión de audio en cold starts.

## Escalar a más sesiones

Cada sala corre su propia sesión de Gemini Live de forma aislada
(`StageManager`, un `LiveTranscriber` por sala) — agregar salas es agregar
entradas en `stages.ts`. El límite real es la cuota de la API key: con
facturación habilitada el free-tier de 15 req/min deja de ser el techo; el
costo por hora escala linealmente con la cantidad de salas activas.

## Licencia

MIT — ver [LICENSE](LICENSE).

---

Construido para la Vibeathon de Nerdearla 2026. Dudas: canal
`#nerdearla-vibeathon` en el Discord de Nerdearla.
