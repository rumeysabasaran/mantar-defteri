/*
  FOTOĞRAF ARAÇLARI
  Telefon kameraları çok büyük fotoğraflar çeker (3–8 MB). Hem cihazda yer
  kaplamasın hem de tanıma servisine hızlı (ve ucuz) gitsin diye küçültüyoruz:
  - full:  en uzun kenar 1280 px  → tanıma ve kitap sayfası için
  - thumb: en uzun kenar 360 px   → listelerdeki küçük önizlemeler için
*/

export async function prepareImage(file) {
  const source = await loadImage(file);
  try {
    const full = await drawToBlob(source, 1280, 0.85);
    const thumb = await drawToBlob(source, 360, 0.75);
    return { full, thumb };
  } finally {
    source.close?.(); // ImageBitmap belleğini serbest bırak
  }
}

/** Dosyayı çizilebilir bir resme çevirir. Telefonun yön bilgisini (EXIF) dikkate alır. */
async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* bazı tarayıcılar desteklemez; aşağıdaki yönteme geç */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Fotoğraf açılamadı. Başka bir fotoğraf dener misin?'));
    };
    img.src = url;
  });
}

function drawToBlob(source, maxSide, quality) {
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(width, height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Fotoğraf hazırlanamadı.'))),
      'image/jpeg',
      quality
    );
  });
}

/** Blob → base64 metin (sunucuya göndermek için) */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Fotoğraf okunamadı.'));
    reader.readAsDataURL(blob);
  });
}
