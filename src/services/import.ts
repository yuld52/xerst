import { getCookie } from "@/lib/cookies";
import { isImportDemo } from "@/lib/import-demo";
import type {
  ImportPreviewResponse,
  ImportResultResponse,
  ProductConfig,
  ImportPlatform,
} from "@/types/import";

const API = import.meta.env.VITE_API_URL || "/api";

function authHeaders(): Record<string, string> {
  const token = getCookie("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Preview: envia arquivos e recebe resumo do que será importado.
 */
export async function previewImport(
  platform: ImportPlatform,
  files: { file?: File; fileVendas?: File; fileOrigem?: File },
): Promise<ImportPreviewResponse> {
  if (isImportDemo())
    throw new Error("Importação indisponível: o serviço original ainda não está conectado.");
  const form = new FormData();
  form.append("platform", platform);

  if (platform === "hotmart" && files.file) {
    form.append("file", files.file);
  }

  const res = await fetch(`${API}/import/preview`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro no preview" }));
    throw new Error(err.detail || "Erro no preview");
  }

  return res.json();
}

/**
 * Execute: envia arquivos + configuração dos produtos e importa tudo.
 */
export async function executeImport(
  platform: ImportPlatform,
  files: { file?: File; fileVendas?: File; fileOrigem?: File },
  productsConfig: ProductConfig[],
  webhookSlug?: string,
): Promise<ImportResultResponse> {
  if (isImportDemo())
    throw new Error("Importação indisponível: o serviço original ainda não está conectado.");
  const form = new FormData();
  form.append("platform", platform);
  form.append("products_config", JSON.stringify(productsConfig));
  if (webhookSlug) form.append("webhook_slug", webhookSlug);

  if (platform === "hotmart" && files.file) {
    form.append("file", files.file);
  }

  const res = await fetch(`${API}/import/execute`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erro na importação" }));
    throw new Error(err.detail || "Erro na importação");
  }

  return res.json();
}
