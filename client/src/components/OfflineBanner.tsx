import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { subscribeOnlineStatus } from "@/lib/offline";

// Thin persistent banner so offline state is always visible (and testable).
// Full pending-mutation counts arrive with the sync engine in step 5.
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => subscribeOnlineStatus(setOnline), []);

  if (online) return null;
  return (
    <div
      data-testid="offline-banner"
      className="bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2 shrink-0"
    >
      <WifiOff className="h-3.5 w-3.5" />
      You're offline — showing cached data. Changes need connection.
    </div>
  );
}
