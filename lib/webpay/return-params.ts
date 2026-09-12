export type WebpayReturnParams = {
  tokenWs: string;
  tbkToken: string;
  buyOrder: string;
  sessionId: string;
};

export type WebpayReturnKind = "commit" | "aborted" | "timeout" | "error";

export type ClassifiedWebpayReturn = {
  kind: WebpayReturnKind;
  token: string;
  buyOrder: string;
  sessionId: string;
};

function readParam(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseWebpayReturnParams(input: Record<string, unknown>): WebpayReturnParams {
  return {
    tokenWs: readParam(input.token_ws ?? input.tokenWs),
    tbkToken: readParam(input.TBK_TOKEN ?? input.tbkToken),
    buyOrder: readParam(input.TBK_ORDEN_COMPRA ?? input.buyOrder),
    sessionId: readParam(input.TBK_ID_SESION ?? input.sessionId),
  };
}

export function classifyWebpayReturn(params: WebpayReturnParams): ClassifiedWebpayReturn {
  if (params.tokenWs && !params.tbkToken) {
    return {
      kind: "commit",
      token: params.tokenWs,
      buyOrder: params.buyOrder,
      sessionId: params.sessionId,
    };
  }

  if (params.tbkToken && !params.tokenWs) {
    return {
      kind: "aborted",
      token: params.tbkToken,
      buyOrder: params.buyOrder,
      sessionId: params.sessionId,
    };
  }

  if (!params.tokenWs && !params.tbkToken && (params.buyOrder || params.sessionId)) {
    return {
      kind: "timeout",
      token: "",
      buyOrder: params.buyOrder,
      sessionId: params.sessionId,
    };
  }

  return {
    kind: "error",
    token: params.tokenWs || params.tbkToken,
    buyOrder: params.buyOrder,
    sessionId: params.sessionId,
  };
}

export async function readWebpayReturnParams(request: Request): Promise<WebpayReturnParams> {
  const url = new URL(request.url);
  const fromQuery = parseWebpayReturnParams({
    token_ws: url.searchParams.get("token_ws") ?? "",
    TBK_TOKEN: url.searchParams.get("TBK_TOKEN") ?? "",
    TBK_ORDEN_COMPRA: url.searchParams.get("TBK_ORDEN_COMPRA") ?? "",
    TBK_ID_SESION: url.searchParams.get("TBK_ID_SESION") ?? "",
  });

  if (request.method !== "POST") {
    return fromQuery;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("form") && !contentType.includes("urlencoded")) {
    return fromQuery;
  }

  const form = await request.formData();
  return parseWebpayReturnParams({
    token_ws: String(form.get("token_ws") ?? fromQuery.tokenWs),
    TBK_TOKEN: String(form.get("TBK_TOKEN") ?? fromQuery.tbkToken),
    TBK_ORDEN_COMPRA: String(form.get("TBK_ORDEN_COMPRA") ?? fromQuery.buyOrder),
    TBK_ID_SESION: String(form.get("TBK_ID_SESION") ?? fromQuery.sessionId),
  });
}
