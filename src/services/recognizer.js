/*
  TANIYICI ADAPTÖRÜ — Uygulamanın geri kalanı tür tanımayı sadece bu dosya üzerinden yapar.
  Servisi değiştirmek istersek (ör. Kindwise mushroom.id) sadece sunucudaki kodu
  değiştirmemiz yeterli; bu dosyanın döndürdüğü biçim aynı kalır.

  Adres: /api/identify
  - Geliştirirken telefon bu isteği otomatik olarak bilgisayardaki Expo sunucusuna yollar
    (src/app/api/identify+api.js). API anahtarı orada, bilgisayarda kalır.
  - Yayında (6. aşama) app.json'daki "origin" adresine gider.

  Döndürülen sonuç:
  {
    isMushroom: true,
    photoTip: '...',
    mock: false,                // deneme modunda true
    candidates: [ { latinName, turkishName, confidence, rarity,
                    capShape, color, stem, habitat, season, funFact } ]
  }
*/
import NetInfo from '@react-native-community/netinfo';
import { sanitizeResult } from './safety.js';
import { photoBase64 } from './photos';

/** İnternet yok ya da sunucuya ulaşılamadı → fotoğraf bekleyenlere düşmeli */
export class OfflineError extends Error {
  constructor() {
    super('İnternet bağlantısı yok.');
    this.name = 'OfflineError';
  }
}

/** Sunucu bir hata döndürdü (anahtar yok, servis reddetti vb.) */
export class RecognitionError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RecognitionError';
    this.code = code;
  }
}

const ENDPOINT = '/api/identify';
const TIMEOUT_MS = 90_000;

/** Telefon internete bağlı mı? (bilinmiyorsa "evet" sayılır, istek kendisi karar verir) */
export async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected !== false && state.isInternetReachable !== false;
  } catch {
    return true;
  }
}

/** @param {object} photo  photos tablosundaki kayıt */
export async function identify(photo) {
  if (!(await isOnline())) throw new OfflineError();

  const image = await photoBase64(photo);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mediaType: 'image/jpeg' }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new RecognitionError('Tanıma çok uzun sürdü. Lütfen tekrar dene.', 'timeout');
    }
    throw new OfflineError(); // ağ hatası
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new RecognitionError(data.error || 'Tanıma sırasında bir sorun oluştu.', data.code);
  }

  // Sunucu zaten süzdü; telefonda bir kez daha süzüyoruz (iki kat koruma).
  return { ...sanitizeResult(data), mock: data.mock === true };
}
