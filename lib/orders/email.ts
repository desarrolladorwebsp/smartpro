type OrderEmailPayload = {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal?: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
};

export async function sendOrderNotification(order: OrderEmailPayload) {
  const to = process.env.EMAIL_TO ?? "commercial@smartpro.cl";
  const from = process.env.EMAIL_FROM ?? "SmartPro <no-reply@smartpro.cl>";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.info("[smartpro:email] Email de notificación no enviado: RESEND_API_KEY no configurada.", {
      to,
      orderId: order.id,
    });
    return { delivered: false, provider: "console" };
  }

  const emailBody = [
    `Nueva orden SmartPro — ${order.id}`,
    "",
    `Fecha: ${new Date(order.createdAt).toLocaleString("es-CL")}`,
    `Cliente: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Teléfono: ${order.customer.phone}`,
    order.customer.company ? `Empresa: ${order.customer.company}` : "Empresa: —",
    "",
    "Productos:",
    ...order.items.map(
      (item) => `- ${item.name} x${item.quantity} — ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(item.unitPrice * (item.quantity ?? 1))}`,
    ),
    "",
    `Subtotal: ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(order.subtotal)}`,
    `IVA: ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(order.tax)}`,
    `Total: ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(order.total)}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Nueva orden SmartPro — ${order.id}`,
      text: emailBody,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[smartpro:email] Error al enviar correo", message);
    return { delivered: false, provider: "resend", error: message };
  }

  return { delivered: true, provider: "resend" };
}
