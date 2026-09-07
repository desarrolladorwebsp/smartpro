export function getAppUrl(): string {
  const url = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error("APP_URL no está definido.");
  }

  return url.replace(/\/$/, "");
}
