/*
  DENEME TANIYICI — Sadece bilgisayarda, .env dosyasında API anahtarı YOKKEN kullanılır.
  Böylece anahtar almadan da bütün akışı (sonuçlar → seçim → kayıt → kutlama) deneyebilirsin.
  Gerçek bir tanıma yapmaz; her seferinde aynı üç türden rastgele sıralı bir sonuç döner.
*/
import { sanitizeResult } from '../src/services/safety.js';

const SAMPLES = [
  {
    latinName: 'Trametes versicolor',
    turkishName: 'Hindi kuyruğu mantarı',
    rarity: 'common',
    capShape: 'İnce, yelpaze biçimli raflar halinde üst üste dizilir.',
    color: 'Kahve, gri ve krem tonlarında halka halka renk bantları vardır.',
    stem: 'Sapı yoktur; doğrudan oduna tutunur.',
    habitat: 'Ölü yaprak döken ağaç gövdelerinde ve kütüklerde kümeler oluşturur.',
    season: 'Yıl boyu',
    funFact: 'Renkli halkaları yaban hindisinin kuyruk tüylerine benzediği için bu adı almıştır.',
  },
  {
    latinName: 'Fomes fomentarius',
    turkishName: 'Kav mantarı',
    rarity: 'common',
    capShape: 'At toynağı biçiminde, kalın ve sert bir yapısı vardır.',
    color: 'Gri ile koyu kahve arasında, katman katman tonlar görülür.',
    stem: 'Sapı yoktur; gövdeye yandan tutunur.',
    habitat: 'Kayın ve huş gibi ağaçların gövdelerinde yıllarca yaşar.',
    season: 'Yıl boyu',
    funFact: 'İçindeki keçemsi doku eskiden ateş yakmak için "kav" olarak kullanılırdı.',
  },
  {
    latinName: 'Ganoderma applanatum',
    turkishName: 'Ressam mantarı',
    rarity: 'rare',
    capShape: 'Geniş, yassı ve raf gibi yatay uzanır.',
    color: 'Üstü kahverengi, alt yüzeyi beyaz ve pürüzsüzdür.',
    stem: 'Sapı yoktur.',
    habitat: 'Yaşlı ve ölü yaprak döken ağaçların dibinde bulunur.',
    season: 'Yıl boyu',
    funFact: 'Beyaz alt yüzeyine çizilen çizgiler kalıcı olarak kahveye döner; bu yüzden üzerine resim yapılır.',
  },
];

export async function mockIdentify() {
  await new Promise((r) => setTimeout(r, 1200)); // gerçek bir istek gibi biraz beklet
  const shuffled = [...SAMPLES].sort(() => Math.random() - 0.5);
  const confidences = [55 + Math.round(Math.random() * 30), 15 + Math.round(Math.random() * 15), 5 + Math.round(Math.random() * 8)];
  const raw = {
    isMushroom: true,
    photoTip: '',
    candidates: shuffled.map((s, i) => ({ ...s, confidence: confidences[i] })),
  };
  return { status: 200, body: { ...sanitizeResult(raw), mock: true } };
}
