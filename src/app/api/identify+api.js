/*
  TÜR TANIMA ADRESİ — /api/identify
  Bu dosya telefonda DEĞİL, bilgisayarda (Expo geliştirme sunucusunda) çalışır.
  .env dosyasındaki API anahtarları sadece burada okunur; telefona hiç gönderilmez.
  Anahtar yoksa deneme tanıyıcısı devreye girer (sahte sonuçlar).

  Asıl iş server/identify.js'te (Evren → Gemini → Claude yedekleme zinciri).
*/
import { handleIdentify, pickProviders } from '../../../server/identify.js';
import { mockIdentify } from '../../../server/mockIdentify.js';

let announced = false;

export async function POST(request) {
  const env = process.env;
  const providers = pickProviders(env);

  if (!announced) {
    announced = true;
    const mode = providers.length
      ? providers.map((p) => p.label).join('  →  yedek: ')
      : 'DENEME modu (.env içinde anahtar yok)';
    console.log(`\n  🍄 Tür tanıma: ${mode}\n`);
  }

  const body = await request.json().catch(() => null);
  const { status, body: out } = providers.length ? await handleIdentify(body, env) : await mockIdentify(body);
  return Response.json(out, { status });
}
