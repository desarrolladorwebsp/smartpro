export function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(String(value ?? "").trim());
  } catch {
    return null;
  }
}

/// Solo aceptamos HTTPS, salvo en desarrollo local, para que el comprador
/// nunca sea devuelto a un destino sin cifrar después de pagar.
export function isSafeReturnUrl(value: string): boolean {
  const url = parseUrl(value);

  if (!url) {
    return false;
  }

  if (url.protocol === "https:") {
    return true;
  }

  return url.protocol === "http:" && isLocalHost(url.hostname);
}

export function isReturnUrlAllowed(candidate: string, allowed: readonly string[]): boolean {
  const url = parseUrl(candidate);

  if (!url || !isSafeReturnUrl(candidate)) {
    return false;
  }

  return allowed.some((entry) => {
    const allowedUrl = parseUrl(entry);

    if (!allowedUrl) {
      return false;
    }

    if (allowedUrl.origin !== url.origin) {
      return false;
    }

    const base = allowedUrl.pathname.replace(/\/$/, "");

    if (!base || base === "") {
      return true;
    }

    return url.pathname === base || url.pathname.startsWith(`${base}/`);
  });
}

export function resolveReturnUrl(input: {
  requested?: string | null;
  allowed: readonly string[];
}): string | null {
  const requested = String(input.requested ?? "").trim();

  if (requested) {
    return isReturnUrlAllowed(requested, input.allowed) ? requested : null;
  }

  const fallback = input.allowed.find((entry) => isSafeReturnUrl(entry));
  return fallback ?? null;
}

export function appendCheckoutResult(
  returnUrl: string,
  params: { status: string; orderId?: string | null; externalReference?: string | null },
): string {
  const url = new URL(returnUrl);
  url.searchParams.set("status", params.status);

  if (params.orderId) {
    url.searchParams.set("orderId", params.orderId);
  }

  if (params.externalReference) {
    url.searchParams.set("reference", params.externalReference);
  }

  return url.toString();
}
