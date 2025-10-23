"use client";

import { useEffect, useState } from "react";
import useOnlineStatus from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // Read persisted dismissal on mount
  useEffect(() => {
    try {
      if (localStorage.getItem("offlineBannerDismissed") === "1") {
        setDismissed(true);
      }
    } catch {}
  }, []);

  // When back online, clear dismissal flag so it can show next time truly offline
  useEffect(() => {
    if (online) {
      try {
        localStorage.removeItem("offlineBannerDismissed");
      } catch {}
    }
  }, [online]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("offlineBannerDismissed", "1");
    } catch {}
  };

  if (online || dismissed) return null;

  return (
    <div className="relative z-30" role="status" aria-live="polite">
      <div className="mx-auto max-w-5xl">
        <div className="m-2 rounded-md bg-yellow-100 text-yellow-900 border border-yellow-300 shadow px-4 py-2 flex items-center justify-between">
          <span className="text-sm">You&apos;re offline. Showing cached data.</span>
          <button
            className="ml-4 text-xs underline hover:opacity-80"
            onClick={handleDismiss}
            aria-label="Dismiss offline banner"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
