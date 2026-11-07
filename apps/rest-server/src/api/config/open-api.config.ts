import { openapi } from '@elysiajs/openapi';
import type { AnyElysia } from 'elysia';
import { z } from 'zod';
import { Env } from '#env/index.js';

const OPEN_API_PATH = '/docs';
const documentation = {
  info: {
    title: 'Quest Board API',
    version: '1.0.0',
  },
  tags: [{ name: 'Quests' }, { name: 'Tags' }],
};

// The docs UI loads its bundle from jsdelivr and boots with an inline script, so only this route gets a
// relaxed script-src. Every other route keeps helmet's default CSP (see cors.config.ts).
const DOCS_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' https: data:",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' https: 'unsafe-inline'",
  'upgrade-insecure-requests',
].join(';');

export function configureOpenApi(app: AnyElysia) {
  if (!Env.OPEN_API_SCHEMA_VISIBLE) {
    return;
  }

  const docsPath = `${app.config.prefix ?? ''}${OPEN_API_PATH}`;

  app.onRequest(({ request, set }) => {
    const { pathname } = new URL(request.url);
    if (pathname === docsPath || pathname.startsWith(`${docsPath}/`)) {
      set.headers['Content-Security-Policy'] = DOCS_CONTENT_SECURITY_POLICY;
    }
  });

  app.use(
    openapi({
      path: OPEN_API_PATH,
      documentation,
      mapJsonSchema: { zod: z.toJSONSchema },
    }),
  );
}
