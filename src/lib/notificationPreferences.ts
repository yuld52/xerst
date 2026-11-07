export const NOTIFICATION_PREFERENCES_KEY = "lomustrack-notification-preferences-v3";
export const NOTIFICATION_PREFERENCES_EVENT = "lomustrack-notification-preferences-change";

export type Visibility = "show" | "hide";
export type NotificationTemplate = "profit" | "summary" | "creative";

export interface NotificationPreferences {
  pendingSales: Visibility;
  approvedSales: Visibility;
  saleValue: Visibility;
  productName: Visibility;
  campaignValue: Visibility;
  reportHours: Record<string, boolean>;
  template: NotificationTemplate;
  timezone: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pendingSales: "hide",
  approvedSales: "show",
  saleValue: "show",
  productName: "hide",
  campaignValue: "hide",
  reportHours: { "08:00": false, "12:00": false, "18:00": false, "23:00": false },
  template: "profit",
  timezone: "Africa/Maputo",
};

export function readNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFERENCES;

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_PREFERENCES_KEY) || "null",
    ) as Partial<NotificationPreferences> | null;

    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...saved,
      reportHours: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.reportHours,
        ...(saved?.reportHours || {}),
      },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function writeNotificationPreferences(preferences: NotificationPreferences) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, { detail: preferences }));
}
