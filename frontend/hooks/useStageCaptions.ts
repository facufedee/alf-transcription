'use client';

import { useEffect, useState, useRef } from 'react';
import { getWatchSocket } from '@/lib/socket';
import { Caption, EVENTS, Lang, StageStatus } from '@shared/events';

interface UseStageCaptionsResult {
  finals: Caption[];
  partial: Caption | null;
  isLive: boolean;
  isConnected: boolean;
  clearHistory: () => void;
}

export function useStageCaptions(stageId: string, lang: Lang): UseStageCaptionsResult {
  const [finals, setFinals] = useState<Caption[]>([]);
  const [partial, setPartial] = useState<Caption | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Keep references to current stage and lang to ignore stale messages
  const stageRef = useRef(stageId);
  const langRef = useRef(lang);

  useEffect(() => {
    stageRef.current = stageId;
    langRef.current = lang;
  }, [stageId, lang]);

  useEffect(() => {
    if (!stageId || !lang) return;

    const socket = getWatchSocket();

    // Reset local captions when stage or language changes
    setFinals([]);
    setPartial(null);

    const onConnect = () => {
      setIsConnected(true);
      socket.emit(EVENTS.subscribe, { stageId, lang });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onCaption = (caption: Caption) => {
      if (caption.stageId !== stageRef.current || caption.lang !== langRef.current) {
        return;
      }

      if (caption.isFinal) {
        setFinals((prev) => {
          const index = prev.findIndex((c) => c.seq === caption.seq);
          if (index >= 0) {
            const next = [...prev];
            next[index] = caption;
            return next;
          }
          return [...prev, caption];
        });
        setPartial((currentPartial) =>
          currentPartial?.seq === caption.seq ? null : currentPartial
        );
      } else {
        setPartial(caption);
      }
    };

    const onStageStatus = (status: StageStatus) => {
      if (status.stageId === stageRef.current) {
        setIsLive(status.live);
      }
    };

    setIsConnected(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(EVENTS.caption, onCaption);
    socket.on(EVENTS.stageStatus, onStageStatus);

    // If socket is already connected, subscribe immediately
    if (socket.connected) {
      socket.emit(EVENTS.subscribe, { stageId, lang });
    }

    return () => {
      socket.emit(EVENTS.unsubscribe, { stageId, lang });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(EVENTS.caption, onCaption);
      socket.off(EVENTS.stageStatus, onStageStatus);
    };
  }, [stageId, lang]);

  const clearHistory = () => {
    setFinals([]);
    setPartial(null);
  };

  return { finals, partial, isLive, isConnected, clearHistory };
}
