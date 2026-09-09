---
name: smartpro-transactional-email
description: Builds SmartPro transactional emails with the shared corporate HTML template, APP_URL-based links, brand logo, palette, CTA button, and Equipo SmartPro signature. Use when creating, editing, or sending invitaciones, recuperación de contraseña, compras, notificaciones, Resend, or any correo transaccional.
---

# Correos transaccionales SmartPro

Todo correo que envíe SmartPro (invitaciones, recuperación de contraseña, compras, notificaciones, etc.) debe reutilizar la plantilla corporativa única. No dupliques HTML ni crees una plantilla paralela.

## Flujo obligatorio

1. Construye URLs con `getAppUrl()` / `APP_URL`. Nunca hardcodees `localhost`.
2. Arma el contenido con `renderCorporateEmail()` desde `lib/email/template.ts`.
3. Envía HTML y texto plano juntos con `sendEmail()` desde `lib/email/resend.ts`.
4. Si el correo es de invitación a ejecutivos, usa `buildExecutiveInvitationEmail()`.

## Contenido

- Conserva el copy existente. No agregues información innecesaria.
- Incluye el logo real (`getEmailLogoUrl` → `/images/logo/logo-smartpro-01.png` absoluto con `APP_URL`).
- Paleta: navy `#101024`, violeta `#6D28D9`, magenta `#EC168C`, blanco `#FFFFFF`.
- Tipografía web-safe: `Arial, Helvetica, sans-serif`.
- Si hay acción, el enlace va en un botón CTA (`<a>` con estilos inline). Deja el mismo URL como fallback de texto.
- Firma visual: `Equipo SmartPro`.
- Si el enlace caduca o es de un solo uso, déjalo visible.

## HTML compatible

- Tablas con `role="presentation"`, estilos inline y `bgcolor` de respaldo.
- Ancho máximo 600px y media query para mobile.
- Sin JavaScript ni dependencias de diseño (React, Tailwind, CSS-in-JS).
- Escapa todo texto dinámico. Los `href` solo pueden ser `http` o `https`.
- Incluye siempre la versión `text` equivalente al HTML.

## Qué no hacer

```ts
// ❌ Plantilla nueva o HTML suelto
await sendEmail({ html: "<div>Hola</div>", text: "Hola" });

// ❌ Link hardcodeado
const url = "http://localhost:3000/invitacion/ejecutivo?token=...";
```

```ts
// ✅ Una sola plantilla + APP_URL
const appUrl = getAppUrl();
const { html, text } = renderCorporateEmail({
  title: "…",
  heading: "…",
  appUrl,
  cta: { href: `${appUrl}/ruta`, label: "Continuar" },
});
await sendEmail({ to, subject, html, text });
```

Si hace falta un bloque visual nuevo (detalle de compra, código OTP, etc.), agrégalo a `lib/email/template.ts` para que todos los correos lo reutilicen.
