'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useIngestStream } from '@/hooks/useIngestStream';
import { useStageCaptions } from '@/hooks/useStageCaptions';
import { Lang } from '@shared/events';

interface PageProps {
  params: { id: string };
}

export default function AdminStageControlPage({ params }: PageProps) {
  const { id: stageId } = params;

  const [sourceLang, setSourceLang] = useState<Lang>('en');
  const [inputMode, setInputMode] = useState<'mic' | 'file'>('mic');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isStreaming,
    isConnecting,
    vuLevel,
    error,
    chunksSent,
    durationSeconds,
    startStreaming,
    stopStreaming,
  } = useIngestStream(stageId);

  // Monitor live subtitles produced by Gemini Live on this stage
  const { finals, partial } = useStageCaptions(stageId, sourceLang);

  const handleToggleStream = async () => {
    if (isStreaming) {
      await stopStreaming();
    } else {
      await startStreaming(sourceLang, inputMode, selectedFile || undefined);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-[#140b07] text-[#f3e6dc] p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        {/* Top Header */}
        <header className="flex flex-col gap-4 border-b border-[#f3e6dc]/15 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-[#f3e6dc]/20 p-2 text-xs text-[#f3e6dc]/70 transition hover:border-[#f3e6dc]/50 hover:text-white"
              title="Volver al panel principal"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#f3e6dc]/60">
                  Control de Escenario
                </span>
                {isStreaming ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-950/80 border border-red-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    TRANSMITIENDO EN VIVO
                  </span>
                ) : (
                  <span className="rounded-full bg-[#f3e6dc]/5 border border-[#f3e6dc]/15 px-2 py-0.5 font-mono text-[10px] text-[#f3e6dc]/50">
                    LISTO PARA TRANSMITIR
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl uppercase font-mono">
                {stageId}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/watch/${stageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#f3e6dc]/20 bg-[#f3e6dc]/5 px-3 py-1.5 font-mono text-xs text-[#f3e6dc]/80 transition hover:bg-[#f3e6dc]/10 hover:text-white"
            >
              Ver como audiencia ↗
            </Link>
            <Link
              href={`/overlay/${stageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#f3e6dc]/20 bg-[#f3e6dc]/5 px-3 py-1.5 font-mono text-xs text-[#f3e6dc]/80 transition hover:bg-[#f3e6dc]/10 hover:text-white"
            >
              Overlay OBS ↗
            </Link>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Audio Source & Control Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/70 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-medium text-[#f3e6dc]">Configuración de Ingesta</h2>
              <p className="mt-1 text-xs text-[#f3e6dc]/60">
                El audio se procesa en el navegador a 16 kHz PCM16 mono y se envía autenticado con tu
                JWT de operador.
              </p>

              {/* Source Language */}
              <div className="mt-6">
                <label className="block font-mono text-xs uppercase tracking-wider text-[#f3e6dc]/70">
                  Idioma del audio entrante:
                </label>
                <div className="mt-2 flex gap-3">
                  <button
                    disabled={isStreaming}
                    onClick={() => setSourceLang('en')}
                    className={`flex-1 rounded-2xl border py-2.5 text-xs font-semibold transition ${
                      sourceLang === 'en'
                        ? 'border-[#f3e6dc] bg-[#f3e6dc] text-[#140b07]'
                        : 'border-[#f3e6dc]/20 bg-[#140b07]/50 text-[#f3e6dc]/60 hover:text-white'
                    } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Inglés (EN)
                  </button>
                  <button
                    disabled={isStreaming}
                    onClick={() => setSourceLang('es')}
                    className={`flex-1 rounded-2xl border py-2.5 text-xs font-semibold transition ${
                      sourceLang === 'es'
                        ? 'border-[#f3e6dc] bg-[#f3e6dc] text-[#140b07]'
                        : 'border-[#f3e6dc]/20 bg-[#140b07]/50 text-[#f3e6dc]/60 hover:text-white'
                    } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Español (ES)
                  </button>
                </div>
              </div>

              {/* Source Input Mode */}
              <div className="mt-6">
                <label className="block font-mono text-xs uppercase tracking-wider text-[#f3e6dc]/70">
                  Fuente de captura:
                </label>
                <div className="mt-2 flex gap-3">
                  <button
                    disabled={isStreaming}
                    onClick={() => setInputMode('mic')}
                    className={`flex-1 rounded-2xl border py-2.5 text-xs font-semibold transition ${
                      inputMode === 'mic'
                        ? 'border-[#f3e6dc]/80 bg-[#f3e6dc]/15 text-[#f3e6dc]'
                        : 'border-[#f3e6dc]/20 bg-[#140b07]/50 text-[#f3e6dc]/50 hover:text-white'
                    } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    🎙️ Micrófono en vivo
                  </button>
                  <button
                    disabled={isStreaming}
                    onClick={() => setInputMode('file')}
                    className={`flex-1 rounded-2xl border py-2.5 text-xs font-semibold transition ${
                      inputMode === 'file'
                        ? 'border-[#f3e6dc]/80 bg-[#f3e6dc]/15 text-[#f3e6dc]'
                        : 'border-[#f3e6dc]/20 bg-[#140b07]/50 text-[#f3e6dc]/50 hover:text-white'
                    } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    📁 Archivo de audio
                  </button>
                </div>
              </div>

              {/* File upload when mode is 'file' */}
              {inputMode === 'file' && (
                <div className="mt-4 rounded-2xl border border-dashed border-[#f3e6dc]/25 p-4 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.wav,.mp3"
                    disabled={isStreaming}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isStreaming}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-[#f3e6dc]/30 bg-[#f3e6dc]/10 px-4 py-1.5 text-xs font-medium text-[#f3e6dc] hover:bg-[#f3e6dc]/20"
                  >
                    {selectedFile ? 'Cambiar archivo' : 'Elegir archivo (WAV/MP3)'}
                  </button>
                  {selectedFile && (
                    <p className="mt-2 text-xs font-mono text-[#f3e6dc]/80 truncate">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {/* VU Meter */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-mono text-[#f3e6dc]/60">
                  <span>Vúmetro de Entrada:</span>
                  <span>{vuLevel}%</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#140b07] border border-[#f3e6dc]/15 p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-75 ease-out"
                    style={{
                      width: `${vuLevel}%`,
                      backgroundColor:
                        vuLevel > 80 ? '#ef4444' : vuLevel > 50 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
              </div>

              {/* Big Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  disabled={isConnecting || (inputMode === 'file' && !selectedFile && !isStreaming)}
                  onClick={handleToggleStream}
                  className={`w-full flex items-center justify-center gap-3 rounded-full py-4 text-sm font-semibold transition active:scale-[0.99] ${
                    isStreaming
                      ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                      : 'bg-[#f3e6dc] text-[#140b07] hover:bg-white shadow-[0_0_20px_rgba(243,230,220,0.2)]'
                  } ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isConnecting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#140b07] border-t-transparent" />
                      Conectando con el servidor...
                    </>
                  ) : isStreaming ? (
                    <>
                      <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
                      Detener Transmisión
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      Transmitir en Vivo al Escenario
                    </>
                  )}
                </button>
              </div>

              {/* Streaming Stats */}
              {isStreaming && (
                <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-[#f3e6dc]/10 text-center font-mono text-xs">
                  <div className="rounded-2xl bg-[#140b07]/60 p-3 border border-[#f3e6dc]/10">
                    <p className="text-[#f3e6dc]/50">TIEMPO AL AIRE</p>
                    <p className="mt-1 text-base font-semibold text-[#f3e6dc]">
                      {formatTime(durationSeconds)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#140b07]/60 p-3 border border-[#f3e6dc]/10">
                    <p className="text-[#f3e6dc]/50">CHUNKS ENVIADOS</p>
                    <p className="mt-1 text-base font-semibold text-[#f3e6dc]">{chunksSent}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Subtitle Monitor (What Gemini is transcribing right now) */}
          <div className="lg:col-span-6">
            <div className="flex h-full min-h-[420px] flex-col rounded-3xl border border-[#f3e6dc]/15 bg-[#1f120c]/70 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-[#f3e6dc]/10 pb-4">
                <div>
                  <h2 className="text-base font-medium text-[#f3e6dc]">Retorno en Tiempo Real</h2>
                  <p className="text-xs text-[#f3e6dc]/60">
                    Subtítulos generados por Gemini Live en este escenario.
                  </p>
                </div>
                <span className="font-mono text-xs uppercase px-2 py-1 rounded-md bg-[#140b07] text-[#f3e6dc]/60">
                  {sourceLang}
                </span>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto space-y-4 max-h-[480px] pr-2">
                {finals.length === 0 && !partial && (
                  <div className="flex h-full items-center justify-center text-center p-8 text-xs text-[#f3e6dc]/40 font-mono">
                    {isStreaming
                      ? 'Hablá por el micrófono o reproducí el audio para ver los subtítulos...'
                      : 'La transmisión está inactiva. Hacé click en "Transmitir en Vivo" para comenzar.'}
                  </div>
                )}

                {finals.map((c) => (
                  <p key={c.seq} className="text-sm text-[#f3e6dc] leading-relaxed">
                    <span className="font-mono text-[10px] text-[#f3e6dc]/40 mr-2">#{c.seq}</span>
                    {c.text}
                  </p>
                ))}

                {partial && (
                  <p className="text-sm text-[#f3e6dc]/70 italic animate-pulse">
                    <span className="font-mono text-[10px] text-[#f3e6dc]/40 mr-2">
                      #{partial.seq}
                    </span>
                    {partial.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
