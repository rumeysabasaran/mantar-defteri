/*
  TANIMA YÖNERGESİ VE YANIT KALIBI
  Hangi yapay zekâ servisi kullanılırsa kullanılsın aynı yönerge ve aynı kalıp kullanılır.
  Kalıpta yenebilirlikle ilgili hiçbir alan YOK.
*/

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

export const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isMushroom', 'photoTip', 'candidates'],
  properties: {
    isMushroom: { type: 'boolean' },
    photoTip: { type: 'string', description: 'Daha iyi bir fotoğraf için kısa ipucu; gerek yoksa boş' },
    candidates: { type: 'array', items: CANDIDATE_SCHEMA },
  },
};

export const SYSTEM_PROMPT = `Sen "Mantar Defteri" adlı bir doğa keşif defterinin tür tanıma yardımcısısın. Kullanıcı ormanda gördüğü bir mantarın fotoğrafını gönderir. Görevin, fotoğraftaki mantarın en olası 3 türünü tahmin etmek ve kitaptaki tür sayfası için kısa, sıcak ve bilgilendirici Türkçe metinler yazmak.

Kesin kural: Hiçbir alanda yenebilirlik, zehirlilik, tüketim, tat, yemek, mutfak, tıbbi kullanım ya da sağlık etkisi hakkında bilgi verme veya bunu ima etme. Uygulama bu bilgiyi asla göstermez ve bu tür cümleler otomatik olarak silinir; yazarsan metin eksik kalır. Bir türün Türkçe yaygın adı bu anlamları taşıyorsa (ör. ölüm, zehir, köy göçüren), onun yerine tarafsız, görünüşe dayalı bir ad yaz.

Yönergeler:
- Fotoğraftan tür tespiti belirsizdir. Güven yüzdeleri gerçekçi olsun; emin değilsen düşük ver. Yüzdelerin toplamı 100 olmak zorunda değil.
- Adayları en olasıdan başlayarak sırala, tam 3 aday ver. Birbirine benzeyen türleri ayırt eden görünür özellikleri tanımlarda belirt.
- Nadirlik: Türkiye ve Avrupa ormanlarında ne sıklıkla görüldüğüne göre "common" (Yaygın), "rare" (Nadir), "veryRare" (Çok Nadir).
- Tanım alanları birer cümle, sade ve doğa defteri üslubunda olsun. Tüm metinler Türkçe olsun.
- "Biliyor muydun?" bilgisi ekoloji, biyoloji, tarih veya kültürle ilgili ilginç bir bilgi olsun.
- Fotoğrafta mantar yoksa isMushroom=false ve candidates boş dizi olsun; photoTip alanında nazikçe yeniden çekmeyi öner.
- Fotoğraf bulanık, çok uzak ya da şapka altı görünmüyorsa photoTip alanında kısa bir ipucu ver.`;

/** Yanıt kalıbını zorla uygulayamayan servisler için yönergenin sonuna eklenen açıklama */
export const JSON_INSTRUCTION = `

Yanıtını SADECE aşağıdaki biçimde, başka hiçbir metin eklemeden tek bir JSON nesnesi olarak ver:
{"isMushroom": true, "photoTip": "", "candidates": [{"latinName": "", "turkishName": "", "confidence": 0, "rarity": "common", "capShape": "", "color": "", "stem": "", "habitat": "", "season": "", "funFact": ""}]}
rarity yalnızca "common", "rare" veya "veryRare" olabilir; confidence 0-100 arası tam sayıdır.`;

export const USER_TEXT = 'Bu fotoğraftaki mantarı tanımla.';

/** Kendi hata türümüz: kullanıcıya gösterilecek Türkçe mesajı taşır. */
export class IdentifyError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Model yanıtındaki JSON'u çıkarır. Bazı modeller JSON'u ```json ... ``` içine
 * sarar ya da önüne açıklama ekler; ilk "{" ile son "}" arasını alırız.
 */
export function parseJsonReply(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new IdentifyError('empty', 'Tanıma servisi boş yanıt verdi.');
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new IdentifyError('bad-json', 'Tanıma yanıtı okunamadı. Lütfen tekrar dene.');
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new IdentifyError('bad-json', 'Tanıma yanıtı okunamadı. Lütfen tekrar dene.');
  }
}
