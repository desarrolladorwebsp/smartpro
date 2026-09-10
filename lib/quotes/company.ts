export const SMARTPRO_COMPANY = {
  legalName: "Empresa Comercial LyV SpA",
  brandName: "SmartPro",
  tagline: "Agencia de marketing digital",
  address: "Santa Elena 941B",
  commune: "Santiago, Chile",
  postalCode: "7500000",
  phone: "+56 9 4977 3707",
  email: "contacto@smartpro.cl",
  website: "https://smartpro.cl",
  rut: "78.206.607-2",
} as const;

export const SMARTPRO_BANK = {
  accountHolder: "Empresa Comercial LyV SpA",
  rut: "78.206.607-2",
  bank: "Banco BCI",
  accountType: "Cuenta Corriente en pesos",
  accountNumber: "97610224",
  email: "contacto@smartpro.cl",
} as const;

export const SMARTPRO_OFFICES = ["Santa Elena 941B", "Vicuña Mackenna 920", "Santiago, Chile"] as const;

export const QUOTE_DEFAULT_VALIDITY_DAYS = 15;
export const QUOTE_DEFAULT_DELIVERY_DAYS = 15;
export const QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT = 50;
