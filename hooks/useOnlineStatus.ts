"use client";

import { useEffect, useState } from "react";

export default function useOnlineStatus(): boolean {
  // Initialize as true to avoid hydration mismatch
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    // Set mounted flag to prevent hydration mismatch
    setIsMounted(true);
    
    // Update state from actual navigator.onLine value
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't report offline status until component is mounted on client
  // This prevents false positives from hydration mismatches
  return isMounted ? isOnline : true;
}
