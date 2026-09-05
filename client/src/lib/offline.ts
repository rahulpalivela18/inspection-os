import { db } from "./db";

// Thrown when a request can't reach the network and there's nothing usable
// cached. Callers (mutations, auth) surface this as "you're offline".
export class OfflineError extends Error {
  readonly isOffline = true;
  constructor(url: string) {
    super(`You're offline — ${url} isn't available offline yet.`);
    this.name = "OfflineError";
  }
}

export function isOfflineError(err: unknown): err is OfflineError {
  return err instanceof OfflineError || (err as any)?.isOffline === true;
}

// Never cache these: auth responses carry session identity (leaking another
// user's cached auth on a shared iPad would be a security hole), and login
// must always hit the network.
function isCacheableUrl(url: string): boolean {
  return url.includes("/api/") && !url.includes("/api/auth");
}

function cachedResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Offline-Cache": "hit",
    },
  });
}

// Drop-in replacement for fetch() used by api.ts and the React Query
// default queryFn. Online behavior is unchanged; the response is cloned
// into IndexedDB for GETs. Offline (or a failed fetch while flaky):
// serve the cached GET, or throw OfflineError. Successful mutations bust
// the whole GET cache so the next read refetches fresh data.
export async function offlineFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const cacheable = method === "GET" && isCacheableUrl(url);

  if (!navigator.onLine) {
    if (cacheable) {
      const hit = await db.apiCache.get(url).catch(() => undefined);
      if (hit) return cachedResponse(hit.data);
    }
    throw new OfflineError(url);
  }

  try {
    const res = await fetch(url, init);
    if (res.ok && cacheable) {
      res
        .clone()
        .json()
        .then((data) => db.apiCache.put({ url, data, cachedAt: Date.now() }))
        .catch(() => {});
    }
    if (method !== "GET" && res.ok && url.includes("/api/")) {
      // Mutation succeeded — cached reads may now be stale.
      db.apiCache.clear().catch(() => {});
    }
    return res;
  } catch {
    if (cacheable) {
      const hit = await db.apiCache.get(url).catch(() => undefined);
      if (hit) return cachedResponse(hit.data);
    }
    throw new OfflineError(url);
  }
}

// Reactive online flag for banners / disabling offline-hostile actions.
export function subscribeOnlineStatus(
  cb: (online: boolean) => void,
): () => void {
  const onOnline = () => cb(true);
  const onOffline = () => cb(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
