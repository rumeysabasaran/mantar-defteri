/*
  BEKLEYENLER KUYRUĞU
  İnternet yokken çekilen fotoğraflar buraya düşer. Bağlantı gelince (veya uygulama
  açılınca / öne gelince) sırayla tanınır ve "hazır" olarak işaretlenir.
  Kullanıcı sonra Bekleyenler ekranından türü seçip deftere kaydeder.

  Durumlar: waiting (bekliyor) → processing (tanınıyor) → ready (hazır) | error (hata)
*/
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { tables, withMeta } from '../data/db.js';
import { identify, OfflineError, isOnline } from './recognizer.js';
import { deletePhoto } from './collection.js';

const { pending: Pending, photos: Photos } = tables;
let running = false;

export async function addPending(photoId, reason = 'offline') {
  const item = withMeta({ photoId, status: 'waiting', reason, result: null, errorMessage: '' });
  await Pending.put(item);
  processPending(); // bağlantı varsa hemen dene
  return item.id;
}

/** Bekleyen her fotoğrafı sırayla tanımaya çalışır. Aynı anda tek kez çalışır. */
export async function processPending() {
  if (running) return;
  running = true;
  try {
    if (!(await isOnline())) return;
    const items = await Pending.all({ orderBy: 'createdAt' });
    for (const item of items) {
      if (item.status !== 'waiting') continue;

      const photo = await Photos.get(item.photoId);
      if (!photo) {
        await Pending.delete(item.id); // fotoğraf silinmiş
        continue;
      }

      await Pending.update(item.id, { status: 'processing', updatedAt: Date.now() });
      try {
        const result = await identify(photo);
        await Pending.update(item.id, { status: 'ready', result, errorMessage: '', updatedAt: Date.now() });
      } catch (err) {
        if (err instanceof OfflineError) {
          await Pending.update(item.id, { status: 'waiting', updatedAt: Date.now() });
          break; // bağlantı yine gitti; kalanları sonra dene
        }
        await Pending.update(item.id, { status: 'error', errorMessage: err.message, updatedAt: Date.now() });
      }
    }
  } catch (err) {
    console.warn('[pending]', err);
  } finally {
    running = false;
  }
}

/** Hatalı bir kaydı tekrar sıraya koyar. */
export async function retryPending(id) {
  await Pending.update(id, { status: 'waiting', errorMessage: '', updatedAt: Date.now() });
  return processPending();
}

/** Bekleyen kaydı siler. keepPhoto: fotoğraf deftere kaydedildiyse silme. */
export async function removePending(id, { keepPhoto = false } = {}) {
  const item = await Pending.get(id);
  await Pending.delete(id);
  if (item && !keepPhoto) await deletePhoto(item.photoId);
}

/** Uygulama açılınca bir kez çağrılır: yarım kalanları düzeltir, bağlantıyı dinler. */
export async function startPendingWatcher() {
  // Uygulama "tanınıyor" sırasında kapandıysa bunları tekrar sıraya al
  const stuck = (await Pending.all()).filter((p) => p.status === 'processing');
  for (const p of stuck) await Pending.update(p.id, { status: 'waiting' });

  let wasOnline = true;
  const netSub = NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    if (online && !wasOnline) processPending();
    wasOnline = online;
  });
  const appSub = AppState.addEventListener('change', (s) => s === 'active' && processPending());

  processPending();
  return () => {
    netSub();
    appSub.remove();
  };
}
