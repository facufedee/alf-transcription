'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '@/lib/config';
import { AudioCapture } from '@/lib/audio/capture';
import { FileStreamer } from '@/lib/audio/fileStreamer';
import { EVENTS, Lang, NAMESPACES } from '@shared/events';

interface UseIngestStreamResult {
  isStreaming: boolean;
  isConnecting: boolean;
  vuLevel: number;
  error: string | null;
  chunksSent: number;
  durationSeconds: number;
  startStreaming: (sourceLang: Lang, mode: 'mic' | 'file', file?: File) => Promise<void>;
  stopStreaming: () => Promise<void>;
}

export function useIngestStream(stageId: string): UseIngestStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [vuLevel, setVuLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chunksSent, setChunksSent] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const micCaptureRef = useRef<AudioCapture | null>(null);
  const fileStreamerRef = useRef<FileStreamer | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopStreaming = useCallback(async () => {
    // 1. Stop audio capture / file streaming
    if (micCaptureRef.current) {
      micCaptureRef.current.stop();
      micCaptureRef.current = null;
    }
    if (fileStreamerRef.current) {
      fileStreamerRef.current.stop();
      fileStreamerRef.current = null;
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // 2. Notify backend
    if (socketRef.current) {
      try {
        await new Promise<void>((resolve) => {
          socketRef.current?.emit(EVENTS.stageStop, { stageId }, () => resolve());
          setTimeout(resolve, 500);
        });
      } catch {
        // Ignore stop error
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsStreaming(false);
    setIsConnecting(false);
    setVuLevel(0);
  }, [stageId]);

  const startStreaming = useCallback(
    async (sourceLang: Lang, mode: 'mic' | 'file', file?: File) => {
      setError(null);
      setIsConnecting(true);
      setChunksSent(0);
      setDurationSeconds(0);

      try {
        // 1. Get authenticated operator JWT
        const tokenRes = await fetch('/api/auth/token');
        if (!tokenRes.ok) {
          throw new Error('No se pudo obtener el token de operador. ¿Iniciaste sesión?');
        }
        const { token } = await tokenRes.json();

        // 2. Connect to backend /ingest namespace with JWT
        const socket = io(`${BACKEND_URL}${NAMESPACES.ingest}`, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: false,
        });
        socketRef.current = socket;

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Timeout conectando al backend de ingesta')), 8000);
          socket.once('connect', () => {
            clearTimeout(timer);
            resolve();
          });
          socket.once('connect_error', (err) => {
            clearTimeout(timer);
            reject(new Error(`Error de autenticación con el servidor: ${err.message}`));
          });
        });

        // 3. Start stage
        const ack = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
          socket.emit(EVENTS.stageStart, { stageId, sourceLang }, (res: { ok: boolean; error?: string }) => {
            resolve(res);
          });
        });

        if (!ack.ok) {
          throw new Error(ack.error || 'No se pudo iniciar la transmisión del escenario');
        }

        // 4. Start audio source
        const onChunk = (chunk: ArrayBuffer) => {
          if (socket.connected) {
            socket.emit(EVENTS.audioChunk, chunk);
            setChunksSent((prev) => prev + 1);
          }
        };

        if (mode === 'mic') {
          const mic = new AudioCapture({
            onChunk,
            onVolume: (lvl) => setVuLevel(lvl),
            onError: (err) => {
              setError(err.message);
              stopStreaming();
            },
          });
          micCaptureRef.current = mic;
          await mic.start();
        } else if (mode === 'file') {
          if (!file) throw new Error('No se seleccionó ningún archivo de audio');
          const streamer = new FileStreamer({
            onChunk,
            onVolume: (lvl) => setVuLevel(lvl),
            onProgress: () => {},
            onFinished: () => {
              stopStreaming();
            },
            onError: (err) => {
              setError(err.message);
              stopStreaming();
            },
          });
          fileStreamerRef.current = streamer;
          await streamer.start(file);
        }

        setIsStreaming(true);
        setIsConnecting(false);

        // Track duration
        durationTimerRef.current = setInterval(() => {
          setDurationSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        setIsConnecting(false);
        setIsStreaming(false);
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        await stopStreaming();
      }
    },
    [stageId, stopStreaming]
  );

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    isStreaming,
    isConnecting,
    vuLevel,
    error,
    chunksSent,
    durationSeconds,
    startStreaming,
    stopStreaming,
  };
}
