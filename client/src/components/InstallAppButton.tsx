import { useEffect, useState } from "react";
import { Download, Share, Plus, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!deferredPrompt && !isIOS())) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt().catch(() => {});
      const { outcome } = await deferredPrompt.userChoice.catch(() => ({
        outcome: "dismissed",
      }));
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    if (isIOS()) setIosHelpOpen(true);
  };

  const steps = [
    { icon: Share, text: "Tap the Share button in Safari's toolbar" },
    { icon: Plus, text: "Scroll down and tap \u201cAdd to Home Screen\u201d" },
    { icon: Check, text: "Tap \u201cAdd\u201d \u2014 the app installs like a native one" },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        className="shrink-0"
        title="Install app"
        aria-label="Install app"
      >
        <Download className="h-4 w-4" />
      </Button>

      <Sheet open={iosHelpOpen} onOpenChange={setIosHelpOpen}>
        <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Smartphone className="h-5 w-5" />
              </div>
              <SheetTitle>Install Inspection OS on your iPhone or iPad</SheetTitle>
            </div>
            <SheetDescription>
              Apple doesn&apos;t allow an install button, so it&apos;s a 3-tap
              shortcut instead:
            </SheetDescription>
          </SheetHeader>
          <ol className="space-y-4 py-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <step.icon className="h-4 w-4 text-primary" />
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </SheetContent>
      </Sheet>
    </>
  );
}
