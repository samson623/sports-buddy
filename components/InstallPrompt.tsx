"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault?.();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    try {
      const choice = await deferredPrompt.userChoice;
      // Hide after user choice
      setVisible(false);
      setDeferredPrompt(null);
    } catch {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6">
      <div className="mx-auto max-w-xl rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Install Sports Buddy</p>
            <p className="text-sm text-muted-foreground">Get the app experience on your device.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm rounded-md border hover:bg-accent"
              onClick={() => setVisible(false)}
            >
              Not now
            </button>
            <button
              className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
              onClick={onInstall}
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
