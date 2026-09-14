import { MercadoPagoConfig, Preference, User } from "mercadopago";

import { createMercadoPagoClient, getMercadoPagoPublicKey, isPublicHttpsAppUrl } from "../lib/mercadopago/config";
import { getCheckoutRedirectUrl } from "../lib/mercadopago/preference";

async function main() {
  const publicKey = getMercadoPagoPublicKey();
  const client = createMercadoPagoClient();

  if (!(client instanceof MercadoPagoConfig)) {
    throw new Error("El SDK no devolvió MercadoPagoConfig.");
  }

  if (!publicKey.startsWith("APP_USR-") && !publicKey.startsWith("TEST-")) {
    throw new Error("MERCADOPAGO_PUBLIC_KEY no tiene el formato del panel de Mercado Pago.");
  }

  const user = await new User(client).get();

  if (!user.id) {
    throw new Error("El Access Token no devolvió un User ID.");
  }

  const preference = await new Preference(client).create({
    body: {
      items: [
        {
          id: "verify-cover",
          title: "Verificación SmartPro",
          quantity: 1,
          currency_id: "CLP",
          unit_price: 1000,
        },
      ],
      external_reference: `verify-${Date.now()}`,
      statement_descriptor: "SmartPro",
      back_urls: {
        success: "http://localhost:3000/api/mercadopago/return",
        pending: "http://localhost:3000/api/mercadopago/return",
        failure: "http://localhost:3000/api/mercadopago/return",
      },
    },
  });

  const checkoutUrl = getCheckoutRedirectUrl(preference);

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: user.id,
        siteId: user.site_id ?? null,
        publicKeyPrefix: publicKey.slice(0, 8),
        preferenceId: preference.id ?? null,
        checkoutHost: new URL(checkoutUrl).host,
        localCallbacks: !isPublicHttpsAppUrl("http://localhost:3000"),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
