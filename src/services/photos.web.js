/*
  FOTOĞRAFLAR (web önizlemesi) — photos.js ile aynı işler, tarayıcıda.
  Tarayıcıda dosya klasörü olmadığı için küçültülmüş fotoğraflar veritabanına
  metin (data adresi) olarak yazılır. Sadece bilgisayarda geliştirirken kullanılır.
*/
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

async function resized(uri, width, height, maxSide, compress) {
  const context = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > maxSide) {
    const scale = maxSide / Math.max(width, height);
    context.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
  return `data:image/jpeg;base64,${result.base64}`;
}

export async function storePhotoFiles(asset) {
  try {
    return {
      full: await resized(asset.uri, asset.width, asset.height, 1280, 0.85),
      thumb: await resized(asset.uri, asset.width, asset.height, 360, 0.75),
    };
  } catch (err) {
    console.warn('[photos] kaydedilemedi', err);
    throw new Error('Fotoğraf hazırlanamadı. Başka bir fotoğraf dener misin?');
  }
}

export function photoUri(photo, variant = 'thumb') {
  return photo?.[variant] ?? null;
}

export async function photoBase64(photo) {
  return String(photo.full).split(',')[1] ?? '';
}

export function deletePhotoFiles() {
  /* veritabanı kaydıyla birlikte silinir */
}
