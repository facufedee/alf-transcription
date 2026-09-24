'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWatchSocket } from '@/lib/socket';
import { BACKEND_URL } from '@/lib/config';
import { EVENTS, StageStatus } from '@shared/events';

interface Stage {
  id: string;
  name: string;
  sourceLang: 'en' | 'es';
  live: boolean;
}

export default function WatchListPage() {
  const [stages, setStages] = useState<Stage[]>([
    // Fallback defaults so UI renders even if backend isn't up
    { id: 'sala-1', name: 'Escenario Principal (Main Stage)', sourceLang: 'en', live: false },
    { id: 'sala-2', name: 'Escenario 2 (Workshop Room)', sourceLang: 'es', live: false },
  ]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    // 1. Fetch initial stage list from HTTP
    const fetchStages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/stages`);
        if (res.ok) {
          const data: Stage[] = await res.json();
          if (data.length > 0) {
            setStages(data);
          }
          setBackendError(false);
        } else {
          setBackendError(true);
        }
      } catch {
        setBackendError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStages();

    // 2. Listen to real-time status updates via Socket.IO
    const socket = getWatchSocket();

    const onStageStatus = (status: StageStatus) => {
      setStages((prev) =>
        prev.map((s) => (s.id === status.stageId ? { ...s, live: status.live } : s))
      );
    };

    socket.on(EVENTS.stageStatus, onStageStatus);

    return () => {
      socket.off(EVENTS.stageStatus, onStageStatus);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#140b07] text-[#f3e6dc] p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-[#f3e6dc]/15 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/70">
                ALF · Subtítulos en Vivo
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
              Salas y Escenarios
            </h1>
            <p className="mt-1 text-sm text-[#f3e6dc]/70">
              Elegí una sala para ver la transcripción y traducción en tiempo real.
            </p>
          </div>

          <Link
            href="/"
            className="self-start rounded-full border border-[#f3e6dc]/20 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#f3e6dc]/70 transition hover:border-[#f3e6dc]/50 hover:text-white sm:self-auto"
          >
            ← Volver al inicio
          </Link>
        </header>

        {backendError && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
            Conectando con el servidor en <code className="font-mono">{BACKEND_URL}</code>. Mostrando
            escenarios de prueba locales mientras se establece el enlace.
          </div>
        )}

        {/* Stage List Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col justify-between rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/70 p-6 backdrop-blur-sm transition hover:border-[#f3e6dc]/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#f3e6dc]/50 uppercase">
                    ID: {stage.id}
                  </span>

                  {stage.live ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/80 border border-red-500/40 px-3 py-1 font-mono text-xs font-medium text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      EN VIVO
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[#f3e6dc]/5 border border-[#f3e6dc]/10 px-3 py-1 font-mono text-xs text-[#f3e6dc]/50">
                      EN ESPERA
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-2xl font-medium text-[#f3e6dc]">{stage.name}</h2>
                <p className="mt-1 font-mono text-xs text-[#f3e6dc]/60">
                  Audio original: <span className="uppercase text-[#f3e6dc]/90 font-bold">{stage.sourceLang}</span>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#f3e6dc]/10">
                <p className="text-xs uppercase tracking-wider font-mono text-[#f3e6dc]/50 mb-3">
                  Ver subtítulos en:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    href={`/watch/${stage.id}?lang=es`}
                    className="flex-1 min-w-[130px] text-center rounded-full bg-[#f3e6dc] px-4 py-2.5 text-xs font-semibold text-[#140b07] transition hover:bg-white"
                  >
                    Español (ES) →
                  </Link>

                  <Link
                    href={`/watch/${stage.id}?lang=en`}
                    className="flex-1 min-w-[130px] text-center rounded-full border border-[#f3e6dc]/30 bg-[#f3e6dc]/5 px-4 py-2.5 text-xs font-medium text-[#f3e6dc] transition hover:bg-[#f3e6dc]/15 hover:border-[#f3e6dc]/60"
                  >
                    English (EN) →
                  </Link>

                  <Link
                    href={`/overlay/${stage.id}?lang=${stage.sourceLang === 'en' ? 'es' : 'en'}`}
                    title="Overlay transparente para OBS / vMix"
                    className="grid place-items-center rounded-full border border-[#f3e6dc]/20 p-2.5 text-xs text-[#f3e6dc]/60 transition hover:border-[#f3e6dc]/50 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
