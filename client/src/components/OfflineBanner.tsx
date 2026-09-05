import { useCallback, useEffect, useState } from "react";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { subscribeOnlineStatus } from "@/lib/offline";
import {
  getPendingCount,
  subscribeQueueChanged,
  syncNow,
} from "@/lib/sync";
import { useToast } from "@/hooks/use-toast";

// Persistent connectivity + outbox state. Auto-syncs on reconnect;
// manual Sync covers flaky networks where the online event lies.
export function OfflineBanner() {
  const { toast } = useToast();
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(() => {
    getPendingCount().then(setPending);
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncNow();
      if (result.synced > 0 || result.failed > 0) {
        toast({
          title: "Sync complete",
          description:
            `${result.synced} change${result.synced === 1 ? "" : "s"} uploaded` +
            (result.failed > 0 ? `, ${result.failed} failed after retries` : "") +
            (result.remaining > 0 ? `, ${result.remaining} still pending` : ""),
          variant: result.failed > 0 ? "destructive" : "default",
        });
      }
    } finally {
      setSyncing(false);
      refreshPending();
    }
  }, [toast, refreshPending]);

  useEffect(() => subscribeOnlineStatus(setOnline), []);
  useEffect(() => subscribeQueueChanged(refreshPending), [refreshPending]);
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  // Auto-sync when connectivity returns and work is waiting.
  useEffect(() => {
    if (online) {
      getPendingCount().then((n) => {
        if (n > 0) runSync();
      });
    }
  }, [online, runSync]);

  if (online && pending === 0) return null;
  return (
    <div
      data-testid="offline-banner"
      className="bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2 shrink-0"
    >
      {!online && <WifiOff className="h-3.5 w-3.5" />}
      {!online
        ? `You're offline — showing cached data${pending > 0 ? `, ${pending} change${pending === 1 ? "" : "s"} will sync` : ". Changes need connection"}.`
        : `${pending} offline change${pending === 1 ? "" : "s"} waiting to sync.`}
      {pending > 0 && (
        <button
          type="button"
          onClick={runSync}
          disabled={syncing || !online}
          className="ml-1 underline underline-offset-2 font-bold disabled:opacity-60 flex items-center gap-1"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      )}
    </div>
  );
}
