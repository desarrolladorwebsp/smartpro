import { getPrismaClient } from "../../db";

export type ApiRequestLogInput = {
  apiClientId: string | null;
  method: string;
  path: string;
  status: number;
  errorCode?: string;
  origin?: string | null;
  ip?: string | null;
  durationMs: number;
};

export function readClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

/// El registro es informativo: si falla, la respuesta al cliente no se altera.
export async function writeApiRequestLog(input: ApiRequestLogInput): Promise<void> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return;
  }

  try {
    await prisma.apiRequestLog.create({
      data: {
        apiClientId: input.apiClientId,
        method: input.method.toUpperCase(),
        path: input.path.slice(0, 2000),
        status: input.status,
        errorCode: input.errorCode ?? "",
        origin: input.origin ?? "",
        ip: input.ip ?? "",
        durationMs: Math.max(0, Math.round(input.durationMs)),
      },
    });
  } catch (error) {
    console.error("[smartpro:api:v1:log]", error);
  }
}
