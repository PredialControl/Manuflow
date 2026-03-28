"use client";

import { useEffect, useCallback } from "react";

const QUEUE_KEY = "manuflow_offline_queue";

export interface QueuedAction {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  description: string;
}

export function getQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueAction(action: Omit<QueuedAction, "id" | "timestamp">) {
  const queue = getQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.body),
      });
      if (!res.ok) {
        remaining.push(action);
      }
      // else: sucesso, não reenfileira
    } catch {
      remaining.push(action);
    }
  }

  saveQueue(remaining);
  return queue.length - remaining.length; // qtd sincronizados
}

export function useOfflineQueue() {
  const sync = useCallback(async () => {
    if (!navigator.onLine) return 0;
    return await flushQueue();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      const count = await flushQueue();
      if (count && count > 0) {
        console.log(`[ManuFlow] ${count} ação(ões) sincronizada(s) após reconexão`);
        // Dispara evento para o app recarregar os dados
        window.dispatchEvent(new CustomEvent("manuflow:synced", { detail: { count } }));
      }
    };

    window.addEventListener("online", handleOnline);
    // Tenta sincronizar ao montar também (pode ter ficado com fila do antes)
    if (navigator.onLine) flushQueue();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return {
    enqueue: enqueueAction,
    sync,
    getPendingCount: () => getQueue().length,
  };
}
