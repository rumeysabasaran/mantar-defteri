/*
  YEREL VERİTABANI (IndexedDB, Dexie ile)

  Tüm veriler telefonun içinde saklanır; internet gerekmez.
  Her kayıtta benzersiz bir `id` ve `updatedAt` (son değişiklik zamanı) bulunur.
  Bu ikisi, ileride bulut senkronu eklemek istediğimizde hangi kaydın
  daha yeni olduğunu anlamamızı sağlar.

  Tablo tanımlarındaki virgüllü listeler "hızlı arama yapılacak alanlar"dır;
  kayıtlarda bunların dışında istediğimiz kadar alan tutabiliriz.
*/
import Dexie from 'dexie';

export const db = new Dexie('mantar-defteri');

db.version(1).stores({
  // Kitaptaki tür sayfaları. speciesKey = Latince adın küçük harfli hali (tekrarı önler)
  species: 'id, &speciesKey, firstFoundAt, updatedAt',
  // Her bir buluş. speciesId boşsa "taslak" (emin değilim) kaydıdır
  sightings: 'id, speciesId, tripId, foundAt, status, updatedAt',
  // Fotoğraflar (asıl dosya + küçük önizleme)
  photos: 'id, sightingId, createdAt',
  // Geziler
  trips: 'id, startedAt, endedAt, updatedAt',
  // İnternet yokken tanınmayı bekleyen fotoğraflar
  pending: 'id, createdAt',
  // Puan hareketleri; toplam puan bunların toplamıdır
  points: 'id, createdAt, tripId, sightingId',
  // Kazanılan rozetler. id = rozet anahtarı (ör. "ilk-mantar")
  badges: 'id, earnedAt',
});

/**
 * Yeni benzersiz kimlik üretir.
 * Bazı tarayıcılar (ör. telefondan http ile açınca) crypto.randomUUID sunmaz;
 * o durumda basit bir yedek yöntem kullanılır.
 */
export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Yeni bir kayda ortak alanları (id, zamanlar) ekler. */
export function withMeta(record) {
  const now = Date.now();
  return { id: newId(), createdAt: now, updatedAt: now, ...record };
}
