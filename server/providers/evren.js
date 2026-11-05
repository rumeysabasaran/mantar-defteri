/*
  EVREN LLM API — Varsayılan tanıma servisi (ücretsiz, OpenAI uyumlu biçim)
  Adres: https://evren-llmapi.ssyz.org.tr

  Gerekli ayar (.env):  EVREN_API_KEY=evren_llm_...
  İsteğe bağlı ayar:    EVREN_MODEL=gemma-4-31b   (fotoğraf okuyabilen başka bir model de olur)
*/
import { SYSTEM_PROMPT, JSON_INSTRUCTION, USER_TEXT, RESULT_SCHEMA, IdentifyError, parseJsonReply } from '../prompt.js';

const BASE_URL = 'https://evren-llmapi.ssyz.org.tr/v1';
export const DEFAULT_EVREN_MODEL = 'gemma-4-31b';
const TIMEOUT_MS = 80_000;

export async function askEvren({ image, mediaType, apiKey, model = DEFAULT_EVREN_MODEL }) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.2, // düşük: daha tutarlı, daha az "hayal gücü"
        // Yanıtın bizim kalıbımıza uymasını iste (platform destekliyor)
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'mushroom_result', strict: true, schema: RESULT_SCHEMA },
        },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + JSON_INSTRUCTION },
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_TEXT },
              // Platform görselleri sadece base64 veri adresi olarak kabul ediyor
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${image}` } },
            ],
          },
        ],
      }),
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

  if (!response.ok) {
    throw evrenError(response.status, data);
  }

  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new IdentifyError('incomplete', 'Tanıma yanıtı yarım kaldı. Lütfen tekrar dene.');
  }
  return parseJsonReply(choice?.message?.content);
}

/** Platformun hata kodlarını kullanıcıya anlaşılır Türkçe mesaja çevirir. */
function evrenError(status, data) {
  const code = data?.error?.code || data?.code || data?.detail?.code || '';
  console.error('[identify:evren]', status, JSON.stringify(data).slice(0, 300));

  if (status === 401) return new IdentifyError('bad-key', 'API anahtarı geçersiz. .env dosyasını kontrol et.', 500);
  if (status === 403 && String(code).includes('terms')) {
    return new IdentifyError('terms', 'Evren kullanım şartları onaylanmamış. Evren panelinden onaylaman gerekiyor.', 500);
  }
  if (status === 403) return new IdentifyError('no-permission', 'Bu anahtarın modele erişimi yok.', 500);
  if (status === 402) return new IdentifyError('no-credit', 'Evren hesabında kredi kalmamış.', 500);
  if (status === 429) return new IdentifyError('rate-limit', 'Çok fazla istek gönderildi. Biraz sonra tekrar dene.', 429);
  if (status === 400) return new IdentifyError('bad-request', 'Tanıma servisi fotoğrafı kabul etmedi.', 502);
  return new IdentifyError('api-error', `Tanıma servisi hata verdi (${status}).`, 502);
}
