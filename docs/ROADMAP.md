# ALF — Roadmap

> **Deadline:** viernes 25/09 · 15:00 UTC (12:00 AR).
> Orden = prioridad. Si algo no llega, se corta desde abajo, nunca desde arriba.
> Este archivo es la fuente de verdad para cualquier agente (Claude, Gemini) que trabaje en el repo.

---

## 1. Qué es ALF y contra qué nos evalúan

Toma el audio en vivo de **N escenarios en paralelo**, lo transcribe con **Gemini** en el idioma original,
lo traduce (EN→ES y, si se puede, ES→EN) y lo emite como **subtítulos en tiempo real** a una web
donde cada persona elige **sesión + idioma**. Open source (MIT) y desplegable por cualquier conferencia.

**Problema real:** Nerdearla usa hoy dos herramientas comerciales (ES→ES y EN→ES), con +30 sesiones en inglés
en simultáneo. Es caro, depende de operación manual y no se replica en otros eventos. No buscamos reemplazar
intérpretes humanos: buscamos la mejor solución **abierta**.

### Requisitos mínimos (si falta uno, no nos evalúan)
- [ ] Recibir audio en vivo de al menos una fuente (mic, archivo o stream)
- [ ] **Audios de prueba en el repo** + opción sencilla para importarlos y probar
- [ ] Transcripción en tiempo real del idioma original (ES o EN)
- [ ] Traducción en tiempo real **EN→ES**
- [ ] Mostrar subtítulos (web)
- [ ] **≥ 2 sesiones en simultáneo** + explicar en el README cómo escalar a más
- [ ] Repo público con licencia OSI (MIT ✓) y README: cómo levantarlo, qué credenciales/modelos necesita
- [ ] **Video demo 1–2 min en YouTube**, con audio real de una charla de Nerdearla (youtube.com/nerdearla).
      Pro-tip: jurados no hablan español → **subtítulos en inglés hechos con ALF**
- [ ] Envío por **Devpost** antes del 25/09 15:00 UTC. Proyecto construido 24–25/09 (repo arrancó el 24 ✓)

### Criterios de evaluación → cómo los atacamos
| Criterio | Nuestra respuesta |
|---|---|
| **Calidad** (incl. términos técnicos) | Glosario por sesión inyectado en el prompt de Gemini (nombres de speakers, tecnologías) |
| **Latencia** | Medida: primera transcripción ~1s, traducción ~1s de atraso, sin cola acumulada — modelo dedicado `gemini-3.5-transcribe-live` con resultados incrementales (`interimInputTranscription`) + traducción con concurrencia acotada. Detalle en README § Latencia |
| **Escalabilidad** | 1 pipeline aislado por escenario; costo por hora documentado; guía para escalar horizontal |
| **Despliegue y operación** | `docker compose up` + guía Cloud Run; panel de operación con estado de cada sala |
| **Innovación** | Overlay para OBS, export SRT/VTT, glosario, panel de monitoreo |

**Jurado:** Eduardo Casarero (Nerdearla), Thor Schaeff y Omar Sanseviero (Google DeepMind), Tomás Barreiro (Cline).
→ Dos son de DeepMind: usar bien las capacidades de audio de Gemini **suma**; mencionarlo explícito en README y video.

### Opcionales del challenge (en orden de costo/beneficio para nosotros)
1. **Overlay para OBS/vMix**: página `/overlay/[id]` con fondo transparente → se agrega como *Browser Source*. Barato y vistoso.
2. **Glosario** de términos y nombres propios por sesión.
3. **Export** de la transcripción al final de la charla (SRT / VTT / TXT).
4. **Panel de monitoreo**: estado de cada sesión, latencia, errores.
5. Más idiomas (portugués).

**Canal de dudas:** Discord de sysarmy → #nerdearla-vibeathon

## 2. Arquitectura

```
 [Operador del escenario]           [Backend · Cloud Run]                     [Audiencia]
  navegador /admin/stage/:id         Node + Express + Socket.IO                navegador /watch/:id?lang=es
  micrófono → PCM16 16kHz ──ws──▶   StageManager (1 pipeline por escenario)
                                      ├─ Gemini Live  → transcripción original
                                      └─ Gemini Flash → traducción por frase ──ws──▶ subtítulos
                                     rooms: stage:{id}:{lang}
 [Frontend · Vercel]  Next.js 14 (landing, login, admin, watch)
```

**Decisiones tomadas (no re-discutir):**

| Tema | Decisión | Por qué |
|---|---|---|
| Hosting frontend | Vercel | Ya está andando |
| Hosting backend | **Google Cloud Run** (WebSockets, `min-instances=1`, `max-instances=1`) | Vercel no soporta sockets persistentes; usa los créditos de Google |
| Transcripción | **Gemini Live API**, modelo dedicado `gemini-3.5-transcribe-live` | Resultados incrementales reales (`interimInputTranscription` cada ~500ms); primera transcripción ~1s (medido) |
| Traducción | **Gemini Flash (texto)** sobre cada frase final | Barato, sin API de Translate aparte |
| SDK | `@google/genai` (reemplaza a `@google/generative-ai`, deprecado) | |
| Estado | En memoria (1 instancia) + `stages.json` | Sin DB para el MVP |
| Login | Solo para **organizadores/operadores**. La audiencia **no** se loguea | Accesibilidad: cero fricción para quien mira |
| Auth | Auth.js (NextAuth) con Google + allowlist de emails → JWT que valida el backend | |

> ⚠️ Las sesiones de Gemini Live tienen límite de duración. El pipeline **tiene** que reconectar solo
> (session resumption) sin cortar subtítulos. Verificar límites y nombre del modelo vigente en la doc de AI Studio.

## 3. Estructura objetivo del repo

```
alf-transcription/
├── shared/                     # contratos compartidos front/back (tipos de eventos)
│   └── events.ts
├── backend/src/
│   ├── index.ts                # solo bootstrap
│   ├── config/env.ts           # env validado con zod — si falta algo, no arranca
│   ├── http/routes/            # health, stages
│   ├── realtime/
│   │   ├── ingest.ts           # namespace /ingest  (operadores, requiere token)
│   │   └── audience.ts         # namespace /watch   (público, solo lectura)
│   ├── services/
│   │   ├── gemini/liveTranscriber.ts
│   │   ├── gemini/translator.ts
│   │   └── stages/stageManager.ts
│   └── middleware/             # auth JWT, rate limit
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # landing: hero + features
│   │   ├── login/
│   │   ├── watch/              # lista de sesiones + /watch/[id]
│   │   └── admin/              # panel + /admin/stage/[id] (captura de audio)
│   ├── components/
│   └── lib/                    # socket.ts, api.ts, audio/ (worklet PCM)
├── docs/                       # ROADMAP, DEPLOY, ARCHITECTURE
├── docker-compose.yml
└── .env.example
```

**Contrato de eventos (`shared/events.ts`)** — lo primero que se escribe, todo lo demás depende de esto:

```ts
// operador → backend   (namespace /ingest)
'stage:start'  { stageId, sourceLang: 'en' | 'es' }
'audio:chunk'  ArrayBuffer  // PCM16 mono 16kHz, ~100ms
'stage:stop'   { stageId }

// backend → audiencia  (namespace /watch, room stage:{id}:{lang})
'caption'      { stageId, lang, seq, text, isFinal, ts }
'stage:status' { stageId, live: boolean }
```

---

## 4. Fases

### Fase 0 — Ordenar la casa · ✅ hecha
- [x] `.gitignore` (node_modules, .next, .env, dist); `alf-project.zip` + `setup-alf.bat` fuera del repo
- [x] `.env.example` en back y front; el backend valida el env con zod y no arranca sin `GEMINI_API_KEY`
- [x] Migrado a `@google/genai`; `zod`, `helmet`, `express-rate-limit`; dev con `tsx watch`
- [x] `shared/events.ts` con el contrato (back lo importa relativo, front vía alias `@shared/*`)
- [x] `index.ts` partido en `config/`, `http/`, `realtime/` (namespace `/watch` ya valida y une a rooms)
- [x] Dockerfiles con contexto = raíz del repo (para incluir `shared/`), node 20, usuario no root, `output: standalone`

### Fase 1 — Pipeline núcleo (lo que gana o pierde la hackathon) · 🟡 código listo, falta probar con Gemini
- [x] `liveTranscriber`: sesión Gemini Live por escenario, solo transcribe (turno manual abierto), reanuda con handle
      en `goAway`/cierre, backoff, buffer de ~10 s mientras reconecta, timeout de conexión (el SDK se cuelga si Google corta en el handshake)
- [x] `segmenter`: fragmentos → parciales + una final por frase (puntuación, silencio 1.2 s o 180 caracteres). Tests: `npm test`
- [x] `translator`: frase final → traducción con Flash-Lite (sin thinking), con glosario y 2 frases de contexto; cola por escenario que respeta el orden
- [x] Glosario por escenario inyectado en transcripción y traducción
- [x] `stageManager`: N escenarios aislados, historial de finales por idioma (para late joiners y export)
- [x] `/ingest` (token `INGEST_TOKEN`, ack en start/stop, valida tamaño de chunks) y `/watch` (manda historial al suscribirse)
- [x] `samples/`: 2 audios TTS (EN Kubernetes, ES Postgres) + `npm run simulate -- sala-1:en:../samples/x.wav ...`
- [x] Circuito probado sin Gemini: 2 escenarios en paralelo, start/stop limpio, sin reconexiones colgadas
- [x] **Probado con Gemini real**: modelo dedicado de transcripción `gemini-3.5-transcribe-live` (real-time, sin el hack de ciclos manuales que necesitaba `gemini-3.8-live`) + `gemini-3.5-flash-lite` para traducción
- [x] Validado `GEMINI_LIVE_MANUAL_ACTIVITY=true` con ciclo de `activityEnd`/`activityStart` cada 5s — el modelo genera una respuesta de audio trivial ("---") que se ignora, no interfiere
- [ ] Sumar una charla real de Nerdearla a `samples/` (probada localmente con un MP3 bajado de YouTube, sin commitear por derechos de autor — ver README)
- [ ] **Prueba de escala:** 5 escenarios en paralelo; anotar latencia y costo por hora → README (solo probado hasta 2 en paralelo)

### Fase 2 — Vista de audiencia + overlay · ~2 h
- [ ] `/watch`: lista de escenarios con estado en vivo
- [ ] `/watch/[id]?lang=es|en`: subtítulos grandes, alto contraste, auto-scroll, parcial en gris / final en blanco
- [ ] Selector de idioma y de tamaño de letra; funciona en celular
- [ ] Reconexión automática del socket
- [ ] `/overlay/[id]?lang=en`: fondo transparente, 2 líneas, para OBS/vMix *Browser Source* (también sirve para
      grabar el video demo con subtítulos en inglés)

### Fase 3 — Panel de operación · ~2 h
- [ ] `/admin`: crear/listar escenarios (nombre, idioma de origen, glosario), copiar link público y de overlay
- [ ] Monitoreo por escenario: en vivo / caído, latencia, último error
- [ ] `/admin/stage/[id]`: fuente = micrófono **o** audio de `samples/` / archivo subido; vúmetro; Iniciar/Detener
- [ ] Export al terminar: descargar SRT / VTT / TXT (captions quedan en memoria por escenario)
- [ ] Landing: hero (hecho) + sección features + footer con link a GitHub

### Fase 4 — Login y seguridad · ~1.5 h
> El login **no** es requisito del challenge: si el tiempo aprieta, se reemplaza por un `ADMIN_TOKEN` en `.env`.
- [ ] `/login` con Auth.js + Google; allowlist por `ADMIN_EMAILS`; middleware de Next protege `/admin/*`
- [ ] `/ingest` exige JWT de operador (firmado con `AUTH_SECRET` compartido); `/watch` es público y solo lectura
- [ ] La API key de Gemini **solo** vive en el backend
- [ ] CORS cerrado a `FRONTEND_URL`; `helmet`; rate limit en HTTP y en conexiones de socket
- [ ] Validación con zod de todo payload entrante; tope de tamaño de `audio:chunk`

### Fase 5 — Deploy · ~1.5 h
- [ ] Dockerfile de producción del backend (multi-stage, usuario no root)
- [ ] Deploy a Cloud Run con session affinity y timeout alto (3600 s)
- [ ] Variables en Vercel apuntando al backend de Cloud Run
- [ ] `docker compose up` levanta todo local con un solo comando

### Fase 6 — Entrega · ~1.5 h
- [ ] README: qué es, cómo levantarlo, **qué credenciales y modelos necesita**, **cómo escalar a más sesiones**,
      costo estimado por hora/escenario, uso de Gemini explicado (el jurado incluye DeepMind)
- [ ] `docs/DEPLOY.md`: guía paso a paso para que otra conferencia lo levante
- [ ] **Video 1–2 min en YouTube**: charla real de Nerdearla, 2+ escenarios en paralelo, EN→ES en vivo,
      y el propio video subtitulado en inglés con el overlay de ALF
- [ ] Repo público, licencia MIT visible
- [ ] Submit en **Devpost** antes de las **11:00 AR** (una hora de colchón)

### Post-hackathon (no tocar antes del deadline)
- Modo 100% local con Gemma · portugués y más idiomas · persistencia de transcripciones
- Ingesta por RTMP/SRT desde la consola de sonido · Redis para multi-instancia

---

## 5. Qué necesito de vos (checklist)

Por orden de urgencia — lo de **Fase 1** me bloquea ya.

**Google / Gemini (bloqueante)**
1. Canjear los **US$ 25 de créditos** de Google Developers Platform.
2. Crear (o elegir) un **proyecto de Google Cloud** y asociarle esos créditos / billing.
3. En **Google AI Studio** (aistudio.google.com) → *Get API key* → crearla **en ese proyecto**.
   Pasámela por `.env` local, **nunca** por el chat ni commiteada. → `GEMINI_API_KEY`
4. Confirmar en AI Studio que el modelo Live (audio) está disponible para tu key.
5. Elegir 2–3 charlas de youtube.com/nerdearla (al menos una en inglés y una en español) para `samples/` y el video.

**Login (Fase 4 — opcional)**
6. En Google Cloud Console → *APIs & Services → Credentials* → **OAuth client ID** (tipo Web).
   Redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://alf-transcription.vercel.app/api/auth/callback/google`
   → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
7. Lista de emails que pueden entrar al panel → `ADMIN_EMAILS`

**Deploy (Fase 5)**
8. Instalar `gcloud` CLI y loguearte (`gcloud auth login`), o darme acceso para correr el deploy.
9. Habilitar en el proyecto: **Cloud Run** y **Artifact Registry**.
10. En Vercel → Settings → Environment Variables: cargar las del front (te paso la lista exacta).

**Decisiones**
11. ¿Cuántos escenarios mostramos en la demo? (sugiero 3)
12. ¿Licencia MIT confirmada? (está aprobada por la OSI, cumple el requisito)
13. Tener cuenta en **Devpost** y en **YouTube** para subir el video.

## 6. Variables de entorno

| Variable | Dónde | Qué es |
|---|---|---|
| `GEMINI_API_KEY` | backend | Key de AI Studio |
| `PORT` | backend | Puerto HTTP (Cloud Run lo inyecta solo) |
| `FRONTEND_URL` | backend | Orígenes permitidos por CORS, separados por coma |
| `AUTH_SECRET` | back + front | Firma de los JWT (mismo valor en ambos) |
| `NEXT_PUBLIC_BACKEND_URL` | frontend | URL de Cloud Run |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | frontend | OAuth |
| `ADMIN_EMAILS` | frontend | Allowlist del panel |

## 7. Reglas para agentes (Claude / Gemini)

- Leé este archivo antes de tocar código. Trabajá **una fase / un checkbox a la vez** y marcalo al terminar.
- No cambies el contrato de `shared/events.ts` sin actualizarlo acá.
- Archivos chicos y con una sola responsabilidad; nada de lógica en `index.ts`.
- Nunca commitear `.env` ni keys. Nunca llamar a Gemini desde el frontend.
