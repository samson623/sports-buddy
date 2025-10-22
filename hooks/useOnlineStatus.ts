"use client";

import { useEffect, useRef, useState } from "react";

export default function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const checkingRef = useRef(false);

  useEffect(() => {
    const checkConnectivity = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: { "x-connectivity-check": "1" },
        });
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      } finally {
        clearTimeout(timeout);
        checkingRef.current = false;
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      void checkConnectivity();
    };
    const handleOffline = () => {
      setIsOnline(false);
      void checkConnectivity();
    };

    // Initial verification and periodic re-checks
    void checkConnectivity();
    const id = setInterval(checkConnectivity, 15000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(id);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
