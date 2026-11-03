/*
  TÜR TANIMA — SUNUCU TARAFI

  Bu dosya SADECE sunucuda çalışır:
  - Bilgisayarında: `npm run dev` çalışırken Vite içinde
  - Yayında: Cloudflare Pages Functions içinde (functions/api/identify.js)

  API anahtarı burada kullanılır ve telefona hiçbir zaman gönderilmez.
  Telefon fotoğrafı /api/identify adresine yollar; bu kod anahtarı ekleyip
  seçili servise iletir, gelen yanıtı süzüp geri döndürür.

  Hangi servis kullanılır? (.env dosyasına göre)
    EVREN_API_KEY varsa      → Evren (ücretsiz)     ← varsayılan
    ANTHROPIC_API_KEY varsa  → Claude (ücretli yedek)
    hiçbiri yoksa            → bilgisayarda deneme modu
*/
import { sanitizeResult } from '../src/services/safety.js';
import { IdentifyError } from './prompt.js';
import { askEvren, DEFAULT_EVREN_MODEL } from './providers/evren.js';
import { askClaude, CLAUDE_MODEL } from './providers/claude.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (telefon zaten ~300 KB'a küçültüyor)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** .env ayarlarına göre kullanılacak servisi seçer. Anahtar yoksa null. */
export function pickProvider(env) {
  if (env.EVREN_API_KEY) {
    const model = env.EVREN_MODEL || DEFAULT_EVREN_MODEL;
    return {
      label: `Evren · ${model}`,
      ask: (input) => askEvren({ ...input, apiKey: env.EVREN_API_KEY, model }),
    };
  }
  if (env.ANTHROPIC_API_KEY) {
    return {
      label: `Claude · ${CLAUDE_MODEL}`,
      ask: (input) => askClaude({ ...input, apiKey: env.ANTHROPIC_API_KEY }),
    };
  }
  return null;
}

/**
 * Gelen isteği doğrular, seçili servise sorar, sonucu süzüp döndürür.
 * Her zaman { status, body } döner; çağıran taraf bunu HTTP yanıtına çevirir.
 */
export async function handleIdentify(body, env) {
  const provider = pickProvider(env);
  if (!provider) {
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

  try {
    const raw = await provider.ask({ image, mediaType });
    return reply(200, sanitizeResult(raw));
  } catch (err) {
    if (err instanceof IdentifyError) {
      return reply(err.status, { code: err.code, error: err.message });
    }
    console.error('[identify] Beklenmeyen hata:', err);
    return reply(500, { code: 'unknown', error: 'Beklenmeyen bir hata oluştu.' });
  }
}

function reply(status, body) {
  return { status, body };
}
