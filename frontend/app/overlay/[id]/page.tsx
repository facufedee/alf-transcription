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

  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Combine the last final sentence with the active partial for a fluid 2-line display
  const lastFinal = finals.length > 0 ? finals[finals.length - 1].text : '';
  const activePartial = partial ? partial.text : '';

  // Get active text display
  const displayText = activePartial
    ? `${lastFinal ? lastFinal + ' ' : ''}${activePartial}`
    : lastFinal;

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

  return (
    <div className="fixed inset-0 flex flex-col justify-end p-8 bg-transparent pointer-events-none select-none">
      <div
        className={`mx-auto max-w-4xl w-full transition-opacity duration-500 ease-in-out ${
          visible && displayText ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-2xl bg-black/80 px-6 py-4 backdrop-blur-md shadow-2xl border border-white/10 text-center">
          <p
            className="text-2xl md:text-3xl font-semibold leading-relaxed tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
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
