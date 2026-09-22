<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# API pública (`/api/v1`)

Las subpáginas por servicio consumen SmartPro a través de `/api/v1`. Antes de tocar nada bajo
`app/api/v1/` o `lib/api/v1/`, lee [`docs/api/README.md`](docs/api/README.md).

- Toda ruta nueva se monta con `createApiRoute` de `lib/api/v1/handler.ts`, que ya resuelve
  autenticación, firma HMAC, CORS, límite de uso, idempotencia, errores y registro. No escribas
  esa lógica dentro del handler.
- Las respuestas no exponen modelos internos: pasan por `lib/api/v1/presenters.ts`.
- Todo lo que devuelve catálogo se filtra por `client.allowedServiceIds`.
- Cada cambio de contrato se refleja en `lib/api/v1/openapi.ts` y en `docs/api/README.md`.
