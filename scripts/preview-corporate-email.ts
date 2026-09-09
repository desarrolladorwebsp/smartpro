import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { EMAIL_BRAND } from "../lib/email/brand";
import { buildExecutiveInvitationEmail } from "../lib/email/executive-invitation";

async function main() {
  const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://smartpro.cl";
  const inviteUrl = `${APP_URL.replace(/\/$/, "")}/invitacion/ejecutivo?token=preview-token`;

  const email = buildExecutiveInvitationEmail({
    roleLabel: "Administrador",
    inviteUrl,
    appUrl: APP_URL,
  });

  const preview = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview correo invitacion SmartPro</title>
    <style>
      body { margin: 0; background: #eceaf3; font-family: Arial, Helvetica, sans-serif; color: #101024; }
      h1 { margin: 0 0 8px; font-size: 18px; }
      p { margin: 0 0 24px; color: #6e6b7b; font-size: 14px; }
      .frames { display: flex; flex-wrap: wrap; gap: 24px; padding: 24px; }
      .frame { background: #fff; border: 1px solid #e8e5ef; border-radius: 16px; overflow: hidden; }
      .label { padding: 12px 16px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      iframe { display: block; border: 0; background: #f8f7fc; }
    </style>
  </head>
  <body>
    <div class="frames">
      <section>
        <h1>Desktop</h1>
        <p>600px</p>
        <div class="frame">
          <div class="label">Desktop 600px</div>
          <iframe title="Desktop" width="600" height="900" src="./email-invitation-local.html"></iframe>
        </div>
      </section>
      <section>
        <h1>Mobile</h1>
        <p>375px</p>
        <div class="frame">
          <div class="label">Mobile 375px</div>
          <iframe title="Mobile" width="375" height="900" src="./email-invitation-local.html"></iframe>
        </div>
      </section>
    </div>
  </body>
</html>
`;

  const outDir = path.join(process.cwd(), ".tmp");
  const localHtml = email.html.replace(
    `${APP_URL.replace(/\/$/, "")}${EMAIL_BRAND.logoPath}`,
    "./logo-smartpro-01.png",
  );

  await mkdir(outDir, { recursive: true });
  await copyFile(
    path.join(process.cwd(), "public", "images", "logo", "logo-smartpro-01.png"),
    path.join(outDir, "logo-smartpro-01.png"),
  );
  await writeFile(path.join(outDir, "email-invitation.html"), email.html, "utf8");
  await writeFile(path.join(outDir, "email-invitation-local.html"), localHtml, "utf8");
  await writeFile(path.join(outDir, "email-preview.html"), preview, "utf8");

  console.log(`Preview escrito en ${path.join(outDir, "email-preview.html")}`);
}

void main();
