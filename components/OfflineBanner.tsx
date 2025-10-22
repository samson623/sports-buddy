"use client";

import { useState } from "react";
import useOnlineStatus from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  if (online || dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-5xl">
        <div className="m-2 rounded-md bg-yellow-100 text-yellow-900 border border-yellow-300 shadow px-4 py-2 flex items-center justify-between">
          <span className="text-sm">You're offline. Showing cached data.</span>
          <button
            className="ml-4 text-xs underline hover:opacity-80"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
