import { api } from "./api";
import { db } from "./db";

export interface OfflinePackage {
  projectId: string;
  downloadedAt: number;
  dataRequests: number;
  imageCount: number;
  imageBytes: number;
  errors: number;
}

export interface PrefetchProgress {
  phase: "data" | "images" | "done";
  done: number;
  total: number;
}

const META_KEY = (projectId: string) => `offlinePackage:${projectId}`;

function imageCacheName(url: string): string {
  if (url.includes("/api/image-proxy")) return "proxy-images";
  if (url.includes("storage.googleapis.com")) return "gcp-images";
  return "local-images";
}

function isHttpUrl(u: unknown): u is string {
  return typeof u === "string" && /^https?:\/\//.test(u);
}

// Server may return same-origin proxy paths (/api/image-proxy?url=...).
// Those are fetchable images too — resolve to absolute for fetch + cache.
function isFetchableImageUrl(u: unknown): u is string {
  return isHttpUrl(u) || (typeof u === "string" && u.startsWith("/api/"));
}

function normalizeUrl(u: string): string {
  if (isHttpUrl(u)) return u;
  return new URL(u, window.location.origin).href;
}

// Progress-log photo fields are schemaless JSONB — could be string arrays,
// {url} objects, or keyed maps. Extract every http(s) string found inside.
function extractUrlsDeep(value: unknown, out: Set<string>) {
  if (isFetchableImageUrl(value)) {
    out.add(normalizeUrl(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) extractUrlsDeep(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>))
      extractUrlsDeep(v, out);
  }
}

export async function getOfflinePackage(
  projectId: string,
): Promise<OfflinePackage | null> {
  const row = await db.offlineMeta
    .get(META_KEY(projectId))
    .catch(() => undefined);
  return (row?.value as OfflinePackage) ?? null;
}

export async function clearOfflinePackage(projectId: string): Promise<void> {
  // Drops the package record; image bytes stay in the SW caches until their
  // normal 30-day expiry (shared cache, evicting per-project is unsafe).
  await db.offlineMeta.delete(META_KEY(projectId)).catch(() => {});
}

// Downloads everything one project needs for offline field work. Data
// requests go through api.* so they also populate the IndexedDB GET cache
// from step 3. Image bytes go into the same Cache Storage buckets the
// service worker serves (step 2), so <img> tags work offline untouched.
export async function downloadProjectForOffline(
  projectId: string,
  onProgress?: (p: PrefetchProgress) => void,
): Promise<OfflinePackage> {
  const imageUrls = new Set<string>();
  let dataRequests = 0;
  let errors = 0;

  // The previous package (if any) — used to refuse overwriting a good
  // download with an empty one when Update is tapped with no signal.
  const prev = await getOfflinePackage(projectId).catch(() => null);

  // Best-effort: one failing endpoint (e.g. members for non-admins) must
  // not abort the whole package.
  async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await fn();
      dataRequests++;
      return result;
    } catch {
      errors++;
      return null;
    }
  }

  const progress = (
    phase: PrefetchProgress["phase"],
    done: number,
    total: number,
  ) => onProgress?.({ phase, done, total });

  // ── Data phase ──
  progress("data", 0, 1);
  const [
    project,
    reports,
    captures,
    visits,
    tagValues,
    templates,
    team,
    amenities,
  ] = await Promise.all([
    safe(() => api.getProject(projectId)),
    safe(() => api.getReports(projectId)),
    safe(() => api.getCaptures(projectId)),
    safe(() => api.getVisits(projectId)),
    safe(() => api.getTagValues(projectId)),
    safe(() => api.getChecklistTemplates()),
    safe(() => api.getTeam()),
    safe(() => api.getDefaultAmenities()),
  ]);
  progress("data", 1, 1);
  void project;

  await safe(() => api.getCurrentVisit(projectId));
  await safe(() => api.getProjectMembers(projectId));
  // Share-links are online-only, but the project page queries them — cache
  // whatever exists so the page doesn't error offline.
  await safe(() => api.getShareLinks(projectId));

  // Full detail per report (normalized tables assembled server-side).
  if (reports) {
    for (const r of reports) {
      const full = await safe(() => api.getReport(r.id));
      if (full?.checklist) {
        for (const c of full.checklist)
          if (isFetchableImageUrl(c.image))
            imageUrls.add(normalizeUrl(c.image));
      }
      if (full?.issues) {
        for (const iss of full.issues) extractUrlsDeep(iss.images, imageUrls);
      }
      const logs = await safe(() => api.getProgressLogs(r.id));
      if (logs) {
        for (const log of logs) {
          extractUrlsDeep(log.afterPhotos, imageUrls);
          extractUrlsDeep(log.resolvedIssuePhotos, imageUrls);
        }
      }
    }
  }

  // Captures + hotspots (captures list already carries tags). Also seed the
  // per-capture detail URL — the viewer page requests it, never the list.
  if (captures) {
    for (const c of captures) {
      await seedCachedDetail(`/api/captures/${c.id}`, c);
      if (isFetchableImageUrl(c.imageUrl))
        imageUrls.add(normalizeUrl(c.imageUrl));
      if (isFetchableImageUrl(c.thumbnailUrl))
        imageUrls.add(normalizeUrl(c.thumbnailUrl));
      const hotspots = await safe(() => api.getHotspots(c.id));
      if (hotspots) {
        for (const h of hotspots) {
          if (isFetchableImageUrl(h.panoUrl))
            imageUrls.add(normalizeUrl(h.panoUrl));
          if (isFetchableImageUrl(h.thumbnailUrl))
            imageUrls.add(normalizeUrl(h.thumbnailUrl));
          if (isFetchableImageUrl(h.resolvedPhoto))
            imageUrls.add(normalizeUrl(h.resolvedPhoto));
        }
      }
    }
  }
  void visits;
  void tagValues;
  void templates;
  void team;
  void amenities;

  // ── Image phase ──
  const urls = Array.from(imageUrls);
  let imageBytes = 0;
  const canCache = typeof caches !== "undefined";
  for (let i = 0; i < urls.length; i++) {
    progress("images", i, urls.length);
    try {
      const res = await fetch(urls[i]);
      if (!res.ok) {
        errors++;
        continue;
      }
      const blob = await res.blob();
      imageBytes += blob.size;
      if (canCache) {
        const cache = await caches.open(imageCacheName(urls[i]));
        await cache.put(
          urls[i],
          new Response(blob, {
            headers: { "Content-Type": blob.type || "image/jpeg" },
          }),
        );
      }
    } catch {
      errors++;
    }
  }
  progress("images", urls.length, urls.length);

  // Never replace a good package with an empty one: no data at all means
  // no connection; zero photo bytes when we previously had photos means
  // the images were unreachable. The button surfaces this as a failure
  // toast and keeps the old package.
  if (dataRequests === 0) {
    throw new Error("No connection — offline package unchanged.");
  }
  if (prev && prev.imageCount > 0 && imageBytes === 0) {
    throw new Error("Photos unreachable — keeping previous download.");
  }

  const pkg: OfflinePackage = {
    projectId,
    downloadedAt: Date.now(),
    dataRequests,
    imageCount: urls.length,
    imageBytes,
    errors,
  };
  await db.offlineMeta
    .put({ key: META_KEY(projectId), value: pkg, updatedAt: Date.now() })
    .catch(() => {});
  progress("done", 1, 1);
  return pkg;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Seed/append the step-3 GET cache so offline-created rows are readable
// before the sync engine replays them (lists would otherwise refetch stale).
export async function seedCachedDetail(url: string, data: any): Promise<void> {
  await db.apiCache.put({ url, data, cachedAt: Date.now() }).catch(() => {});
}

export async function appendToCachedList(
  url: string,
  item: any,
): Promise<void> {
  const hit = await db.apiCache.get(url).catch(() => undefined);
  if (hit && Array.isArray(hit.data)) {
    await db.apiCache
      .put({ url, data: [...hit.data, item], cachedAt: Date.now() })
      .catch(() => {});
  }
}
