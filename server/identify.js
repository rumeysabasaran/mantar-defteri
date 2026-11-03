/*
  TÜR TANIMA — SUNUCU TARAFI

  Bu dosya SADECE sunucuda çalışır:
  - Bilgisayarında: `npm run dev` çalışırken Vite içinde
  - Yayında: Cloudflare Pages Functions içinde (functions/api/identify.js)

  API anahtarları burada kullanılır ve telefona hiçbir zaman gönderilmez.
  Telefon fotoğrafı /api/identify adresine yollar; bu kod anahtarı ekleyip
  servise iletir, gelen yanıtı süzüp geri döndürür.

  OTOMATİK YEDEKLEME ZİNCİRİ
  Anahtarı .env içinde olan servisler sırayla denenir:
      1. Evren   (EVREN_API_KEY)      — ücretsiz, varsayılan
      2. Gemini  (GEMINI_API_KEY)     — ücretsiz yedek
      3. Claude  (ANTHROPIC_API_KEY)  — ücretli yedek
  Bir servis hata verirse (kredi bitti, kota doldu, yanıt yok...) bir sonrakine geçilir.
  Sırayı değiştirmek için: RECOGNIZER_ORDER=gemini,evren
  Hiç anahtar yoksa bilgisayarda deneme modu çalışır.
*/
import { sanitizeResult } from '../src/services/safety.js';
import { IdentifyError } from './prompt.js';
import { askEvren, DEFAULT_EVREN_MODEL } from './providers/evren.js';
import { askGemini, DEFAULT_GEMINI_MODEL } from './providers/gemini.js';
import { askClaude, CLAUDE_MODEL } from './providers/claude.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (telefon zaten ~300 KB'a küçültüyor)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_ORDER = ['evren', 'gemini', 'claude'];

// Bu hatalar fotoğraftan kaynaklanır; başka servise geçmek işe yaramaz.
const NO_FALLBACK = new Set(['too-large']);

/** Her servisin anahtarı ve nasıl çağrılacağı */
const PROVIDERS = {
  evren: (env) =>
    env.EVREN_API_KEY && {
      name: 'evren',
      label: `Evren · ${env.EVREN_MODEL || DEFAULT_EVREN_MODEL}`,
      ask: (input) => askEvren({ ...input, apiKey: env.EVREN_API_KEY, model: env.EVREN_MODEL || DEFAULT_EVREN_MODEL }),
    },
  gemini: (env) =>
    env.GEMINI_API_KEY && {
      name: 'gemini',
      label: `Gemini · ${env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}`,
      ask: (input) => askGemini({ ...input, apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL }),
    },
  claude: (env) =>
    env.ANTHROPIC_API_KEY && {
      name: 'claude',
      label: `Claude · ${CLAUDE_MODEL}`,
      ask: (input) => askClaude({ ...input, apiKey: env.ANTHROPIC_API_KEY }),
    },
};

/** Anahtarı olan servisleri deneme sırasıyla döndürür. */
export function pickProviders(env) {
  const order = env.RECOGNIZER_ORDER
    ? env.RECOGNIZER_ORDER.split(',').map((s) => s.trim().toLowerCase())
    : DEFAULT_ORDER;
  return order.map((name) => PROVIDERS[name]?.(env)).filter(Boolean);
}

/**
 * Gelen isteği doğrular, servisleri sırayla dener, sonucu süzüp döndürür.
 * Her zaman { status, body } döner; çağıran taraf bunu HTTP yanıtına çevirir.
 */
export async function handleIdentify(body, env) {
  const providers = pickProviders(env);
  if (providers.length === 0) {
    return reply(500, { code: 'no-key', error: 'Sunucuda API anahtarı ayarlanmamış.' });
  }

  const image = body?.image;
  const mediaType = body?.mediaType;
  if (typeof image !== 'string' || !image || !ALLOWED_TYPES.includes(mediaType)) {
    return reply(400, { code: 'bad-request', error: 'Fotoğraf okunamadı.' });
  }
  if (image.length * 0.75 > MAX_IMAGE_BYTES) {
    return reply(413, { code: 'too-large', error: 'Fotoğraf çok büyük.' });
  }

  let lastError = null;
  for (const provider of providers) {
    try {
      const raw = await provider.ask({ image, mediaType });
      if (lastError) console.info(`[identify] Yedek servis kullanıldı: ${provider.label}`);
      return reply(200, sanitizeResult(raw));
    } catch (err) {
      if (!(err instanceof IdentifyError)) {
        console.error(`[identify] ${provider.label} beklenmeyen hata:`, err);
        lastError = new IdentifyError('unknown', 'Beklenmeyen bir hata oluştu.', 500);
      } else {
        console.warn(`[identify] ${provider.label} başarısız: ${err.code}`);
        lastError = err;
        if (NO_FALLBACK.has(err.code)) break;
      }
    }
  }

  // Hiçbir servis başaramadı: son hatayı kullanıcıya göster
  return reply(lastError.status, { code: lastError.code, error: lastError.message });
}

function reply(status, body) {
  return { status, body };
}
