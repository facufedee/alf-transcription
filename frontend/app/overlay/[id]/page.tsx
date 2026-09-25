'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStageCaptions } from '@/hooks/useStageCaptions';
import { Lang } from '@shared/events';

interface PageProps {
  params: { id: string };
}

export default function OverlayPage({ params }: PageProps) {
  const { id: stageId } = params;
  const searchParams = useSearchParams();

  // Overlay defaults to 'en' (ideal for OBS recording and English judges), or ?lang=es
  const langParam = searchParams.get('lang');
  const currentLang: Lang = langParam === 'es' ? 'es' : 'en';

  const { finals, partial } = useStageCaptions(stageId, currentLang);

  const isMock = searchParams.get('mock') === 'true';

  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Combine the last final sentence with the active partial for a fluid 2-line display
  const lastFinal = finals.length > 0 ? finals[finals.length - 1].text : '';
  const activePartial = partial ? partial.text : '';

  // Get active text display
  const liveDisplayText = activePartial
    ? `${lastFinal ? lastFinal + ' ' : ''}${activePartial}`
    : lastFinal;

  const mockText =
    currentLang === 'es'
      ? 'La gran ventaja de procesar el audio con Gemini Live API es capturar la cadencia y glosario en tiempo real.'
      : 'The major advantage of Gemini Live API is capturing real-time cadence and technical terms instantly.';

  const displayText = liveDisplayText || (isMock ? mockText : '');

  // Auto-fadeout after 5 seconds of silence
  useEffect(() => {
    if (!displayText) return;

    setVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [finals, partial, displayText]);

  const isPreview = searchParams.get('preview') === 'true';

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-end p-8 pointer-events-none select-none ${
        isPreview
          ? 'bg-gradient-to-t from-black via-zinc-950/95 to-[#1a0e08]'
          : 'bg-transparent'
      }`}
    >
      {isPreview && (
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/80 px-3 py-1 font-mono text-xs text-red-300">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            OBS / vMix Preview Source · Sala: {stageId}
          </span>
          <span className="rounded-full border border-[#f3e6dc]/20 bg-black/50 px-3 py-1 font-mono text-xs text-[#f3e6dc]/70">
            Idioma: {currentLang.toUpperCase()}
          </span>
        </div>
      )}

      <div
        className={`mx-auto max-w-4xl w-full transition-opacity duration-500 ease-in-out ${
          visible && displayText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-2xl bg-black/85 px-8 py-5 backdrop-blur-md shadow-2xl border border-white/15 text-center">
          <p
            className="text-2xl md:text-3xl font-semibold leading-relaxed tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
            style={{
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {displayText}
          </p>
        </div>
      </div>
    </div>
  );
}
