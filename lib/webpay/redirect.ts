const WEBPAY_HOSTS = new Set(["webpay3gint.transbank.cl", "webpay3g.transbank.cl"]);

export function isAllowedWebpayRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && WEBPAY_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
