/*
  TEMA — Uygulamanın tüm renkleri, yazı tipleri ve ölçüleri burada.
  Bir rengi değiştirmek istersen sadece bu dosyayı düzenlemen yeterli.
  (Web sürümündeki theme.css'in birebir karşılığı.)
*/
import { Platform } from 'react-native';

export const colors = {
  // Ana renkler
  cream: '#f4eddc', // zemin
  paper: '#faf5e8', // kâğıt kartlar, kitap sayfaları
  paperEdge: '#e6dabf', // kâğıt kenarı, ince çizgiler
  paperWhite: '#fffdf6', // polaroid, form kutuları
  forest: '#2e4a33', // koyu yosun yeşili: başlık, buton, kapak
  forestDeep: '#1e3322', // daha koyu yeşil: basılı buton
  moss: '#6b8459', // açık yosun: ikincil vurgu

  // Tamamlayıcı renkler (az kullan, sadece vurgu)
  earth: '#7b5634', // toprak kahvesi
  mustard: '#d2a03a', // sıcak hardal sarısı
  mustardSoft: '#f0dfb4',

  // Yazı renkleri
  ink: '#2a2822',
  inkSoft: '#625d50',
  inkFaint: '#9a927f',
  line: 'rgba(46, 74, 51, 0.16)',
};

/*
  Yazı tipleri: telefonda her kalınlık ayrı bir yazı tipi dosyasıdır.
  Bu yüzden "fontWeight" yerine doğru dosyanın adını kullanıyoruz.
*/
export const fonts = {
  serif: 'CormorantGaramond_600SemiBold',
  serifMedium: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  serifBoldItalic: 'CormorantGaramond_600SemiBold_Italic',
  sans: 'Nunito_400Regular',
  sansItalic: 'Nunito_400Regular_Italic',
  sansBold: 'Nunito_700Bold',
  sansHeavy: 'Nunito_800ExtraBold',
};

export const space = {
  gutter: 18,
  gap: 18,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const layout = {
  navHeight: 66,
  maxWidth: 560,
};

/** Gölgeler: kâğıdın masadan hafifçe kalkmış hali */
export const shadows = {
  paper: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(70,50,20,0.07), 0 6px 18px rgba(70,50,20,0.09)' },
    default: {
      shadowColor: '#46321a',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  }),
  lift: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(30,51,34,0.18), 0 10px 24px rgba(30,51,34,0.22)' },
    default: {
      shadowColor: '#1e3322',
      shadowOpacity: 0.28,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
  }),
};

/** Animasyon süreleri (ms): yumuşak ve ölçülü */
export const motion = {
  fast: 140,
  base: 280,
  flip: 520,
};

/** Kâğıt dokusu (assets/paper-noise.png): kartların ve zeminin üstüne döşenir */
export const paperNoise = require('../assets/paper-noise.png');
