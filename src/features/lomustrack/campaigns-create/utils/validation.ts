/**
 * Utilitários de validação para criação de campanhas Meta Ads.
 * Garante conformidade com requisitos da Meta Marketing API.
 */

// Limites de caracteres da Meta Ads API
export const TEXT_LIMITS = {
  primary_text_feed: 125,
  primary_text_stories: 90,
  headline: 40,
  description: 30,
  display_url: 255,
  ad_name: 255,
  campaign_name: 255,
  adset_name: 255,
};

// Dimensões e tamanhos permitidos de mídia
export const MEDIA_LIMITS = {
  image: {
    maxSizeMB: 30,
    minWidth: 400,
    minHeight: 400,
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
    formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
  video: {
    maxSizeMB: 4096, // 4GB
    minDurationSec: 1,
    maxDurationSec: 14400, // 4 hours
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
    formats: ["mp4", "mov", "avi", "mkv", "webm"],
  },
};

/**
 * Valida e sanitiza parâmetros UTM.
 * Remove caracteres inválidos e garante formato correto.
 */
export function validateAndSanitizeUTM(params: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!params || params.trim() === "") {
    return { valid: true, sanitized: "" };
  }

  try {
    // Remove ? e & iniciais
    let clean = params.trim().replace(/^[?&]+/, "");

    // Tenta parsear como URLSearchParams
    const sp = new URLSearchParams(clean);

    // Valida que tem pelo menos um parâmetro
    if (Array.from(sp.keys()).length === 0) {
      return { valid: false, sanitized: "", error: "Nenhum parâmetro válido encontrado" };
    }

    // Reconstruir para garantir formato correto
    const sanitized = sp.toString();

    return { valid: true, sanitized };
  } catch (error) {
    return {
      valid: false,
      sanitized: "",
      error: error instanceof Error ? error.message : "Formato inválido",
    };
  }
}

/**
 * Valida URL de destino.
 * Deve ser HTTPS e ter formato válido.
 */
export function validateURL(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || url.trim() === "") {
    return { valid: false, error: "URL é obrigatória" };
  }

  try {
    const parsed = new URL(url);

    // Meta Ads exige HTTPS
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL deve usar HTTPS" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "URL inválida" };
  }
}

/**
 * Valida comprimento de texto com limite específico.
 */
export function validateTextLength(
  text: string,
  limit: number,
  fieldName: string = "Campo"
): {
  valid: boolean;
  length: number;
  error?: string;
} {
  const length = text.trim().length;

  if (length === 0) {
    return { valid: false, length, error: `${fieldName} é obrigatório` };
  }

  if (length > limit) {
    return { valid: false, length, error: `${fieldName} excede ${limit} caracteres` };
  }

  return { valid: true, length };
}

/**
 * Valida arquivo de mídia (tamanho e formato).
 */
export function validateMediaFile(
  file: File,
  type: "image" | "video"
): {
  valid: boolean;
  error?: string;
  warnings?: string[];
} {
  const limits = MEDIA_LIMITS[type];
  const warnings: string[] = [];

  // Validar tamanho
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > limits.maxSizeMB) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${limits.maxSizeMB}MB, atual: ${sizeMB.toFixed(1)}MB`,
    };
  }

  // Validar formato
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!limits.formats.includes(ext)) {
    return {
      valid: false,
      error: `Formato não suportado. Use: ${limits.formats.join(", ")}`,
    };
  }

  // Avisos (não bloqueiam, mas alertam)
  if (type === "image" && sizeMB < 1) {
    warnings.push("Imagem pequena pode ter qualidade reduzida");
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Valida dimensões de imagem.
 * Requer objeto Image carregado.
 */
export function validateImageDimensions(
  width: number,
  height: number
): {
  valid: boolean;
  error?: string;
  warnings?: string[];
} {
  const { minWidth, minHeight, recommendedWidth, recommendedHeight } = MEDIA_LIMITS.image;
  const warnings: string[] = [];

  // Mínimo absoluto
  if (width < minWidth || height < minHeight) {
    return {
      valid: false,
      error: `Dimensões muito pequenas. Mínimo: ${minWidth}x${minHeight}px`,
    };
  }

  // Recomendação
  if (width < recommendedWidth || height < recommendedHeight) {
    warnings.push(
      `Recomendado: ${recommendedWidth}x${recommendedHeight}px para melhor qualidade`
    );
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Calcula aspect ratio de dimensões.
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Valida orçamento diário (mínimo R$ 10).
 */
export function validateDailyBudget(budget: number): {
  valid: boolean;
  error?: string;
} {
  if (budget < 10) {
    return { valid: false, error: "Orçamento mínimo: R$ 10,00" };
  }

  if (budget > 1000000) {
    return { valid: false, error: "Orçamento máximo: R$ 1.000.000,00" };
  }

  return { valid: true };
}

/**
 * Valida bid amount baseado na estratégia.
 */
export function validateBidAmount(
  strategy: string,
  amount: number | null
): {
  valid: boolean;
  error?: string;
} {
  if (strategy === "BID_CAP" || strategy === "COST_CAP") {
    if (amount === null || amount <= 0) {
      return { valid: false, error: "Valor de lance é obrigatório para esta estratégia" };
    }

    if (amount < 1) {
      return { valid: false, error: "Valor mínimo: R$ 1,00" };
    }
  }

  if (strategy === "ROAS") {
    if (amount === null || amount <= 0) {
      return { valid: false, error: "ROAS mínimo é obrigatório para esta estratégia" };
    }

    if (amount < 1) {
      return { valid: false, error: "ROAS mínimo deve ser >= 1.0 (100%)" };
    }
  }

  return { valid: true };
}
