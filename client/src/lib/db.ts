import Dexie, { type EntityTable } from "dexie";

export interface ApiCacheEntry {
  /** Exact GET URL (primary key). */
  url: string;
  data: unknown;
  cachedAt: number;
}

export interface OfflineMeta {
  /** Singleton key, e.g. "offlinePackage:<projectId>". */
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface QueuedMutation {
  id?: number;
  method: string;
  url: string;
  /** Serialized JSON body (mutations always send JSON). */
  body?: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

// Step 3 of offline MVP: a generic GET-response cache. Reads served from
// here when the network is down; writes still go to the server (queued in
// step 5). Per-resource mirror tables + the mutation queue arrive later.
class InspectionOSDB extends Dexie {
  apiCache!: EntityTable<ApiCacheEntry, "url">;
  offlineMeta!: EntityTable<OfflineMeta, "key">;
  mutationQueue!: EntityTable<QueuedMutation, "id">;

  constructor() {
    super("InspectionOSDB");
    this.version(1).stores({
      apiCache: "url",
      offlineMeta: "key",
    });
    // Step 5: outbox of mutations made while offline, replayed FIFO.
    this.version(2).stores({
      apiCache: "url",
      offlineMeta: "key",
      mutationQueue: "++id",
    });
  }
}

export const db = new InspectionOSDB();
