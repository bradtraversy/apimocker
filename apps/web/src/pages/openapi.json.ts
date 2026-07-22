import type { APIRoute } from 'astro';
import { openapiDocument } from '../config/openapi';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(openapiDocument, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
