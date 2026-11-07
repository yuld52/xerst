import { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { fetchUserPreferences, updateUserPreferences } from "@/services/userPreferences";
import { getCookie } from "@/lib/cookies";
import { isImportDemo } from "@/lib/import-demo";

interface ValueDisplayContextType {
  showFull: boolean;
  toggle: () => void;
}

const ValueDisplayContext = createContext<ValueDisplayContextType>({
  showFull: false,
  toggle: () => {},
});

const STORAGE_KEY = "lp_show_full_values";

export function ValueDisplayProvider({ children }: { children: ReactNode }) {
  const [showFull, setShowFull] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!getCookie("access_token") || isImportDemo()) return;
    fetchUserPreferences().then((preferences) => {
      if (typeof preferences.showFullValues === "boolean") {
        setShowFull(preferences.showFullValues);
        localStorage.setItem(STORAGE_KEY, String(preferences.showFullValues));
      }
    }).catch(() => undefined);
  }, []);

  const toggle = () => {
    setShowFull((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage indisponível (modo privado ou cota excedida) — ignora
      }
      if (getCookie("access_token") && !isImportDemo()) {
        void updateUserPreferences({ showFullValues: next }).catch(() => undefined);
      }
      return next;
    });
  };

  return (
    <ValueDisplayContext.Provider value={{ showFull, toggle }}>
      {children}
    </ValueDisplayContext.Provider>
  );
}

export function useValueDisplay() {
  return useContext(ValueDisplayContext);
}
