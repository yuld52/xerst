import { getCookie, removeCookie } from "@/lib/cookies";
import { getMockData } from "./mockInterceptor";
import { isImportDemo } from "@/lib/import-demo";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/** Evita múltiplos redirects simultâneos de 401 */
let isRedirecting = false;

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const isMock = isImportDemo();

  if (isMock) {
    if (options.method && options.method !== "GET") {
      throw new Error(
        "Alterações indisponíveis na demonstração. O serviço original ainda não está conectado.",
      );
    }
    try {
      const mockData = await getMockData(endpoint, options);
      if (mockData !== undefined) {
        return mockData as T;
      }
    } catch (e) {
      console.warn(`[Mock API] Error getting mock for ${endpoint}`, e);
    }
    throw new Error("Este recurso não está disponível na demonstração.");
  }

  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const token = getCookie("access_token");
  if (token) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      removeCookie("access_token");
      localStorage.removeItem("user");

      // Evitar loop infinito — só redireciona se não estiver já redirecionando
      // e se não estiver em /login ou /setup
      const currentPath = window.location.pathname;
      if (!isRedirecting && currentPath !== "/login" && currentPath !== "/setup") {
        isRedirecting = true;
        window.location.replace("/login");
      }

      throw new Error("Sessão expirada");
    }

    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    let errorMsg = "Request failed";

    if (typeof error?.detail === "string") {
      errorMsg = error.detail;
    } else if (Array.isArray(error?.detail)) {
      errorMsg = error.detail
        .map((e: any) => e.msg || e.message || JSON.stringify(e))
        .join(", ");
    } else if (typeof error?.message === "string") {
      errorMsg = error.message;
    } else if (typeof error === "string") {
      errorMsg = error;
    }

    if (
      typeof errorMsg === "string" &&
      (errorMsg.includes("API access blocked") || errorMsg.includes("OAuthException"))
    ) {
      // Importação dinâmica para não quebrar ciclo ou dependemos de toast importado em cima
      import("sonner").then(({ toast }) => {
        toast.error("Acesso à API Bloqueado", {
          description:
            "Você precisa acessar o Business Manager (BM), ir em Apps e abrir o dashboard do app para resolver o erro, ou verificar se há restrições na sua conta de anúncios.",
          duration: 10000,
        });
      });
    }

    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiDownload(endpoint: string, filename: string): Promise<void> {
  if (isImportDemo()) throw new Error("Exportações não estão disponíveis no modo de demonstração.");
  const token = getCookie("access_token");
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Falha ao exportar o arquivo" }));
    throw new Error(error.detail || "Falha ao exportar o arquivo");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
