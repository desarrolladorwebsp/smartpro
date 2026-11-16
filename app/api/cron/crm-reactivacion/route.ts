import { reactivatePausedCrmClients } from "@/lib/clients/crm-archive-repository";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  return Response.json({ reactivated: await reactivatePausedCrmClients() });
}
