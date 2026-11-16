export type AgencyIdentity = {
  id: string;
  brandName: string;
  legalName: string;
  rut: string;
  tagline: string;
  address: string;
  commune: string;
  postalCode: string;
  offices: string;
  phone: string;
  contactName: string;
  email: string;
  website: string;
  logoUrl: string;
  bankAccountHolder: string;
  bankRut: string;
  bankName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  bankEmail: string;
};

export type AgencyProfile = AgencyIdentity & { active: boolean };

export const SMARTPRO_AGENCY_ID = "smartpro";

export const DEFAULT_AGENCIES: AgencyProfile[] = [
  {
    id: SMARTPRO_AGENCY_ID, brandName: "SmartPro", legalName: "Empresa Comercial LyV SpA", rut: "78.206.607-2",
    tagline: "Agencia de marketing digital", address: "Santa Elena 941B", commune: "Santiago, Chile",
    postalCode: "7500000", offices: "Santa Elena 941 B, Santiago; Vicuña Mackenna 920, of. 726, Ñuñoa", phone: "+56 9 4977 3707", contactName: "", email: "contacto@smartpro.cl",
    website: "https://smartpro.cl", logoUrl: "/images/logo/logo-smartpro-full.png",
    bankAccountHolder: "Empresa Comercial LyV SpA", bankRut: "78.206.607-2", bankName: "Banco BCI",
    bankAccountType: "Cuenta Corriente en pesos", bankAccountNumber: "97610224", bankEmail: "contacto@smartpro.cl", active: true,
  },
  {
    id: "smartstudio", brandName: "SmartStudio", legalName: "Vilero Group SpA", rut: "78.411.673-5",
    tagline: "", address: "", commune: "", postalCode: "", offices: "", phone: "", contactName: "",
    email: "contacto@smartstudio.cl", website: "", logoUrl: "",
    bankAccountHolder: "Vilero Group SpA", bankRut: "78.411.673-5", bankName: "Bci",
    bankAccountType: "Cuenta corriente en pesos", bankAccountNumber: "77174361", bankEmail: "contacto@smartstudio.cl", active: true,
  },
];

export function isAgencyIdentity(value: unknown): value is AgencyIdentity {
  return Boolean(value && typeof value === "object" && "brandName" in value && "bankAccountHolder" in value);
}

export function parseAgencyIdentity(value: unknown, fallback: AgencyIdentity): AgencyIdentity {
  if (!isAgencyIdentity(value)) return fallback;
  return { ...fallback, ...value } as AgencyIdentity;
}

export function getSmartProFallback(): AgencyIdentity {
  return DEFAULT_AGENCIES[0]!;
}
