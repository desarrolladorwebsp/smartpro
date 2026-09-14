import { CheckoutValidationError } from "../orders/checkout";
import { PaymentGatewayError, startMercadoPagoCheckout, startWebpayCheckout } from "../orders/start-payment";
import { getSaleByQuoteId } from "../sales/repository";
import { verifyQuoteAccessToken } from "./access";
import { buildQuoteCheckoutOrder, getQuotePaymentBlockReason } from "./checkout";
import { getQuoteById } from "./repository";
import type { QuoteRecord } from "./types";

export const QUOTE_ONLINE_PAYMENT_METHODS = ["webpay", "mercadopago"] as const;

export type QuoteOnlinePaymentMethod = (typeof QUOTE_ONLINE_PAYMENT_METHODS)[number];

export class QuotePaymentError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "QuotePaymentError";
    this.status = status;
  }
}

export function isQuoteOnlinePaymentMethod(value: unknown): value is QuoteOnlinePaymentMethod {
  return QUOTE_ONLINE_PAYMENT_METHODS.includes(value as QuoteOnlinePaymentMethod);
}

export async function getQuoteForAccessToken(token: string): Promise<QuoteRecord | null> {
  const quoteId = verifyQuoteAccessToken(token);
  if (!quoteId) {
    return null;
  }

  const quote = await getQuoteById(quoteId);
  if (!quote || quote.status === "REJECTED") {
    return null;
  }

  return quote;
}

export async function startQuoteOnlinePayment(token: string, method: QuoteOnlinePaymentMethod) {
  const quote = await getQuoteForAccessToken(token);

  if (!quote) {
    throw new QuotePaymentError("La cotización no está disponible.", 404);
  }

  let alreadySold = false;
  try {
    alreadySold = Boolean(await getSaleByQuoteId(quote.id));
  } catch {
    alreadySold = false;
  }

  const blocked = getQuotePaymentBlockReason(quote, alreadySold);
  if (blocked) {
    throw new QuotePaymentError(blocked, 409);
  }

  try {
    const checkout = { ...buildQuoteCheckoutOrder(quote), quoteId: quote.id };

    if (method === "webpay") {
      const result = await startWebpayCheckout(checkout);
      return {
        quoteId: quote.id,
        quoteNumber: quote.number,
        order: result.order,
        webpay: result.webpay,
      };
    }

    const result = await startMercadoPagoCheckout(checkout);
    return {
      quoteId: quote.id,
      quoteNumber: quote.number,
      order: result.order,
      mercadopago: result.mercadopago,
    };
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      throw new QuotePaymentError(error.message, 400);
    }

    if (error instanceof PaymentGatewayError) {
      throw new QuotePaymentError(error.message, 502);
    }

    throw error instanceof QuotePaymentError
      ? error
      : new QuotePaymentError("No se pudo iniciar el pago de la cotización.", 502);
  }
}
