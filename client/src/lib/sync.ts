import { db, type QueuedMutation } from "./db";
import { queryClient } from "./queryClient";

const MAX_ATTEMPTS = 5;
const TEMP_ID_RE = /(temp-[A-Za-z0-9_-]+|issue-\d+)/g;

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

function notifyQueueChanged() {
  window.dispatchEvent(new Event("offline-queue-changed"));
}

export async function getPendingCount(): Promise<number> {
  return db.mutationQueue.count().catch(() => 0);
}

export function subscribeQueueChanged(cb: () => void): () => void {
  window.addEventListener("offline-queue-changed", cb);
  return () => window.removeEventListener("offline-queue-changed", cb);
}

export async function enqueueMutation(
  method: string,
  url: string,
  body?: string,
): Promise<void> {
  await db.mutationQueue.add({
    method,
    url,
    body,
    createdAt: Date.now(),
    attempts: 0,
  });
  notifyQueueChanged();
}

function remap(
  text: string | undefined,
  idMap: Map<string, string>,
): string | undefined {
  if (!text) return text;
  let out = text;
  idMap.forEach((real, temp) => {
    out = out!.split(temp).join(real);
  });
  return out;
}

// Replay the outbox FIFO. Temp client IDs (issue-123…, temp-…) created
// offline are rewritten to real server IDs in later entries once the
// creating POST succeeds. Server rejections (4xx/5xx) are NOT queued —
// only network failures land here, so a replay failure means retryable.
export async function syncNow(): Promise<SyncResult> {
  const pending = await db.mutationQueue.orderBy("id").toArray();
  const idMap = new Map<string, string>();
  let synced = 0;
  let failed = 0;

  for (const m of pending) {
    const url = remap(m.url, idMap);
    const body = remap(m.body, idMap);
    try {
      const res = await fetch(url!, {
        method: m.method,
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Server rejected replay (${res.status})`);
      const data = await res.json().catch(() => null);
      // Map temp IDs seen in the original entry to the real created ID.
      const temps: string[] = [];
      for (const src of [m.url, m.body]) {
        if (!src) continue;
        TEMP_ID_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = TEMP_ID_RE.exec(src)) !== null) {
          if (temps.indexOf(match[0]) === -1) temps.push(match[0]);
        }
      }
      if (data && typeof data.id === "string") {
        for (const t of temps) if (!idMap.has(t)) idMap.set(t, data.id);
      }
      await db.mutationQueue.delete(m.id!);
      synced++;
    } catch (err: any) {
      const attempts = m.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await db.mutationQueue.delete(m.id!);
        failed++;
      } else {
        const update: QueuedMutation = {
          ...m,
          attempts,
          lastError: err?.message || "Replay failed",
        };
        await db.mutationQueue.put(update);
      }
    }
  }

  if (synced > 0) {
    // Server is now the truth — refetch everything visible.
    db.apiCache.clear().catch(() => {});
    queryClient.invalidateQueries();
  }
  notifyQueueChanged();

  const remaining = await getPendingCount();
  return { synced, failed, remaining };
}
