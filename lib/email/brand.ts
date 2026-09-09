import { getAppUrl } from "../app-url";

export const EMAIL_BRAND = {
  name: "SmartPro",
  signature: "Equipo SmartPro",
  logoPath: "/images/logo/logo-smartpro-01.png",
  logoWidth: 180,
  logoHeight: 54,
  colors: {
    navy: "#101024",
    violet: "#6D28D9",
    magenta: "#EC168C",
    white: "#FFFFFF",
    background: "#F8F7FC",
    surface: "#FFFFFF",
    ink: "#0B0B14",
    muted: "#6E6B7B",
    highlightBg: "#F3F0FA",
    border: "#E8E5EF",
  },
  fonts: 'Arial, Helvetica, sans-serif',
} as const;

export function normalizeAppUrl(appUrl = getAppUrl()): string {
  const base = appUrl.trim().replace(/\/$/, "");

  if (!base) {
    throw new Error("APP_URL no está definido.");
  }

  let parsed: URL;

  try {
    parsed = new URL(base);
  } catch {
    throw new Error("APP_URL no es una URL válida.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("APP_URL debe usar HTTP o HTTPS.");
  }

  return base;
}

export function getEmailLogoUrl(appUrl = getAppUrl()): string {
  return `${normalizeAppUrl(appUrl)}${EMAIL_BRAND.logoPath}`;
}

export function assertHttpUrl(url: string, label = "La URL"): string {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} no es válida.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} debe usar HTTP o HTTPS.`);
  }

  return url;
}
