/*
  OYUNLAŞTIRMA TANIMLARI — puanlar, seviyeler ve rozetler.
  Kuralların mantığı 4. aşamada eklenecek; burada sadece "ne var" listesi duruyor.
*/

export const RARITY = {
  common: { key: 'common', label: 'Yaygın', points: 10 },
  rare: { key: 'rare', label: 'Nadir', points: 25 },
  veryRare: { key: 'veryRare', label: 'Çok Nadir', points: 50 },
};

/** Aynı türü tekrar bulunca kazanılan küçük bonus */
export const REPEAT_BONUS = 2;

/** Seviyeler: minPoints puana ulaşınca o unvan açılır */
export const LEVELS = [
  { key: 'caylak', title: 'Çaylak Toplayıcı', minPoints: 0 },
  { key: 'gezgin', title: 'Orman Gezgini', minPoints: 60 },
  { key: 'merakli', title: 'Mantar Meraklısı', minPoints: 180 },
  { key: 'arastirmaci', title: 'Saha Araştırmacısı', minPoints: 450 },
  { key: 'mikolog', title: 'Usta Mikolog', minPoints: 1000 },
];

/** Rozetler (icon: ui/Icon.jsx içindeki ikon adı) */
export const BADGES = [
  { key: 'ilk-mantar', title: 'İlk Mantarım', description: 'Kitabına ilk türü ekledin.', icon: 'mushroom' },
  { key: 'tur-5', title: '5 Tür', description: '5 farklı tür keşfettin.', icon: 'leaf' },
  { key: 'tur-10', title: '10 Tür', description: '10 farklı tür keşfettin.', icon: 'leaf' },
  { key: 'tur-25', title: '25 Tür', description: '25 farklı tür keşfettin.', icon: 'leaf' },
  { key: 'sonbahar', title: 'Sonbahar Kâşifi', description: 'Bir sonbaharda 10 tür buldun.', icon: 'autumn' },
  { key: 'ayni-gun-5', title: 'Verimli Gün', description: 'Aynı gün 5 farklı tür buldun.', icon: 'sun' },
  { key: 'yagmur', title: 'Yağmur Sonrası Avcısı', description: 'Yağmurlu bir günde bir tür kaydettin.', icon: 'rain' },
  { key: 'cok-nadir', title: 'Gözü Keskin', description: 'İlk "Çok Nadir" türünü buldun.', icon: 'sparkle' },
  { key: 'gezi-5', title: 'Patika Dostu', description: '5 gezi tamamladın.', icon: 'trail' },
  { key: 'sadik', title: 'Eski Tanıdık', description: 'Aynı türü 5 kez gördün.', icon: 'eye' },
];

/** Puana göre mevcut seviyeyi ve bir sonrakine ilerlemeyi döndürür. */
export function levelFor(points) {
  let index = 0;
  LEVELS.forEach((lvl, i) => {
    if (points >= lvl.minPoints) index = i;
  });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next
    ? (points - current.minPoints) / (next.minPoints - current.minPoints)
    : 1;
  return { current, next, index, progress: Math.max(0, Math.min(1, progress)) };
}
