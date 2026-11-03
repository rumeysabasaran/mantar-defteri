/*
  GÜVENLİK SÜZGECİ — Projenin kesin kuralı burada uygulanır:
  Mantar Defteri hiçbir yerde yenebilirlik / zehirlilik / tüketim bilgisi göstermez.

  Tanıma servisinden gelen her yanıt ekrana ulaşmadan önce buradan geçer:
  1. Sadece izin verilen alanlar alınır (beyaz liste). Servis başka bir şey
     yollasa bile (ör. "edible: true") o alan hiç okunmaz.
  2. Metinler cümle cümle taranır; yasaklı bir kök geçen cümle tamamen atılır.
  3. Türkçe adı bu anlamları taşıyorsa (ör. "ölüm", "zehir") ad gösterilmez,
     yerine Latince ad kullanılır.

  Bu dosya hem sunucuda hem telefonda çalışır (iki kat koruma).
*/

// Küçük harfle aranır. Kelime kökleri: "zehir" → zehirli, zehirlenme...
const BANNED_PATTERNS = [
  // Türkçe
  /yenebil/, /yenil(ir|mez|emez)/, /yenmez/, /yenir\b/, /yenme(si|z)/, /yendiğ/,
  /yemek/, /yemeğ/, /yiyecek/, /yiyen/, /zehir/, /toksi/, /tüket/, /lezzet/,
  /\btadı/, /\blezi/, /pişir/, /kızart/, /mutfak/, /sofra/, /yemek tarif/,
  /ölüm/, /öldür/, /köygöçüren/, /şifa/, /tıbb?i/, /ilaç/, /tedavi/,
  /halüsin/, /sanrı/, /sindirim/, /mide/, /karaciğer/, /böbrek/,
  /zararlı/, /tehlikeli/, /güvenli/, /sağlığ/, /sağlık/, /hayati/,
  // İngilizce (servis bazen İngilizce kelime karıştırabilir)
  /\bedib/, /\binedib/, /poison/, /toxic/, /toxin/, /\beat/, /\bcook/,
  /culinary/, /delicious/, /deadly/, /lethal/, /medicin/,
];

/** Metinde yasaklı bir ifade var mı? */
export function containsBanned(text) {
  if (typeof text !== 'string' || !text) return false;
  const tr = text.toLocaleLowerCase('tr-TR');
  const en = text.toLowerCase(); // İngilizce "I" harfi için ikinci kontrol
  return BANNED_PATTERNS.some((p) => p.test(tr) || p.test(en));
}

/** Metni cümlelere böler, yasaklı cümleleri atar, uzunluğu sınırlar. */
export function cleanText(text, maxLength = 400) {
  if (typeof text !== 'string') return '';
  const sentences = text.match(/[^.!?…]+[.!?…]*/g) ?? [];
  return sentences
    .map((s) => s.trim())
    .filter((s) => s && !containsBanned(s))
    .join(' ')
    .slice(0, maxLength)
    .trim();
}

const RARITY_KEYS = ['common', 'rare', 'veryRare'];

/** Latince adı sadeleştirir: sadece harf, boşluk, nokta, tire. */
function cleanLatinName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[^A-Za-z .\-×]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Tek bir tür adayını beyaz listeye göre yeniden kurar. */
export function sanitizeCandidate(raw) {
  const latinName = cleanLatinName(raw?.latinName);
  const turkishNameRaw = typeof raw?.turkishName === 'string' ? raw.turkishName.trim().slice(0, 80) : '';
  const confidence = Math.round(Number(raw?.confidence));

  return {
    latinName,
    turkishName: containsBanned(turkishNameRaw) ? '' : turkishNameRaw,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 0,
    rarity: RARITY_KEYS.includes(raw?.rarity) ? raw.rarity : 'common',
    capShape: cleanText(raw?.capShape, 220),
    color: cleanText(raw?.color, 220),
    stem: cleanText(raw?.stem, 220),
    habitat: cleanText(raw?.habitat, 260),
    season: cleanText(raw?.season, 120),
    funFact: cleanText(raw?.funFact, 360),
  };
}

/** Tanıma yanıtının tamamını süzer. En fazla 3 aday, güvene göre sıralı. */
export function sanitizeResult(raw) {
  const list = Array.isArray(raw?.candidates) ? raw.candidates : [];
  const candidates = list
    .map(sanitizeCandidate)
    .filter((c) => c.latinName)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return {
    isMushroom: raw?.isMushroom !== false && candidates.length > 0,
    photoTip: cleanText(raw?.photoTip, 200),
    mock: raw?.mock === true,
    candidates,
  };
}

/** Ekranda gösterilecek ad: Türkçe ad yoksa Latince ad. */
export function displayName(item) {
  return item?.turkishName || item?.latinName || 'Bilinmeyen tür';
}
