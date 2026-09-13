import { slugify } from "./repository";
import type { CatalogSourceItem } from "./catalog-source";
import { getPlanInquiryHref } from "./map-to-plan";

const CATEGORY_NAME = "Desarrollo sistemas";
const CATEGORY_SLUG = slugify(CATEGORY_NAME);
const CATEGORY_ORDER = 7;
const CATEGORY_DESCRIPTION =
  "Sistemas a medida, CRM y APIs para digitalizar procesos y conectar tu operación.";

type SistemasPlanSeed = {
  subcategoryName: string;
  subcategoryOrder: number;
  planName: string;
  badge: string;
  summary: string;
  note: string;
  items: string[];
};

const SISTEMAS_PLANS: SistemasPlanSeed[] = [
  {
    subcategoryName: "Sistema a tu medida",
    subcategoryOrder: 0,
    planName: "Sistema a medida",
    badge: "A medida",
    summary: "Software propio para digitalizar procesos internos, no un producto genérico.",
    note: "Ideal para empresas que necesitan un sistema con sus reglas, roles y flujos reales.",
    items: [
      "Levantamiento de procesos y requerimientos",
      "Arquitectura web o panel interno a medida",
      "Roles, permisos y trazabilidad de usuarios",
      "Flujos operativos con estados y notificaciones",
      "Módulos de reportes y exportación de datos",
      "Panel de administración",
      "Capacitación de entrega y acompañamiento post go-live",
    ],
  },
  {
    subcategoryName: "CRM",
    subcategoryOrder: 1,
    planName: "CRM comercial",
    badge: "Comercial",
    summary: "CRM para ordenar clientes, oportunidades y el seguimiento del equipo comercial.",
    note: "Ideal para equipos que necesitan visibilidad de la cartera y de cada gestión.",
    items: [
      "Ficha de clientes, prospectos y empresas",
      "Pipeline de oportunidades por etapa",
      "Historial de gestiones, llamadas y seguimientos",
      "Asignación de ejecutivos y recordatorios",
      "Reportes de conversión y actividad comercial",
      "Campos y etapas adaptados a tu proceso de venta",
      "Integración con WhatsApp o correo, según el alcance",
    ],
  },
  {
    subcategoryName: "APIs",
    subcategoryOrder: 2,
    planName: "APIs e integraciones",
    badge: "Integraciones",
    summary: "APIs e integraciones para conectar tu operación con otros sistemas.",
    note: "Ideal para unir web, ERP, pasarelas, CRM u otras plataformas internas.",
    items: [
      "Diseño de endpoints REST según el caso de uso",
      "Autenticación y control de acceso",
      "Integración con sistemas existentes",
      "Webhooks y sincronización de datos",
      "Documentación de consumo para el equipo técnico",
      "Ambientes de prueba y producción",
      "Registro y monitoreo básico de errores",
    ],
  },
];

export function getSistemasCatalogSource(): CatalogSourceItem[] {
  return SISTEMAS_PLANS.map((plan) => ({
    categoryName: CATEGORY_NAME,
    categorySlug: CATEGORY_SLUG,
    categoryDescription: CATEGORY_DESCRIPTION,
    categoryOrder: CATEGORY_ORDER,
    subcategoryName: plan.subcategoryName,
    subcategorySlug: slugify(plan.subcategoryName),
    subcategoryOrder: plan.subcategoryOrder,
    planName: plan.planName,
    planSlug: slugify(plan.planName),
    planOrder: 0,
    price: 0,
    pricePrefix: "",
    taxLabel: "",
    summary: plan.summary,
    badge: plan.badge,
    note: plan.note,
    featureGroupTitle: "Incluye",
    highlighted: plan.subcategoryOrder === 0,
    icon: "",
    externalLink: getPlanInquiryHref(plan.planName),
    items: plan.items,
  }));
}
