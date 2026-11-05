/*
  FOTOĞRAFLAR (telefon) — küçültme, kaydetme, silme.

  Telefon kameraları çok büyük fotoğraflar çeker (3–8 MB). Hem cihazda yer kaplamasın
  hem de tanıma servisine hızlı gitsin diye iki boyut kaydediyoruz:
  - full:  en uzun kenar 1280 px → tanıma ve kitap sayfası için
  - thumb: en uzun kenar 360 px  → listelerdeki küçük önizlemeler için

  Dosyalar uygulamanın kendi klasöründe (Documents/photos) durur. Veritabanına sadece
  dosya ADI yazılır, tam yolu değil: iPhone'da uygulama güncellenince klasörün yolu
  değişebiliyor, ad ise değişmez.

  Not: Web önizlemesi için aynı işleri yapan photos.web.js dosyası var.
*/
import { File, Directory, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const FULL_SIDE = 1280;
const THUMB_SIDE = 360;

function photosDir() {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** En uzun kenarı maxSide olacak şekilde küçültür (zaten küçükse dokunmaz) */
async function resized(uri, width, height, maxSide, compress) {
  const context = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > maxSide) {
    const scale = maxSide / Math.max(width, height);
    context.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress });
  return result.uri;
}

/**
 * Kameradan / galeriden gelen fotoğrafı iki boyutta kaydeder.
 * @param {{uri:string, width?:number, height?:number}} asset  expo-image-picker sonucu
 * @param {string} id  fotoğraf kaydının kimliği (dosya adında kullanılır)
 * @returns {{ full: string, thumb: string }} dosya adları
 */
export async function storePhotoFiles(asset, id) {
  try {
    const dir = photosDir();
    const fullTemp = await resized(asset.uri, asset.width, asset.height, FULL_SIDE, 0.85);
    const thumbTemp = await resized(asset.uri, asset.width, asset.height, THUMB_SIDE, 0.75);

    const full = `${id}-full.jpg`;
    const thumb = `${id}-thumb.jpg`;
    await new File(fullTemp).move(new File(dir, full), { overwrite: true });
    await new File(thumbTemp).move(new File(dir, thumb), { overwrite: true });
    return { full, thumb };
  } catch (err) {
    console.warn('[photos] kaydedilemedi', err);
    throw new Error('Fotoğraf hazırlanamadı. Başka bir fotoğraf dener misin?');
  }
}

/** Fotoğraf kaydından ekranda gösterilebilir adres. variant: 'full' | 'thumb' */
export function photoUri(photo, variant = 'thumb') {
  const name = photo?.[variant];
  if (!name) return null;
  return new File(Paths.document, 'photos', name).uri;
}

/** Tanıma servisine göndermek için büyük fotoğrafın base64 metni */
export async function photoBase64(photo) {
  const file = new File(Paths.document, 'photos', photo.full);
  if (!file.exists) throw new Error('Fotoğraf dosyası bulunamadı.');
  return file.base64();
}

/** Fotoğrafın dosyalarını siler (yoksa sessizce geçer) */
export function deletePhotoFiles(photo) {
  for (const variant of ['full', 'thumb']) {
    if (!photo?.[variant]) continue;
    try {
      const file = new File(Paths.document, 'photos', photo[variant]);
      if (file.exists) file.delete();
    } catch (err) {
      console.warn('[photos] silinemedi', err);
    }
  }
}
