import { EMAIL_BRAND, assertHttpUrl, getEmailLogoUrl, normalizeAppUrl } from "./brand";
import { escapeHtml, toPlainTextLines } from "./html";

export type CorporateEmailHighlight = {
  label: string;
  value: string;
};

export type CorporateEmailCta = {
  href: string;
  label: string;
};

export type CorporateEmailDetail = {
  label: string;
  value: string;
};

export type CorporateEmailContent = {
  title: string;
  preheader?: string;
  heading: string;
  greeting?: string;
  intro?: string | string[];
  highlight?: CorporateEmailHighlight;
  details?: CorporateEmailDetail[];
  actionText?: string;
  cta?: CorporateEmailCta;
  notices?: string[];
  closing?: string;
  signature?: string;
  appUrl: string;
};

function asList(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function paragraphHtml(text: string, extraStyle = ""): string {
  return `<p style="margin:0 0 16px;font-family:${EMAIL_BRAND.fonts};font-size:16px;line-height:24px;color:${EMAIL_BRAND.colors.ink};${extraStyle}">${escapeHtml(text)}</p>`;
}

function renderHighlight(highlight: CorporateEmailHighlight): string {
  return `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:collapse;">
                      <tr>
                        <td style="background-color:${EMAIL_BRAND.colors.highlightBg};border-left:4px solid ${EMAIL_BRAND.colors.magenta};padding:16px 18px;">
                          <p style="margin:0 0 6px;font-family:${EMAIL_BRAND.fonts};font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.colors.muted};font-weight:700;">${escapeHtml(highlight.label)}</p>
                          <p style="margin:0;font-family:${EMAIL_BRAND.fonts};font-size:20px;line-height:28px;color:${EMAIL_BRAND.colors.violet};font-weight:700;">${escapeHtml(highlight.value)}</p>
                        </td>
                      </tr>
                    </table>`;
}

function renderDetails(details: CorporateEmailDetail[]): string {
  const rows = details
    .map(
      (detail, index) => `
                      <tr>
                        <td style="padding:${index === 0 ? "0" : "10px"} 0 0;font-family:${EMAIL_BRAND.fonts};font-size:14px;line-height:20px;color:${EMAIL_BRAND.colors.muted};width:40%;">${escapeHtml(detail.label)}</td>
                        <td style="padding:${index === 0 ? "0" : "10px"} 0 0;font-family:${EMAIL_BRAND.fonts};font-size:14px;line-height:20px;color:${EMAIL_BRAND.colors.ink};font-weight:700;text-align:right;">${escapeHtml(detail.value)}</td>
                      </tr>`,
    )
    .join("");

  return `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:collapse;">
                      ${rows}
                    </table>`;
}

function renderCta(cta: CorporateEmailCta): string {
  const href = escapeHtml(assertHttpUrl(cta.href, "El enlace del correo"));
  const label = escapeHtml(cta.label);

  return `
                    <table role="presentation" class="email-cta" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 16px;">
                      <tr>
                        <td align="center" bgcolor="${EMAIL_BRAND.colors.violet}" style="border-radius:999px;background-color:${EMAIL_BRAND.colors.violet};">
                          <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:${EMAIL_BRAND.fonts};font-size:15px;line-height:20px;font-weight:700;color:${EMAIL_BRAND.colors.white};text-decoration:none;border-radius:999px;">${label}</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 24px;font-family:${EMAIL_BRAND.fonts};font-size:12px;line-height:20px;color:${EMAIL_BRAND.colors.muted};word-break:break-all;overflow-wrap:anywhere;">
                      <a href="${href}" target="_blank" rel="noopener noreferrer" style="color:${EMAIL_BRAND.colors.violet};text-decoration:underline;">${href}</a>
                    </p>`;
}

function renderNotice(text: string): string {
  return `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-collapse:collapse;">
                      <tr>
                        <td style="background-color:${EMAIL_BRAND.colors.highlightBg};border:1px solid ${EMAIL_BRAND.colors.border};padding:14px 16px;">
                          <p style="margin:0;font-family:${EMAIL_BRAND.fonts};font-size:14px;line-height:22px;color:${EMAIL_BRAND.colors.navy};">${escapeHtml(text)}</p>
                        </td>
                      </tr>
                    </table>`;
}

function renderSignature(signature: string): string {
  return `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;border-collapse:collapse;">
                      <tr>
                        <td style="padding:0 0 12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="40" height="3" bgcolor="${EMAIL_BRAND.colors.magenta}" style="background-color:${EMAIL_BRAND.colors.magenta};font-size:0;line-height:3px;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family:${EMAIL_BRAND.fonts};font-size:15px;line-height:22px;color:${EMAIL_BRAND.colors.navy};font-weight:700;">${escapeHtml(signature)}</td>
                      </tr>
                    </table>`;
}

export function renderCorporateEmailText(content: CorporateEmailContent): string {
  const intro = asList(content.intro);
  const highlight = content.highlight ? `${content.highlight.label}: ${content.highlight.value}` : undefined;
  const details = content.details?.map((detail) => `${detail.label}: ${detail.value}`) ?? [];

  return toPlainTextLines([
    content.greeting,
    "",
    ...intro,
    highlight ? "" : undefined,
    highlight,
    details.length ? "" : undefined,
    ...details,
    content.actionText ? "" : undefined,
    content.actionText,
    content.cta?.href,
    "",
    ...(content.notices ?? []),
    content.closing ? "" : undefined,
    content.closing,
    "",
    content.signature ?? EMAIL_BRAND.signature,
  ]);
}

export function renderCorporateEmail(content: CorporateEmailContent): { html: string; text: string } {
  const appUrl = normalizeAppUrl(content.appUrl);
  const logoUrl = escapeHtml(getEmailLogoUrl(appUrl));
  const title = escapeHtml(content.title);
  const heading = escapeHtml(content.heading);
  const preheader = content.preheader ? escapeHtml(content.preheader) : "";
  const signature = content.signature ?? EMAIL_BRAND.signature;
  const intro = asList(content.intro);

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <title>${title}</title>
    <style type="text/css">
      @media only screen and (max-width: 620px) {
        .email-wrapper { padding: 16px 12px !important; }
        .email-container { width: 100% !important; }
        .email-header, .email-body { padding-left: 20px !important; padding-right: 20px !important; }
        .email-cta { width: 100% !important; }
        .email-cta a { display: block !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_BRAND.colors.background};">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EMAIL_BRAND.colors.background};opacity:0;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_BRAND.colors.background};">
      <tr>
        <td class="email-wrapper" align="center" style="padding:28px 16px;">
          <!--[if mso]>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td>
          <![endif]-->
          <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background-color:${EMAIL_BRAND.colors.white};">
            <tr>
              <td bgcolor="${EMAIL_BRAND.colors.navy}" style="background-color:${EMAIL_BRAND.colors.navy};font-size:0;line-height:8px;height:8px;">&nbsp;</td>
            </tr>
            <tr>
              <td class="email-header" align="center" bgcolor="${EMAIL_BRAND.colors.white}" style="background-color:${EMAIL_BRAND.colors.white};padding:28px 32px 20px;">
                <img src="${logoUrl}" alt="${escapeHtml(EMAIL_BRAND.name)}" width="${EMAIL_BRAND.logoWidth}" height="${EMAIL_BRAND.logoHeight}" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:auto;max-width:180px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0;font-size:0;line-height:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50%" height="4" bgcolor="${EMAIL_BRAND.colors.violet}" style="background-color:${EMAIL_BRAND.colors.violet};font-size:0;line-height:4px;">&nbsp;</td>
                    <td width="50%" height="4" bgcolor="${EMAIL_BRAND.colors.magenta}" style="background-color:${EMAIL_BRAND.colors.magenta};font-size:0;line-height:4px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-body" bgcolor="${EMAIL_BRAND.colors.white}" style="background-color:${EMAIL_BRAND.colors.white};padding:36px 32px 32px;">
                <h1 style="margin:0 0 20px;font-family:${EMAIL_BRAND.fonts};font-size:22px;line-height:30px;color:${EMAIL_BRAND.colors.navy};font-weight:700;">${heading}</h1>
                ${content.greeting ? paragraphHtml(content.greeting) : ""}
                ${intro.map((text) => paragraphHtml(text)).join("")}
                ${content.highlight ? renderHighlight(content.highlight) : ""}
                ${content.details?.length ? renderDetails(content.details) : ""}
                ${content.actionText ? paragraphHtml(content.actionText) : ""}
                ${content.cta ? renderCta(content.cta) : ""}
                ${(content.notices ?? []).map(renderNotice).join("")}
                ${content.closing ? paragraphHtml(content.closing, "margin-bottom:0;") : ""}
                ${renderSignature(signature)}
              </td>
            </tr>
            <tr>
              <td bgcolor="${EMAIL_BRAND.colors.navy}" style="background-color:${EMAIL_BRAND.colors.navy};font-size:0;line-height:8px;height:8px;">&nbsp;</td>
            </tr>
          </table>
          <!--[if mso]>
          </td></tr></table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    html,
    text: renderCorporateEmailText({ ...content, signature }),
  };
}
