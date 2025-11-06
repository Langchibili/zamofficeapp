// NotificationGate.tsx
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function NotificationGate() {
  const askedRef = useRef(false);
  useEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const stored = localStorage.getItem("notificationsPrompted");
    if (Notification.permission === "granted" || stored === "yes") return;
    const id = toast("Enable notifications?", {
      description: "Allow to receive updates about your print jobs.",
      action: {
        label: "Allow",
        onClick: async () => {
          try {
            const perm = await Notification.requestPermission();
            if (perm === "granted") {
              toast.success("Notifications enabled");
              try {
                new Notification("Thanks!", {
                  body: "We'll keep you updated.",
                });
              } catch {}
            } else {
              toast("You can enable later in browser settings");
            }
          } finally {
            localStorage.setItem("notificationsPrompted", "yes");
          }
        },
      },
      cancel: {
        label: "Later",
        onClick: () => localStorage.setItem("notificationsPrompted", "yes"),
      },
    });
    return () => {
      try {
        toast.dismiss(id as any);
      } catch {}
    };
  }, []);
  return null;
}
