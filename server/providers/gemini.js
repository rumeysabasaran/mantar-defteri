/*
  GOOGLE GEMINI — Ücretsiz yedek tanıma servisi
  Evren ücretli olursa, kotası dolarsa ya da yanıt vermezse otomatik devreye girer.

  Gerekli ayar (.env):  GEMINI_API_KEY=...   (https://aistudio.google.com/apikey)
  İsteğe bağlı ayar:    GEMINI_MODEL=gemini-3.5-flash-lite   (ya da daha güçlü ama yoğun: gemini-3.8-flash)

  Not: Google'ın ücretsiz katmanında gönderilen içerik Google ürünlerini geliştirmek
  için kullanılabilir. Sadece fotoğraf gönderilir; konum ve saha notları gönderilmez.

  Google'ın güncel önerdiği "Interactions" adresi kullanılıyor.
*/
import { SYSTEM_PROMPT, JSON_INSTRUCTION, USER_TEXT, RESULT_SCHEMA, IdentifyError, parseJsonReply } from '../prompt.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
// Denemelerde gemini-3.8-flash ücretsiz katmanda sık sık "çok yoğun" (503) hatası verdi;
// flash-lite hızlı (~3-4 sn) ve türleri doğru buldu.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const TIMEOUT_MS = 60_000;

export async function askGemini({ image, mediaType, apiKey, model = DEFAULT_GEMINI_MODEL }) {
  const request = {
    model,
    system_instruction: SYSTEM_PROMPT + JSON_INSTRUCTION,
    input: [
      { type: 'text', text: USER_TEXT },
      { type: 'image', data: image, mime_type: mediaType },
    ],
    // Yanıtın bizim kalıbımıza uymasını iste
    response_format: { type: 'text', mime_type: 'application/json', schema: RESULT_SCHEMA },
    generation_config: {
      thinking_level: 'low', // az düşün: daha hızlı ve kotayı daha az harcar
      max_output_tokens: 4096,
    },
    store: false, // Google sunucusunda konuşma kaydı tutulmasın
  };

  let data;
  try {
    data = await send(request, apiKey);
  } catch (err) {
    // Kalıp bu model için fazla karmaşık bulunursa, kalıpsız bir kez daha dene
    // (yönergedeki JSON açıklaması yine de doğru biçimi ister).
    if (err instanceof IdentifyError && err.code === 'bad-request') {
      const { response_format, ...withoutSchema } = request;
      data = await send(withoutSchema, apiKey);
    } else {
      throw err;
    }
  }

  if (data.status === 'incomplete') {
    throw new IdentifyError('incomplete', 'Tanıma yanıtı yarım kaldı. Lütfen tekrar dene.');
  }
  if (data.status && data.status !== 'completed') {
    throw new IdentifyError('api-error', `Tanıma servisi tamamlanamadı (${data.status}).`);
  }

  // Yanıt metni "steps" içindeki model çıktısındadır
  const text =
    (data.steps ?? [])
      .filter((step) => step.type === 'model_output')
      .flatMap((step) => step.content ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') || data.output_text;

  return parseJsonReply(text);
}

async function send(body, apiKey) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Expo geliştirme sunucusu kendi fetch'ini kullanır ve yanıt 30 sn içinde başlamazsa
      // bağlantıyı keser. Model düşünürken veri göndermediği için bu süreyi uzatıyoruz.
      // (Standart fetch bu ayarı tanımaz ve görmezden gelir.)
      connectTimeout: TIMEOUT_MS + 5_000,
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new IdentifyError('timeout', 'Tanıma çok uzun sürdü. Lütfen tekrar dene.', 504);
    }
    throw new IdentifyError('unreachable', 'Tanıma servisine ulaşılamadı.', 503);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw geminiError(response.status, data);
  return data;
}

/** Google'ın hata kodlarını kullanıcıya anlaşılır Türkçe mesaja çevirir. */
function geminiError(status, data) {
  // Google hata yanıtını bazen bir liste içinde gönderiyor: [{ error: {...} }]
  const err = (Array.isArray(data) ? data[0] : data)?.error ?? {};
  const text = `${err.status ?? ''} ${err.code ?? ''} ${err.message ?? ''}`;
  console.error('[identify:gemini]', status, text.slice(0, 300));

  if (/API_KEY|api key|apikey|UNAUTHENTICATED/i.test(text) || status === 401) {
    return new IdentifyError('bad-key', 'Gemini API anahtarı geçersiz. .env dosyasını kontrol et.', 500);
  }
  if (status === 429) {
    return new IdentifyError('rate-limit', 'Gemini günlük ücretsiz kotası doldu. Yarın tekrar dene.', 429);
  }
  if (status === 503) {
    return new IdentifyError('busy', 'Gemini şu an çok yoğun. Biraz sonra tekrar dene.', 503);
  }
  if (status === 403) return new IdentifyError('no-permission', 'Gemini anahtarının bu modele erişimi yok.', 500);
  if (status === 400) return new IdentifyError('bad-request', 'Gemini isteği kabul etmedi.', 502);
  return new IdentifyError('api-error', `Gemini hata verdi (${status}).`, 502);
}
