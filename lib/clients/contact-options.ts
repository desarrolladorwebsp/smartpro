export const CLIENT_ORIGINS = ["Registro propio", "WhatsApp", "Web"] as const;
export const QUOTE_MOTIVES = ["Landing Page", "Marketing", "E-commerce", "Website"] as const;

export type ClientOrigin = (typeof CLIENT_ORIGINS)[number];
export type QuoteMotive = (typeof QUOTE_MOTIVES)[number];
