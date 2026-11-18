import "server-only";

export function zoomCalendarConfig() {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  const host = process.env.ZOOM_HOST_EMAIL?.trim().toLowerCase();
  return accountId && clientId && clientSecret && host ? { accountId, clientId, clientSecret, host } : null;
}

export async function createZoomMeeting(
  config: NonNullable<ReturnType<typeof zoomCalendarConfig>>,
  input: { date: string; time: string; title: string; duration: number },
) {
  let token: string;
  try {
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: "Basic " + Buffer.from(config.clientId + ":" + config.clientSecret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "account_credentials", account_id: config.accountId }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.access_token !== "string") throw new Error("Zoom OAuth");
    token = data.access_token;
  } catch {
    return { status: "rejected", error: "Zoom no autorizó la conexión. Revisa las credenciales y la activación de la aplicación." } as const;
  }

  try {
    const response = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(config.host)}/meetings`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: 2,
        topic: input.title,
        start_time: input.date + "T" + input.time + ":00",
        timezone: "America/Santiago",
        duration: input.duration,
        settings: { use_pmi: false },
      }),
    });
    if (response.status >= 400 && response.status < 500 && response.status !== 408) {
      return { status: "rejected", error: "Zoom rechazó la reserva. Revisa el anfitrión y el permiso para crear reuniones." } as const;
    }
    if (!response.ok) return { status: "unknown" } as const;
    const data = await response.json();
    if (!/^\d+$/.test(String(data.id)) || typeof data.join_url !== "string") return { status: "unknown" } as const;
    const url = new URL(data.join_url);
    if (url.protocol !== "https:" || !(url.hostname === "zoom.us" || url.hostname.endsWith(".zoom.us"))) {
      return { status: "unknown" } as const;
    }
    return { status: "created", zoomId: String(data.id), joinUrl: url.toString() } as const;
  } catch {
    return { status: "unknown" } as const;
  }
}
