/*
  BEKLEYENLER KUYRUĞU
  İnternet yokken çekilen fotoğraflar buraya düşer. Bağlantı gelince
  (veya uygulama açılınca) sırayla tanınır ve "hazır" olarak işaretlenir.
  Kullanıcı sonra Bekleyenler ekranından türü seçip deftere kaydeder.

  Durumlar: waiting (bekliyor) → processing (tanınıyor) → ready (hazır) | error (hata)
*/
import { db, withMeta } from '../data/db.js';
import { identify, OfflineError } from './recognizer.js';
import { deletePhoto } from './collection.js';

let running = false;

export async function addPending(photoId, reason = 'offline') {
  const item = withMeta({ photoId, status: 'waiting', reason, result: null, errorMessage: '' });
  await db.pending.add(item);
  processPending(); // bağlantı varsa hemen dene
  return item.id;
}

/** Bekleyen her fotoğrafı sırayla tanımaya çalışır. Aynı anda tek kez çalışır. */
export async function processPending() {
  if (running || navigator.onLine === false) return;
  running = true;
  try {
    const items = await db.pending.orderBy('createdAt').toArray();
    for (const item of items) {
      if (item.status !== 'waiting') continue;

      const photo = await db.photos.get(item.photoId);
      if (!photo) {
        await db.pending.delete(item.id); // fotoğraf silinmiş
        continue;
      }

      await db.pending.update(item.id, { status: 'processing', updatedAt: Date.now() });
      try {
        const result = await identify(photo.full);
        await db.pending.update(item.id, { status: 'ready', result, errorMessage: '', updatedAt: Date.now() });
      } catch (err) {
        if (err instanceof OfflineError) {
          await db.pending.update(item.id, { status: 'waiting', updatedAt: Date.now() });
          break; // bağlantı yine gitti; kalanları sonra dene
        }
        await db.pending.update(item.id, { status: 'error', errorMessage: err.message, updatedAt: Date.now() });
      }
    }
  } finally {
    running = false;
  }
}

/** Hatalı bir kaydı tekrar sıraya koyar. */
export async function retryPending(id) {
  await db.pending.update(id, { status: 'waiting', errorMessage: '', updatedAt: Date.now() });
  return processPending();
}

/** Bekleyen kaydı siler. keepPhoto: fotoğraf deftere kaydedildiyse silme. */
export async function removePending(id, { keepPhoto = false } = {}) {
  const item = await db.pending.get(id);
  await db.pending.delete(id);
  if (item && !keepPhoto) await deletePhoto(item.photoId);
}

/** Uygulama açılınca bir kez çağrılır: yarım kalanları düzeltir, bağlantıyı dinler. */
export async function startPendingWatcher() {
  // Uygulama "tanınıyor" sırasında kapandıysa bunları tekrar sıraya al
  await db.pending.filter((p) => p.status === 'processing').modify({ status: 'waiting' });
  window.addEventListener('online', () => processPending());
  processPending();
}
