'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStageCaptions } from '@/hooks/useStageCaptions';
import { Lang } from '@shared/events';

interface PageProps {
  params: { id: string };
}

type FontSize = 'sm' | 'md' | 'lg' | 'xl';

const FONT_CLASSES: Record<FontSize, string> = {
  sm: 'text-lg md:text-xl leading-relaxed',
  md: 'text-2xl md:text-3xl leading-relaxed',
  lg: 'text-3xl md:text-4xl leading-relaxed font-medium',
  xl: 'text-4xl md:text-5xl leading-tight font-medium',
};

export default function WatchStagePage({ params }: PageProps) {
  const { id: stageId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current language from query param (?lang=es / ?lang=en) or default to 'es'
  const langParam = searchParams.get('lang');
  const currentLang: Lang = langParam === 'en' ? 'en' : 'es';

  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [userScrolledUp, setUserScrolledUp] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { finals, partial, isLive, isConnected } = useStageCaptions(stageId, currentLang);

  const isMock = searchParams.get('mock') === 'true';

  const mockFinals = [
    {
      seq: 1,
      text:
        currentLang === 'es'
          ? 'Bienvenidos a Nerdearla 2026 en el Escenario Principal.'
          : 'Welcome to Nerdearla 2026 on the Main Stage.',
      isFinal: true,
      timestamp: Date.now() - 25000,
    },
    {
      seq: 2,
      text:
        currentLang === 'es'
          ? 'Hoy vamos a profundizar en cómo escalar clusters de Kubernetes utilizando eBPF y observabilidad en tiempo real sin sobrecargar el control plane.'
          : "Today we're diving into scaling Kubernetes clusters using eBPF and real-time observability without overloading the control plane.",
      isFinal: true,
      timestamp: Date.now() - 12000,
    },
    {
      seq: 3,
      text:
        currentLang === 'es'
          ? 'La gran ventaja de procesar el audio con la Live API de Gemini es que logramos capturar la cadencia natural del orador y el glosario técnico con latencia predecible.'
          : "The major advantage of processing audio with the Gemini Live API is capturing the speaker's natural cadence and technical glossary with predictable latency.",
      isFinal: true,
      timestamp: Date.now() - 4000,
    },
  ];

  const mockPartial = isMock
    ? {
        seq: 4,
        text:
          currentLang === 'es'
            ? 'Analizando métricas de telemetría distribuida y rendimiento...'
            : 'Analyzing distributed telemetry metrics and performance...',
        isFinal: false,
        timestamp: Date.now(),
      }
    : null;

  const displayFinals = finals.length > 0 ? finals : isMock ? mockFinals : [];
  const displayPartial = partial || mockPartial;
  const displayLive = isLive || isMock;

  // Switch language handler
  const setLanguage = (newLang: Lang) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', newLang);
    router.replace(`/watch/${stageId}?${params.toString()}`);
  };

  // Detect user scroll to pause/resume auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // If user is more than 80px from bottom, consider them reading previous text
    if (distanceFromBottom > 80) {
      setUserScrolledUp(true);
      setAutoScroll(false);
    } else {
      setUserScrolledUp(false);
      setAutoScroll(true);
    }
  };

  // Scroll to bottom when new text arrives if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [finals, partial, autoScroll]);

  const scrollToBottom = () => {
    setAutoScroll(true);
    setUserScrolledUp(false);
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen flex-col bg-[#140b07] text-[#f3e6dc] overflow-hidden select-text">
      {/* Top Bar / Controls */}
      <header className="flex shrink-0 flex-wrap items-center justify-between border-b border-[#f3e6dc]/15 bg-[#1b0f0a]/90 px-4 py-3 backdrop-blur-md z-20 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/watch"
            className="rounded-full border border-[#f3e6dc]/20 p-2 text-xs text-[#f3e6dc]/70 transition hover:border-[#f3e6dc]/50 hover:text-white"
            title="Volver a la lista de salas"
          >
            ←
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-semibold tracking-wide uppercase sm:text-base">
                {stageId}
              </h1>

              {displayLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-950/80 border border-red-500/40 px-2.5 py-0.5 font-mono text-[10px] font-bold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  EN VIVO
                </span>
              ) : (
                <span className="rounded-full bg-[#f3e6dc]/5 border border-[#f3e6dc]/15 px-2.5 py-0.5 font-mono text-[10px] text-[#f3e6dc]/50">
                  EN ESPERA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar: Language + Font Size */}
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {/* Language Switcher */}
          <div className="flex rounded-full border border-[#f3e6dc]/20 bg-[#140b07] p-0.5">
            <button
              onClick={() => setLanguage('es')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                currentLang === 'es'
                  ? 'bg-[#f3e6dc] text-[#140b07]'
                  : 'text-[#f3e6dc]/60 hover:text-white'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                currentLang === 'en'
                  ? 'bg-[#f3e6dc] text-[#140b07]'
                  : 'text-[#f3e6dc]/60 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center rounded-full border border-[#f3e6dc]/20 bg-[#140b07] p-0.5">
            {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-mono uppercase transition ${
                  fontSize === size
                    ? 'bg-[#f3e6dc]/25 text-[#f3e6dc] font-bold'
                    : 'text-[#f3e6dc]/40 hover:text-white'
                }`}
                title={`Tamaño ${size.toUpperCase()}`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* OBS Overlay Link */}
          <Link
            href={`/overlay/${stageId}?lang=${currentLang}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir vista overlay para OBS / vMix"
            className="rounded-full border border-[#f3e6dc]/20 p-2 text-xs text-[#f3e6dc]/60 hover:text-white hover:border-[#f3e6dc]/50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Connection notification if offline */}
      {!isConnected && !isMock && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-200">
          Reconectando con el servidor en tiempo real...
        </div>
      )}

      {/* Main Subtitles Scrolling Container */}
      <main
        ref={containerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-6 py-10 md:px-16 lg:px-24"
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {displayFinals.length === 0 && !displayPartial && (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#f3e6dc]/40">
                {displayLive ? 'Esperando audio...' : 'Escenario en espera'}
              </span>
              <p className="mt-3 text-sm text-[#f3e6dc]/60 max-w-md">
                {displayLive
                  ? 'El audio está siendo procesado en vivo por Gemini. Los subtítulos aparecerán aquí en cuanto comience la voz.'
                  : 'Cuando el orador comience a hablar, los subtítulos y la traducción aparecerán automáticamente en tiempo real.'}
              </p>
            </div>
          )}

          {/* Finalized Captions */}
          {displayFinals.map((c) => (
            <p key={c.seq} className={`${FONT_CLASSES[fontSize]} text-[#f3e6dc] tracking-normal`}>
              {c.text}
            </p>
          ))}

          {/* In-progress Partial Caption */}
          {displayPartial && (
            <p
              className={`${FONT_CLASSES[fontSize]} text-[#f3e6dc]/65 italic animate-pulse transition-opacity duration-150`}
            >
              {displayPartial.text}
            </p>
          )}

          <div ref={endRef} className="h-6" />
        </div>

        {/* Floating "Scroll to bottom" button when user scrolls up */}
        {userScrolledUp && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[#f3e6dc] px-4 py-2 text-xs font-semibold text-[#140b07] shadow-2xl transition hover:bg-white active:scale-95"
          >
            <span>↓ Reanudar auto-scroll</span>
          </button>
        )}
      </main>
    </div>
  );
}
