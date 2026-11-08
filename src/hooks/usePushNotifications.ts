import { useEffect, useState } from "react";
import { toast } from "sonner";
import { convertAndFormatMZN } from "@/utils/format";
import { getCookie } from "@/lib/cookies";
import { isImportDemo } from "@/lib/import-demo";
import {
  NOTIFICATION_PREFERENCES_EVENT,
  readNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notificationPreferences";

const DEMO_SALES_NOTIFICATIONS_KEY = "sales_notifications_enabled";

function readDemoEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_SALES_NOTIFICATIONS_KEY) === "true";
  } catch {
    return false;
  }
}

function writeDemoEnabled(enabled: boolean) {
  try {
    if (enabled) {
      window.localStorage.setItem(DEMO_SALES_NOTIFICATIONS_KEY, "true");
    } else {
      window.localStorage.removeItem(DEMO_SALES_NOTIFICATIONS_KEY);
    }
  } catch {
    /* armazenamento indisponível */
  }
}

function showDemoNotification(title: string, body: string) {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }
  try {
    new Notification(title, { body });
    return true;
  } catch {
    return false;
  }
}

export function usePushNotifications() {
  const demo = isImportDemo();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [demoEnabled, setDemoEnabled] = useState(readDemoEnabled);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    if (demo) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setSubscription(sub);
          }
        })
        .catch((err) => {
          console.warn("Não foi possível verificar subscrição push:", err);
        });
    }
  }, [demo]);

  useEffect(() => {
    const refreshPreferences = () => setNotificationPreferences(readNotificationPreferences());
    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, refreshPreferences);
    window.addEventListener("storage", refreshPreferences);
    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, refreshPreferences);
      window.removeEventListener("storage", refreshPreferences);
    };
  }, []);

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    readNotificationPreferences,
  );

  const requestPermission = async () => {
    if (demo) {
      let granted = false;
      if ("Notification" in window && Notification.permission === "default") {
        try {
          granted = (await Notification.requestPermission()) === "granted";
          setPermission(granted ? "granted" : Notification.permission);
        } catch {
          granted = false;
        }
      } else if ("Notification" in window) {
        granted = Notification.permission === "granted";
      }

      writeDemoEnabled(true);
      setDemoEnabled(true);
      showDemoNotification(
        "Notificações de vendas ativadas",
        "Você será avisado aqui sempre que entrar uma nova venda.",
      );
      toast.success(
        granted
          ? "Notificações de vendas ativadas!"
          : "Notificações de vendas ativadas neste navegador. Para alertas do sistema, permita as notificações do site.",
      );
      return true;
    }

    if (!("Notification" in window)) {
      toast.error("Notificações não suportadas neste navegador");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker não suportado");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        const sub = await subscribeUser();
        if (sub) {
          toast.success("Notificações ativadas com sucesso!");
          return true;
        } else {
          toast.error("Permissão concedida, mas falha ao registrar dispositivo.");
          return false;
        }
      } else if (result === "denied") {
        toast.error("Permissão para notificações negada");
        return false;
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao ativar notificações");
      return false;
    }

    return false;
  };

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      const token = getCookie("access_token") || "";
      const publicKeyResponse = await fetch("/api/notifications/vapid-public-key", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!publicKeyResponse.ok) {
        throw new Error("VAPID public key indisponível no backend");
      }

      const { public_key } = await publicKeyResponse.json();
      const convertedVapidKey = urlBase64ToUint8Array(public_key);

      // Verificar se já existe uma subscrição
      let sub = await registration.pushManager.getSubscription();

      if (sub) {
        // Verificar se a subscrição existente no navegador usava a mesma chave VAPID
        let isMatchingVapid = false;
        if (sub.options && sub.options.applicationServerKey) {
          const currentKeyBytes = new Uint8Array(sub.options.applicationServerKey);
          isMatchingVapid =
            currentKeyBytes.length === convertedVapidKey.length &&
            currentKeyBytes.every((val, i) => val === convertedVapidKey[i]);
        }

        if (!isMatchingVapid) {
          console.warn("Subscrição existente usa chave VAPID antiga ou incompatível. Renovando...");
          await sub.unsubscribe().catch(() => {});
          sub = null;
        }
      }

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      setSubscription(sub);

      // Enviar subscrição para o backend
      await sendSubscriptionToBackend(sub);

      return sub;
    } catch (error) {
      console.error("Erro ao criar subscrição push:", error);
      throw error;
    }
  };

  const sendSubscriptionToBackend = async (sub: PushSubscription) => {
    const token = getCookie("access_token") || "";
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
          auth: arrayBufferToBase64(sub.getKey("auth")),
        },
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || `O servidor recusou a inscrição (${response.status})`);
    }
  };

  // Helper para converter VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Helper para converter ArrayBuffer para Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
    if (!buffer) return "";
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const unsubscribe = async () => {
    if (demo) {
      writeDemoEnabled(false);
      setDemoEnabled(false);
      toast.success("Notificações de vendas desativadas");
      return;
    }

    if (subscription) {
      try {
        const token = getCookie("access_token") || "";
        await fetch(
          `/api/notifications/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
          {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        await subscription.unsubscribe();
        setSubscription(null);
        toast.success("Notificações desativadas");
      } catch (error) {
        console.error("Erro ao cancelar subscrição:", error);
        toast.error("Erro ao desativar notificações");
      }
    }
  };

  // Simular notificação de venda (para teste)
  const testNotification = async () => {
    if (notificationPreferences.approvedSales === "hide") {
      toast.info("Vendas aprovadas estão desabilitadas nas configurações de notificações.");
      return;
    }

    const productLine = notificationPreferences.productName === "show" ? "\nProduto: Produto" : "";
    const productValueLine =
      notificationPreferences.saleValue === "show"
        ? `\nValor: ${convertAndFormatMZN(8.99, 2)}`
        : "";

    if (demo) {
      const shown = showDemoNotification(
        "Venda aprovada!",
        `${productValueLine}${productLine}`.trim(),
      );
      toast.success(
        shown
          ? "Notificação de teste enviada!"
          : "Notificação de teste exibida no app. Permita as notificações do site para receber alertas do sistema.",
      );
      return;
    }

    if (!("Notification" in window)) {
      toast.error("Este navegador não oferece suporte a notificações.");
      return;
    }

    const currentPermission = Notification.permission;
    if (currentPermission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    } else if (!subscription) {
      // The browser may already have granted permission while this app has no
      // server-side subscription (for example, after reinstalling or clearing data).
      try {
        const sub = await subscribeUser();
        if (!sub) throw new Error("Não foi possível registrar este dispositivo.");
      } catch (error) {
        console.error("Erro ao registrar dispositivo para teste:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao registrar dispositivo");
        return;
      }
    }

    try {
      const token = getCookie("access_token") || "";
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(data.message || "Notificação de teste enviada!");
      } else {
        toast.error(data.detail || "Erro ao enviar notificação de teste");
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar notificação");
    }
  };

  return {
    permission,
    subscription,
    isSubscribed: demo ? demoEnabled : !!subscription,
    isDemo: demo,
    requestPermission,
    unsubscribe,
    testNotification,
  };
}
