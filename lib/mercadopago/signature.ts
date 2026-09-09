import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";

export { InvalidWebhookSignatureError };

export function validateMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): void {
  const dataId = input.dataId?.trim() ?? "";
  const normalizedDataId = /[a-z]/i.test(dataId) ? dataId.toLowerCase() : dataId;

  WebhookSignatureValidator.validate({
    xSignature: input.xSignature,
    xRequestId: input.xRequestId,
    dataId: normalizedDataId || null,
    secret: input.secret,
  });
}
