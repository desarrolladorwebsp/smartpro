export const CLIENT_ORIGINS = ["Registro propio", "WhatsApp", "Web"] as const;

export type ClientOrigin = (typeof CLIENT_ORIGINS)[number];
export type QuoteMotive = string;
