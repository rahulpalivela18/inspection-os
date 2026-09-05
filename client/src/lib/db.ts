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

// Step 3 of offline MVP: a generic GET-response cache. Reads served from
// here when the network is down; writes still go to the server (queued in
// step 5). Per-resource mirror tables + the mutation queue arrive later.
class InspectionOSDB extends Dexie {
  apiCache!: EntityTable<ApiCacheEntry, "url">;
  offlineMeta!: EntityTable<OfflineMeta, "key">;

  constructor() {
    super("InspectionOSDB");
    this.version(1).stores({
      apiCache: "url",
      offlineMeta: "key",
    });
  }
}

export const db = new InspectionOSDB();
