export const API_VERSION = "v1" as const;

export const API_SCOPES = [
  "catalog:read",
  "portfolio:read",
  "checkout:write",
  "orders:read",
  "sales:read",
  "sales:write",
  "leads:write",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/// Scopes que pueden usarse con la clave pública desde un navegador.
/// El resto exige clave secreta y firma HMAC desde un servidor.
export const PUBLISHABLE_SCOPES: readonly ApiScope[] = ["catalog:read", "portfolio:read"];

export const DEFAULT_SCOPES: readonly ApiScope[] = [
  "catalog:read",
  "portfolio:read",
  "checkout:write",
  "orders:read",
  "sales:read",
  "sales:write",
  "leads:write",
];

export const API_SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  "catalog:read": "Leer servicios, categorías y planes.",
  "portfolio:read": "Leer proyectos publicados del portafolio.",
  "checkout:write": "Iniciar pagos con Webpay o Mercado Pago.",
  "orders:read": "Consultar el estado de una sesión de pago.",
  "sales:read": "Consultar ventas registradas por esta aplicación.",
  "sales:write": "Registrar ventas cerradas fuera del pago en línea.",
  "leads:write": "Crear clientes potenciales en el CRM.",
};

export function isApiScope(value: unknown): value is ApiScope {
  return API_SCOPES.includes(value as ApiScope);
}

export function parseScopes(value: unknown): ApiScope[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isApiScope);
}

export function isPublishableScope(scope: ApiScope): boolean {
  return PUBLISHABLE_SCOPES.includes(scope);
}

export type ApiClientStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type ApiClientRecord = {
  id: string;
  name: string;
  slug: string;
  publicKey: string;
  secretPreview: string;
  status: ApiClientStatus;
  scopes: ApiScope[];
  allowedOrigins: string[];
  allowedReturnUrls: string[];
  /// Ids de `ServiceCategory` (lo que en la API pública se llama "servicio").
  /// Vacío significa acceso a todo el catálogo.
  allowedServiceIds: string[];
  webhookUrl: string;
  rateLimitPerMinute: number;
  contactEmail: string;
  notes: string;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/// Resultado de autenticar una petición: qué aplicación llama y con qué credencial.
export type ApiCredentialKind = "publishable" | "secret";

export type ApiAuthContext = {
  client: ApiClientRecord;
  credential: ApiCredentialKind;
  origin: string | null;
  requestId: string;
};

export type ApiListMeta = {
  count: number;
};

export type ApiSuccessEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    apiVersion: typeof API_VERSION;
  } & Partial<ApiListMeta>;
};

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    apiVersion: typeof API_VERSION;
  };
};
