/**
 * Opções de país e idioma para targeting do Facebook Ads.
 * Os codes são ISO 3166-1 alpha-2 para países.
 * Os locale keys vêm da Meta Marketing API (type=adlocale).
 */

export interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

export interface LocaleOption {
  value: number;
  label: string;
}

/** Lista completa de países com suporte no Facebook Ads */
export const COUNTRY_OPTIONS: CountryOption[] = [
  // Lusófonos primeiro
  { value: "BR", label: "Brasil",               flag: "🇧🇷" },
  { value: "PT", label: "Portugal",              flag: "🇵🇹" },
  { value: "AO", label: "Angola",                flag: "🇦🇴" },
  { value: "MZ", label: "Moçambique",            flag: "🇲🇿" },
  { value: "CV", label: "Cabo Verde",            flag: "🇨🇻" },
  { value: "GW", label: "Guiné-Bissau",          flag: "🇬🇼" },
  { value: "ST", label: "São Tomé e Príncipe",   flag: "🇸🇹" },
  { value: "TL", label: "Timor-Leste",           flag: "🇹🇱" },
  // América
  { value: "US", label: "Estados Unidos",        flag: "🇺🇸" },
  { value: "CA", label: "Canadá",                flag: "🇨🇦" },
  { value: "MX", label: "México",                flag: "🇲🇽" },
  { value: "AR", label: "Argentina",             flag: "🇦🇷" },
  { value: "CO", label: "Colômbia",              flag: "🇨🇴" },
  { value: "CL", label: "Chile",                 flag: "🇨🇱" },
  { value: "PE", label: "Peru",                  flag: "🇵🇪" },
  { value: "VE", label: "Venezuela",             flag: "🇻🇪" },
  { value: "EC", label: "Equador",               flag: "🇪🇨" },
  { value: "BO", label: "Bolívia",               flag: "🇧🇴" },
  { value: "PY", label: "Paraguai",              flag: "🇵🇾" },
  { value: "UY", label: "Uruguai",               flag: "🇺🇾" },
  { value: "CR", label: "Costa Rica",            flag: "🇨🇷" },
  { value: "PA", label: "Panamá",                flag: "🇵🇦" },
  { value: "DO", label: "Rep. Dominicana",       flag: "🇩🇴" },
  { value: "GT", label: "Guatemala",             flag: "🇬🇹" },
  { value: "HN", label: "Honduras",              flag: "🇭🇳" },
  { value: "SV", label: "El Salvador",           flag: "🇸🇻" },
  { value: "CU", label: "Cuba",                  flag: "🇨🇺" },
  // Europa
  { value: "ES", label: "Espanha",               flag: "🇪🇸" },
  { value: "FR", label: "França",                flag: "🇫🇷" },
  { value: "DE", label: "Alemanha",              flag: "🇩🇪" },
  { value: "IT", label: "Itália",                flag: "🇮🇹" },
  { value: "GB", label: "Reino Unido",           flag: "🇬🇧" },
  { value: "NL", label: "Países Baixos",         flag: "🇳🇱" },
  { value: "BE", label: "Bélgica",               flag: "🇧🇪" },
  { value: "CH", label: "Suíça",                 flag: "🇨🇭" },
  { value: "AT", label: "Áustria",               flag: "🇦🇹" },
  { value: "SE", label: "Suécia",                flag: "🇸🇪" },
  { value: "NO", label: "Noruega",               flag: "🇳🇴" },
  { value: "DK", label: "Dinamarca",             flag: "🇩🇰" },
  { value: "FI", label: "Finlândia",             flag: "🇫🇮" },
  { value: "PL", label: "Polónia",               flag: "🇵🇱" },
  { value: "RO", label: "Roménia",               flag: "🇷🇴" },
  { value: "CZ", label: "República Checa",       flag: "🇨🇿" },
  { value: "HU", label: "Hungria",               flag: "🇭🇺" },
  { value: "GR", label: "Grécia",                flag: "🇬🇷" },
  { value: "IE", label: "Irlanda",               flag: "🇮🇪" },
  // África
  { value: "ZA", label: "África do Sul",         flag: "🇿🇦" },
  { value: "NG", label: "Nigéria",               flag: "🇳🇬" },
  { value: "KE", label: "Quénia",                flag: "🇰🇪" },
  { value: "GH", label: "Gana",                  flag: "🇬🇭" },
  { value: "EG", label: "Egito",                 flag: "🇪🇬" },
  { value: "MA", label: "Marrocos",              flag: "🇲🇦" },
  { value: "TN", label: "Tunísia",               flag: "🇹🇳" },
  { value: "CM", label: "Camarões",              flag: "🇨🇲" },
  { value: "SN", label: "Senegal",               flag: "🇸🇳" },
  { value: "CI", label: "Costa do Marfim",       flag: "🇨🇮" },
  // Ásia / Médio Oriente
  { value: "IN", label: "Índia",                 flag: "🇮🇳" },
  { value: "CN", label: "China",                 flag: "🇨🇳" },
  { value: "JP", label: "Japão",                 flag: "🇯🇵" },
  { value: "KR", label: "Coreia do Sul",         flag: "🇰🇷" },
  { value: "ID", label: "Indonésia",             flag: "🇮🇩" },
  { value: "PH", label: "Filipinas",             flag: "🇵🇭" },
  { value: "TH", label: "Tailândia",             flag: "🇹🇭" },
  { value: "MY", label: "Malásia",               flag: "🇲🇾" },
  { value: "SG", label: "Singapura",             flag: "🇸🇬" },
  { value: "VN", label: "Vietname",              flag: "🇻🇳" },
  { value: "SA", label: "Arábia Saudita",        flag: "🇸🇦" },
  { value: "AE", label: "Emirados Árabes",       flag: "🇦🇪" },
  { value: "TR", label: "Turquia",               flag: "🇹🇷" },
  { value: "IL", label: "Israel",                flag: "🇮🇱" },
  // Oceânia
  { value: "AU", label: "Austrália",             flag: "🇦🇺" },
  { value: "NZ", label: "Nova Zelândia",         flag: "🇳🇿" },
  // Mundo inteiro (último)
  { value: "WORLDWIDE", label: "Mundo Inteiro",  flag: "🌍" },
];

/**
 * Locale keys da Meta Marketing API.
 * 0 = Todos os idiomas (não envia locales na API).
 */
export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 0,  label: "Todos os idiomas" },
  { value: 16, label: "Português" },
  { value: 6,  label: "Inglês" },
  { value: 23, label: "Espanhol" },
  { value: 1,  label: "Francês" },
  { value: 5,  label: "Alemão" },
  { value: 10, label: "Italiano" },
  { value: 28, label: "Árabe" },
  { value: 11, label: "Japonês" },
  { value: 44, label: "Coreano" },
  { value: 41, label: "Hindi" },
];

/** Valor padrão para país */
export const DEFAULT_COUNTRY = "BR";

/** Valor padrão para locales — todos os idiomas */
export const DEFAULT_LOCALES: number[] = [];

/** Retorna o label do país pelo value */
export function getCountryLabel(value: string): string {
  return COUNTRY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Retorna label para múltiplos países seleccionados */
export function getCountriesLabel(values: string[]): string {
  if (!values || values.length === 0) return "Selecionar países";
  if (values.includes("WORLDWIDE")) return "🌍 Mundo Inteiro";
  if (values.length === 1) {
    const opt = COUNTRY_OPTIONS.find((o) => o.value === values[0]);
    return opt ? `${opt.flag} ${opt.label}` : values[0];
  }
  return `${values.length} países selecionados`;
}

/** Retorna labels dos locales selecionados */
export function getLocaleLabels(locales: number[]): string {
  if (locales.length === 0) return "Todos os idiomas";
  return locales
    .map((v) => LOCALE_OPTIONS.find((o) => o.value === v)?.label ?? String(v))
    .join(", ");
}
