export const SMARTPRO_WHATSAPP_NUMBER = "56949773707";

export const WHATSAPP_MESSAGES = {
  general: "Hola SmartPro, quiero recibir más información sobre sus servicios.",
  checkoutPayment:
    "Hola SmartPro, estoy intentando contratar un servicio desde la web y tuve un problema al realizar el pago. ¿Me pueden ayudar?",
} as const;

export function getWhatsAppUrl(message: string, extras?: { orderId?: string | null }) {
  const orderId = extras?.orderId?.trim();
  const text = orderId ? `${message} Mi número de orden es ${orderId}.` : message;

  return `https://wa.me/${SMARTPRO_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function getCheckoutPaymentWhatsAppUrl(orderId?: string | null) {
  return getWhatsAppUrl(WHATSAPP_MESSAGES.checkoutPayment, { orderId });
}
