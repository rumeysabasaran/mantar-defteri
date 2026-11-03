/*
  TÜR TANIMA — SUNUCU TARAFI

  Bu dosya SADECE sunucuda çalışır:
  - Bilgisayarında: `npm run dev` çalışırken Vite içinde
  - Yayında: Cloudflare Pages Functions içinde (functions/api/identify.js)

  API anahtarı burada kullanılır ve telefona hiçbir zaman gönderilmez.
  Telefon fotoğrafı /api/identify adresine yollar; bu kod anahtarı ekleyip
  Claude'a iletir, gelen yanıtı süzüp geri döndürür.
*/
import Anthropic from '@anthropic-ai/sdk';
import { sanitizeResult } from '../src/services/safety.js';

export const MODEL = 'claude-opus-5-5';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (telefon zaten ~300 KB'a küçültüyor)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Claude'dan istediğimiz yanıtın kalıbı. Yenebilirlikle ilgili hiçbir alan YOK.
const CANDIDATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['latinName', 'turkishName', 'confidence', 'rarity', 'capShape', 'color', 'stem', 'habitat', 'season', 'funFact'],
  properties: {
    latinName: { type: 'string', description: 'Bilimsel (Latince) ad, ör. "Trametes versicolor"' },
    turkishName: { type: 'string', description: 'Yaygın Türkçe ad; yoksa kısa betimleyici bir ad' },
    confidence: { type: 'integer', description: '0-100 arası güven yüzdesi' },
    rarity: { type: 'string', enum: ['common', 'rare', 'veryRare'] },
    capShape: { type: 'string', description: 'Şapka şekli, 1 cümle' },
    color: { type: 'string', description: 'Renk özellikleri, 1 cümle' },
    stem: { type: 'string', description: 'Sap özellikleri, 1 cümle (sapı yoksa bunu belirt)' },
    habitat: { type: 'string', description: 'Büyüdüğü ortam, 1-2 cümle' },
    season: { type: 'string', description: 'Görüldüğü mevsim(ler), kısa' },
    funFact: { type: 'string', description: '"Biliyor muydun?" için ilginç bir bilgi, 1-2 cümle' },
  },
};

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isMushroom', 'photoTip', 'candidates'],
  properties: {
    isMushroom: { type: 'boolean' },
    photoTip: { type: 'string', description: 'Daha iyi bir fotoğraf için kısa ipucu; gerek yoksa boş' },
    candidates: { type: 'array', items: CANDIDATE_SCHEMA },
  },
};

const SYSTEM_PROMPT = `Sen "Mantar Defteri" adlı bir doğa keşif defterinin tür tanıma yardımcısısın. Kullanıcı ormanda gördüğü bir mantarın fotoğrafını gönderir. Görevin, fotoğraftaki mantarın en olası 3 türünü tahmin etmek ve kitaptaki tür sayfası için kısa, sıcak ve bilgilendirici Türkçe metinler yazmak.

Kesin kural: Hiçbir alanda yenebilirlik, zehirlilik, tüketim, tat, yemek, mutfak, tıbbi kullanım ya da sağlık etkisi hakkında bilgi verme veya bunu ima etme. Uygulama bu bilgiyi asla göstermez ve bu tür cümleler otomatik olarak silinir; yazarsan metin eksik kalır. Bir türün Türkçe yaygın adı bu anlamları taşıyorsa (ör. ölüm, zehir, köy göçüren), onun yerine tarafsız, görünüşe dayalı bir ad yaz.

Yönergeler:
- Fotoğraftan tür tespiti belirsizdir. Güven yüzdeleri gerçekçi olsun; emin değilsen düşük ver. Yüzdelerin toplamı 100 olmak zorunda değil.
- Adayları en olasıdan başlayarak sırala, tam 3 aday ver. Birbirine benzeyen türleri ayırt eden görünür özellikleri tanımlarda belirt.
- Nadirlik: Türkiye ve Avrupa ormanlarında ne sıklıkla görüldüğüne göre "common" (Yaygın), "rare" (Nadir), "veryRare" (Çok Nadir).
- Tanım alanları birer cümle, sade ve doğa defteri üslubunda olsun.
- "Biliyor muydun?" bilgisi ekoloji, biyoloji, tarih veya kültürle ilgili ilginç bir bilgi olsun.
- Fotoğrafta mantar yoksa isMushroom=false ve candidates boş dizi olsun; photoTip alanında nazikçe yeniden çekmeyi öner.
- Fotoğraf bulanık, çok uzak ya da şapka altı görünmüyorsa photoTip alanında kısa bir ipucu ver.`;

/** Kendi hata türümüz: kullanıcıya gösterilecek Türkçe mesajı taşır. */
class IdentifyError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Gelen isteği doğrular, Claude'a sorar, sonucu süzüp döndürür.
 * Her zaman { status, body } döner; çağıran taraf bunu HTTP yanıtına çevirir.
 */
export async function handleIdentify(body, apiKey) {
  if (!apiKey) {
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
    const raw = await askClaude({ image, mediaType, apiKey });
    return reply(200, sanitizeResult(raw));
  } catch (err) {
    return errorToReply(err);
  }
}

async function askClaude({ image, mediaType, apiKey }) {
  const client = new Anthropic({ apiKey });

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Güvenlik sınıflandırıcısı bir isteği yanlışlıkla reddederse,
    // Anthropic isteği otomatik olarak uygun başka bir modelle yeniden dener.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: RESULT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
          { type: 'text', text: 'Bu fotoğraftaki mantarı tanımla.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new IdentifyError('refused', 'Bu fotoğraf için tanıma yapılamadı. Başka bir fotoğrafla dener misin?');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new IdentifyError('incomplete', 'Tanıma yanıtı yarım kaldı. Lütfen tekrar dene.');
  }

  const text = response.content.find((block) => block.type === 'text')?.text;
  if (!text) throw new IdentifyError('empty', 'Tanıma servisi boş yanıt verdi.');

  try {
    return JSON.parse(text);
  } catch {
    throw new IdentifyError('bad-json', 'Tanıma yanıtı okunamadı. Lütfen tekrar dene.');
  }
}

function errorToReply(err) {
  if (err instanceof IdentifyError) {
    return reply(err.status, { code: err.code, error: err.message });
  }
  // En özel hatadan en genele doğru
  if (err instanceof Anthropic.AuthenticationError) {
    return reply(500, { code: 'bad-key', error: 'API anahtarı geçersiz. .env dosyasını kontrol et.' });
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return reply(500, { code: 'no-permission', error: 'API anahtarının bu modele erişimi yok.' });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return reply(429, { code: 'rate-limit', error: 'Çok fazla istek gönderildi. Biraz sonra tekrar dene.' });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return reply(503, { code: 'unreachable', error: 'Tanıma servisine ulaşılamadı.' });
  }
  if (err instanceof Anthropic.APIError) {
    console.error('[identify] API hatası:', err.status, err.message);
    return reply(502, { code: 'api-error', error: `Tanıma servisi hata verdi (${err.status ?? '?'}).` });
  }
  console.error('[identify] Beklenmeyen hata:', err);
  return reply(500, { code: 'unknown', error: 'Beklenmeyen bir hata oluştu.' });
}

function reply(status, body) {
  return { status, body };
}
