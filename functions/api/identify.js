/*
  YAYIN SUNUCUSU — Cloudflare Pages Functions
  Uygulama Cloudflare Pages'e yüklendiğinde /api/identify adresi bu dosyayı çalıştırır.
  API anahtarı Cloudflare panelinde "ANTHROPIC_API_KEY" adıyla ayarlanır (6. aşamada anlatılacak).
*/
import { handleIdentify } from '../../server/identify.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const { status, body: out } = await handleIdentify(body, env.ANTHROPIC_API_KEY);
  return Response.json(out, { status });
}
