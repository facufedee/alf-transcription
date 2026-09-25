'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Screenshot {
  id: string;
  title: string;
  badge: string;
  desc: string;
  src: string;
  demoUrl: string;
  tags: string[];
}

const SCREENSHOTS: Screenshot[] = [
  {
    id: 'watch-es',
    title: 'Vista de Audiencia (Español)',
    badge: 'ACCESIBILIDAD EN TIEMPO REAL',
    desc: 'Subtítulos instantáneos y fluidos en español para cualquier asistente con su teléfono o laptop. Sin registro ni instalaciones.',
    src: '/screenshots/watch-live-es.png',
    demoUrl: '/watch/sala-1?lang=es&mock=true',
    tags: ['Cero Fricción', 'Auto-Scroll', 'Selector ES / EN', 'Tamaños SM a XL'],
  },
  {
    id: 'watch-en',
    title: 'Vista de Audiencia (English)',
    badge: 'MULTI-IDIOMA BIDIRECCIONAL',
    desc: 'Traducción y transcripción al inglés en tiempo real con segmentación inteligente y preservación de términos técnicos.',
    src: '/screenshots/watch-live-en.png',
    demoUrl: '/watch/sala-1?lang=en&mock=true',
    tags: ['Traducción Gemini Flash', 'Glosario Técnico', 'Mobile-First', 'Latencia ~5-10s'],
  },
  {
    id: 'admin-stage',
    title: 'Consola de Operador & Ingesta',
    badge: 'CONTROL ROOM DEL ESCENARIO',
    desc: 'Panel para el operador del escenario con vúmetro activo, métricas de chunks de audio y monitor en directo de Gemini Live.',
    src: '/screenshots/admin-stage-control.png',
    demoUrl: '/admin/stage/sala-1?mock=true',
    tags: ['16 kHz PCM16 Mono', 'Vúmetro Reactivo', 'Micrófono o Archivo', 'Google OAuth JWT'],
  },
  {
    id: 'overlay',
    title: 'Overlay Transparente para OBS & vMix',
    badge: 'TRANSMISIÓN Y BROADCAST',
    desc: 'Capa gráfica con fondo transparente para agregar como Browser Source en OBS Studio o vMix. Ideal para streaming oficial.',
    src: '/screenshots/overlay-live.png',
    demoUrl: '/overlay/sala-1?lang=es&mock=true&preview=true',
    tags: ['Browser Source OBS', 'Fondo Alfa 100%', 'Auto-Fadeout', 'Estilo Lower-Third'],
  },
  {
    id: 'admin-dash',
    title: 'Panel Multi-Escenario',
    badge: 'ESCALABILIDAD NERDEARLA',
    desc: 'Gestión centralizada de múltiples escenarios simultáneos (Main Stage, Workshops, Comunidad) con pipelines aislados.',
    src: '/screenshots/admin-dashboard.png',
    demoUrl: '/admin?mock=true',
    tags: ['Escenarios Paralelos', 'StageManager Aislado', 'Monitoreo Global', 'Cloud Run Ready'],
  },
  {
    id: 'watch-list',
    title: 'Selector de Salas Público',
    badge: 'PORTAL DE ASISTENTES',
    desc: 'Listado público donde los asistentes a la conferencia eligen qué charla presenciar con indicadores de transmisión en vivo.',
    src: '/screenshots/watch-list.png',
    demoUrl: '/watch',
    tags: ['Enlace Directo', 'Estado En Vivo', 'Deep Linking', 'Ligero y Rápido'],
  },
];

export default function HowItWorksShowcase() {
  const [activeTab, setActiveTab] = useState<string>('watch-es');
  const [modalImage, setModalImage] = useState<Screenshot | null>(null);

  const currentItem = SCREENSHOTS.find((s) => s.id === activeTab) || SCREENSHOTS[0];

  return (
    <section id="como-funciona" className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-[#f3e6dc]">
      {/* Decorative Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-24 -translate-x-1/2 h-96 w-full max-w-4xl bg-[radial-gradient(ellipse_at_center,rgba(196,98,45,0.18),transparent_70%)]"
      />

      {/* Section Header */}
      <div className="text-center">
        <span className="inline-block rounded-full border border-[#f3e6dc]/20 bg-[#f3e6dc]/5 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/80">
          Arquitectura & Funcionamiento
        </span>
        <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-5xl">
          ¿Cómo funciona ALF?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[#f3e6dc]/75 md:text-lg">
          Una solución integral de subtitulado en tiempo real diseñada para conferencias multitudinarias,
          potenciada por la <strong>Live API de Gemini</strong> y <strong>Gemini Flash</strong>.
        </p>
      </div>

      {/* 4-Step Pipeline Cards */}
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Step 1 */}
        <div className="group relative rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/60 p-6 backdrop-blur-sm transition hover:border-[#f3e6dc]/35 hover:bg-[#1f120c]/90">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#f3e6dc]/50">PASO 01</span>
            <span className="rounded-full bg-orange-950/80 border border-orange-500/30 px-2 py-0.5 font-mono text-[10px] text-orange-300">
              Web Audio
            </span>
          </div>
          <h3 className="mt-4 text-lg font-medium text-[#f3e6dc]">Ingesta Multi-Pista</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#f3e6dc]/70">
            El operador transmite audio desde el micrófono, consola o archivo. El navegador remuestrea a{' '}
            <strong className="text-white">16 kHz PCM16 mono</strong> y lo transmite por WebSocket autenticado con JWT al namespace <code className="text-white">/ingest</code>.
          </p>
          <div className="mt-4 border-t border-[#f3e6dc]/10 pt-3 font-mono text-[11px] text-[#f3e6dc]/50">
            ⚡ Resampling en cliente · WebSockets
          </div>
        </div>

        {/* Step 2 */}
        <div className="group relative rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/60 p-6 backdrop-blur-sm transition hover:border-[#f3e6dc]/35 hover:bg-[#1f120c]/90">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#f3e6dc]/50">PASO 02</span>
            <span className="rounded-full bg-blue-950/80 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] text-blue-300">
              Gemini Live API
            </span>
          </div>
          <h3 className="mt-4 text-lg font-medium text-[#f3e6dc]">Transcripción Streaming</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#f3e6dc]/70">
            Conexión bidireccional streaming con <strong className="text-white">gemini-3.8-live</strong> vía el nuevo SDK <code className="text-white">@google/genai</code>. Transcribe la voz con detección de silencios y resiliencia de sesión automática.
          </p>
          <div className="mt-4 border-t border-[#f3e6dc]/10 pt-3 font-mono text-[11px] text-[#f3e6dc]/50">
            🎙️ Latencia ~5-10s · Tandas semánticas
          </div>
        </div>

        {/* Step 3 */}
        <div className="group relative rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/60 p-6 backdrop-blur-sm transition hover:border-[#f3e6dc]/35 hover:bg-[#1f120c]/90">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#f3e6dc]/50">PASO 03</span>
            <span className="rounded-full bg-purple-950/80 border border-purple-500/30 px-2 py-0.5 font-mono text-[10px] text-purple-300">
              Gemini Flash
            </span>
          </div>
          <h3 className="mt-4 text-lg font-medium text-[#f3e6dc]">Traducción & Glosario</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#f3e6dc]/70">
            Un segmentador de oraciones envía cada bloque a <strong className="text-white">gemini-3.5-flash-lite</strong> con un <strong className="text-white">glosario técnico inyectado</strong> (Kubernetes, eBPF, Cloud) para traducción EN↔ES de alta fidelidad.
          </p>
          <div className="mt-4 border-t border-[#f3e6dc]/10 pt-3 font-mono text-[11px] text-[#f3e6dc]/50">
            🌐 Sin alucinaciones en jerga tech
          </div>
        </div>

        {/* Step 4 */}
        <div className="group relative rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/60 p-6 backdrop-blur-sm transition hover:border-[#f3e6dc]/35 hover:bg-[#1f120c]/90">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-[#f3e6dc]/50">PASO 04</span>
            <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
              Pub/Sub Rooms
            </span>
          </div>
          <h3 className="mt-4 text-lg font-medium text-[#f3e6dc]">Distribución Dual</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#f3e6dc]/70">
            Socket.IO emite a salas <code className="text-white">stage:id:lang</code>. La audiencia lee en su navegador sin login, mientras OBS/vMix toma el <strong className="text-white">overlay transparente</strong> como Browser Source.
          </p>
          <div className="mt-4 border-t border-[#f3e6dc]/10 pt-3 font-mono text-[11px] text-[#f3e6dc]/50">
            📺 OBS Ready · Audiencia sin límites
          </div>
        </div>
      </div>

      {/* Visual Product Tour & Screenshots Showcase */}
      <div className="mt-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#f3e6dc]/15 pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/60">
              Capturas Reales del Sistema
            </span>
            <h3 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl">
              Showcase Interactivo para los Jueces
            </h3>
            <p className="mt-1 text-xs text-[#f3e6dc]/70">
              Explorá cada interfaz del sistema en funcionamiento real o abrí la demo en vivo.
            </p>
          </div>

          {/* Quick links to real live routes */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/watch/sala-1?lang=es&mock=true"
              target="_blank"
              className="rounded-full border border-[#f3e6dc]/25 bg-[#f3e6dc]/10 px-4 py-2 font-mono text-xs font-medium text-[#f3e6dc] hover:bg-[#f3e6dc]/20 transition"
            >
              Probar /watch ↗
            </Link>
            <Link
              href="/admin/stage/sala-1?mock=true"
              target="_blank"
              className="rounded-full border border-[#f3e6dc]/25 bg-[#f3e6dc]/10 px-4 py-2 font-mono text-xs font-medium text-[#f3e6dc] hover:bg-[#f3e6dc]/20 transition"
            >
              Consola Operador ↗
            </Link>
            <Link
              href="/overlay/sala-1?lang=es&mock=true&preview=true"
              target="_blank"
              className="rounded-full border border-[#f3e6dc]/25 bg-[#f3e6dc]/10 px-4 py-2 font-mono text-xs font-medium text-[#f3e6dc] hover:bg-[#f3e6dc]/20 transition"
            >
              Overlay OBS ↗
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {SCREENSHOTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                activeTab === s.id
                  ? 'bg-[#f3e6dc] text-[#140b07] shadow-lg font-semibold'
                  : 'bg-[#1f120c]/80 text-[#f3e6dc]/70 hover:text-white border border-[#f3e6dc]/15 hover:border-[#f3e6dc]/30'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Active Screenshot Display Stage */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-[#f3e6dc]/20 bg-[#1a0e09]/90 shadow-2xl backdrop-blur-md">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between border-b border-[#f3e6dc]/10 bg-[#140b07]/80 px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 font-mono text-xs text-[#f3e6dc]/50">{currentItem.title}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block rounded-full bg-[#f3e6dc]/10 px-2.5 py-0.5 font-mono text-[10px] text-[#f3e6dc]/70">
                {currentItem.badge}
              </span>
              <button
                onClick={() => setModalImage(currentItem)}
                className="font-mono text-xs text-[#f3e6dc]/60 hover:text-white transition"
                title="Ampliar captura"
              >
                🔍 Ampliar
              </button>
            </div>
          </div>

          {/* Screenshot Image Container */}
          <div className="relative aspect-[16/10] w-full bg-[#0d0705] cursor-pointer group" onClick={() => setModalImage(currentItem)}>
            <Image
              src={currentItem.src}
              alt={currentItem.title}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-top transition duration-300 group-hover:scale-[1.01]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 transition rounded-full bg-[#140b07]/90 border border-white/20 px-4 py-2 font-mono text-xs text-white shadow-xl backdrop-blur-sm">
                Click para ampliar pantalla completa
              </span>
            </div>
          </div>

          {/* Screenshot Description & Actions Footer */}
          <div className="flex flex-col gap-4 border-t border-[#f3e6dc]/10 p-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2 mb-2">
                {currentItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#f3e6dc]/15 bg-[#f3e6dc]/5 px-2.5 py-0.5 font-mono text-[10px] text-[#f3e6dc]/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[#f3e6dc]/80">{currentItem.desc}</p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={currentItem.demoUrl}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-full bg-[#f3e6dc] px-5 py-2.5 text-xs font-semibold text-[#140b07] transition hover:bg-white active:scale-95 shadow-lg"
              >
                <span>Abrir en vivo</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Grid of All Thumbnails for Instant Overview */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SCREENSHOTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                activeTab === s.id
                  ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-[#1f120c]'
                  : 'border-[#f3e6dc]/15 bg-[#140b07]/70 hover:border-[#f3e6dc]/30'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                <Image
                  src={s.src}
                  alt={s.title}
                  fill
                  sizes="200px"
                  className="object-cover object-top opacity-70 group-hover:opacity-100 transition"
                />
              </div>
              <div className="p-2.5">
                <p className="truncate font-mono text-[11px] font-medium text-[#f3e6dc]">
                  {s.title}
                </p>
                <p className="truncate text-[9px] text-[#f3e6dc]/50">{s.badge}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Judges Dossier / Criteria Breakdown */}
      <div className="mt-24 rounded-3xl border border-[#f3e6dc]/20 bg-[#1d100a]/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-[#f3e6dc]/15 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/70">
                Vibeathon 2026 · Panel Evaluador
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">
              Criterios de Evaluación & Decisiones Técnicas
            </h3>
            <p className="mt-1 text-xs text-[#f3e6dc]/70">
              Proyecto desarrollado por <strong className="text-white">Facundo Flores</strong> (Ingeniero en Sistemas —{' '}
              <a
                href="https://www.linkedin.com/in/floresfacundo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                LinkedIn
              </a>
              )
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 font-mono text-xs text-emerald-300">
            Open Source · Licencia MIT
          </span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Gemini Live */}
          <div className="rounded-2xl border border-[#f3e6dc]/10 bg-[#140b07]/70 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-base">Gemini Live API</h4>
              <span className="font-mono text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-500/30">
                Google DeepMind
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f3e6dc]/75">
              Utiliza el modelo <code className="text-white">gemini-3.8-live</code> mediante el nuevo SDK oficial{' '}
              <code className="text-white">@google/genai</code>. Diseñado con reconexión de sesión automática (session resumption) para transmisiones que exceden el límite de conexión.
            </p>
          </div>

          {/* Card 2: Latency Truth */}
          <div className="rounded-2xl border border-[#f3e6dc]/10 bg-[#140b07]/70 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-base">Latencia Honesta</h4>
              <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                ~5 a 10s Medido
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f3e6dc]/75">
              No entregamos palabras sueltas sin sentido: Gemini Live devuelve tandas semánticas completas cuando se cierra una frase. Esto garantiza que la traducción conserve concordancia gramatical y sentido técnico.
            </p>
          </div>

          {/* Card 3: Glossary Injection */}
          <div className="rounded-2xl border border-[#f3e6dc]/10 bg-[#140b07]/70 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-base">Glosario Técnico</h4>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Cero Alucinaciones
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f3e6dc]/75">
              Inyectamos en el system prompt listas de términos y tecnologías de la conferencia (ej. <em>Kubernetes, CI/CD, eBPF, OpenClaw, Ollama</em>) para que el modelo nunca castellanice términos que deben quedar en inglés técnico.
            </p>
          </div>

          {/* Card 4: Multi-stage Parallel */}
          <div className="rounded-2xl border border-[#f3e6dc]/10 bg-[#140b07]/70 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-base">Escalabilidad Multi-Sala</h4>
              <span className="font-mono text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                StageManager
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f3e6dc]/75">
              Cada escenario cuenta con su propio pipeline independiente y aislado. Si una sala experimenta jitter o reconexión, las otras continúan operando con total estabilidad. Desplegable en Cloud Run con WebSockets.
            </p>
          </div>

          {/* Card 5: OBS/vMix Integration */}
          <div className="rounded-2xl border border-[#f3e6dc]/10 bg-[#140b07]/70 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-base">OBS & vMix Broadcast</h4>
              <span className="font-mono text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                Ready para TV/Stream
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f3e6dc]/75">
              Páginas de overlay con fondo 100% transparente para incorporar a cualquier mixer de video como Browser Source. Auto-fadeout tras 5 segundos de silencio y sombra proyectada optimizada para legibilidad sobre video.
            </p>
          </div>

          {/* Card 6: Zero friction */}
          <div className="rounded-2xl border border-[#f3e6dc]/10 bg-[#140b07]/70 p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-base">Accesibilidad Total</h4>
              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Cero Barreras
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f3e6dc]/75">
              La audiencia nunca se loguea. Puede acceder desde cualquier QR impreso en la sala o link del streaming, cambiar el idioma entre ES y EN con un toque, y ajustar el tamaño de fuente según su distancia a la pantalla.
            </p>
          </div>
        </div>

        {/* Sample Audio Testing Guide for Judges */}
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-amber-300">
                ¿Cómo probar con los audios de Nerdearla incluidos?
              </span>
              <p className="mt-1 text-xs text-amber-200/80">
                El repositorio incluye archivos de audio reales de charlas de Nerdearla en la carpeta <code className="font-mono text-white">samples/</code> para evaluar transcripción en inglés y español.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/stage/sala-1?mock=true"
                className="rounded-full bg-amber-400 px-4 py-2 font-mono text-xs font-semibold text-black hover:bg-amber-300 transition"
              >
                Abrir Consola con Audio
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 font-mono text-[11px] text-[#f3e6dc]/70">
            <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
              <p className="text-white font-semibold">Dan&apos;l Lewin (EN)</p>
              <p className="text-[10px] text-amber-300/80 mt-0.5">samples/Kids can&apos;t wait!.mp3</p>
            </div>
            <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
              <p className="text-white font-semibold">Pablo Fredrikson (ES)</p>
              <p className="text-[10px] text-amber-300/80 mt-0.5">samples/Un mes con OpenClaw.mp3</p>
            </div>
            <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
              <p className="text-white font-semibold">Kubernetes TTS (EN)</p>
              <p className="text-[10px] text-amber-300/80 mt-0.5">samples/en-kubernetes-tts.wav</p>
            </div>
            <div className="rounded-xl bg-black/40 p-2.5 border border-white/5">
              <p className="text-white font-semibold">Postgres TTS (ES)</p>
              <p className="text-[10px] text-amber-300/80 mt-0.5">samples/es-postgres-tts.wav</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {modalImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-5xl w-full overflow-hidden rounded-3xl border border-white/20 bg-[#140b07] p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h4 className="font-medium text-white">{modalImage.title}</h4>
                <p className="text-xs text-[#f3e6dc]/60">{modalImage.badge}</p>
              </div>
              <button
                onClick={() => setModalImage(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-[16/10] w-full mt-2 rounded-2xl overflow-hidden">
              <Image
                src={modalImage.src}
                alt={modalImage.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
