/*
  SAHA NOTU SEÇENEKLERİ
  Hava durumu anahtarları rozetlerde de kullanılacak (ör. "Yağmur Sonrası Avcısı").
*/
export const WEATHER = [
  { key: 'sunny', label: 'Güneşli' },
  { key: 'cloudy', label: 'Bulutlu' },
  { key: 'rainy', label: 'Yağmurlu' },
  { key: 'afterRain', label: 'Yağmur sonrası' },
  { key: 'foggy', label: 'Sisli' },
  { key: 'snowy', label: 'Karlı' },
];

export function weatherLabel(key) {
  return WEATHER.find((w) => w.key === key)?.label ?? '';
}

/** Bugünün tarihi "YYYY-AA-GG" biçiminde (tarih kutusu için) */
export function todayInputValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Tarih kutusundaki değeri zamana çevirir. Bugünse şimdiki saati kullanır. */
export function inputValueToTime(value) {
  if (!value || value === todayInputValue()) return Date.now();
  return new Date(`${value}T12:00:00`).getTime();
}

export function formatDate(time, withYear = true) {
  return new Date(time).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}
