/*
  KİTAP — Sayfa çevirme motoru

  Nasıl çalışır?
  - Her sayfa, sol kenarından menteşeli bir kâğıt yapraktır.
  - Kitabın "konumu" (position) tek bir sayıdır: 3 → 3. sayfa açık; 3.4 → 3. sayfa %40 çevrilmiş.
    Her yaprağın açısı bu sayıdan hesaplanır: konumu geçmiş yapraklar sola çevrilmiş (-180°),
    gelmemişler düz (0°), arada olan yaprak ise yarı yolda durur.
  - Animasyon ve parmak takibi telefonun arayüz iş parçacığında çalışır; bu yüzden akıcıdır.

  Kontroller:
  - Parmakla yatay kaydırma (sayfa parmağı takip eder; yarı yoldan bırakınca tamamlanır)
  - Dışarıdan ref ile: next(), prev(), jumpTo(i), flipTo(i)

  Sadece mevcut sayfa ve iki komşusu çizilir; böylece yüzlerce tür olsa da hızlı kalır.
*/
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { PaperTexture } from '../ui/Paper';
import { PageEdges } from './BookCover';
import { colors } from '../../theme';

const FLIP_MS = 520;
const FLIP_EASE = Easing.bezier(0.3, 0.7, 0.25, 1);

const Book = forwardRef(function Book({ pages, index, onIndexChange }, ref) {
  const position = useSharedValue(index);
  const width = useSharedValue(Dimensions.get('window').width - 40); // ölçülene kadar yaklaşık değer
  const last = useSharedValue(pages.length - 1);
  const busy = useSharedValue(false); // animasyon sürüyor mu
  const indexRef = useRef(index);

  useEffect(() => {
    last.value = pages.length - 1;
  }, [pages.length, last]);

  // Dışarıdan dizin değiştiyse (ör. İçindekiler'den atlama) konumu oraya taşı
  useEffect(() => {
    if (indexRef.current !== index) {
      indexRef.current = index;
      if (!busy.value) position.value = index;
    }
  }, [index, position, busy]);

  const commit = useCallback(
    (i) => {
      indexRef.current = i;
      onIndexChange(i);
    },
    [onIndexChange]
  );

  const haptic = useCallback(() => Haptics.selectionAsync().catch(() => {}), []);

  /** Konumu hedefe yumuşakça götürür, bitince yeni sayfayı bildirir */
  const animateTo = useCallback(
    (target) => {
      'worklet';
      busy.value = true;
      position.value = withTiming(target, { duration: FLIP_MS, easing: FLIP_EASE }, (finished) => {
        busy.value = false;
        if (finished) scheduleOnRN(commit, Math.round(target));
      });
    },
    [busy, position, commit]
  );

  const flipBy = useCallback(
    (step) => {
      const from = indexRef.current;
      const target = from + step;
      if (busy.value || target < 0 || target > pages.length - 1) return;
      haptic();
      animateTo(target);
    },
    [animateTo, busy, haptic, pages.length]
  );

  useImperativeHandle(
    ref,
    () => ({
      next: () => flipBy(1),
      prev: () => flipBy(-1),
      /** Animasyonsuz atla */
      jumpTo: (i) => {
        position.value = i;
        commit(i);
      },
      /** Hedefin bir önceki sayfasına atla, sonra hedefe çevir (ör. yeni kayıttan sonra) */
      flipTo: (i) => {
        if (i <= 0) return;
        position.value = i - 1;
        commit(i - 1);
        setTimeout(() => flipBy(1), 450);
      },
    }),
    [flipBy, position, commit]
  );

  // ---------- Parmak hareketi ----------
  const start = useSharedValue(0);
  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-14, 14], // dikey hareket: sayfa içeriği kayar, çevirme yok
    onActivate: () => {
      'worklet';
      start.value = Math.round(position.value);
    },
    onUpdate: (e) => {
      'worklet';
      if (busy.value) return;
      const delta = -e.translationX / Math.max(1, width.value); // sola çekmek = ileri
      const clamped = Math.max(-1, Math.min(1, delta));
      const target = Math.max(0, Math.min(last.value, start.value + clamped));
      position.value = target;
    },
    onDeactivate: (e) => {
      'worklet';
      if (busy.value) return;
      const moved = position.value - start.value; // -1 … 1
      const dir = moved > 0 ? 1 : moved < 0 ? -1 : 0;
      if (dir === 0) return;
      const fast = Math.abs(e.velocityX) > 600 && Math.sign(-e.velocityX) === dir;
      const complete = Math.abs(moved) > 0.35 || fast;
      if (complete) scheduleOnRN(haptic);
      animateTo(complete ? start.value + dir : start.value);
    },
  });

  // Kalan sayfa yığını: kitap ilerledikçe incelir
  const remaining = pages.length - 1 - index;
  const edge = Math.min(12, 2 + remaining * 0.8);

  return (
    // Genişlik ölçümü dıştaki kutuda yapılır; parmak hareketi katmanı içteki kutuyu sarar.
    // (iPhone'da hareket katmanının içindeki kutunun ölçüsü bildirilmeyebiliyor.)
    <View
      style={[styles.book, { marginRight: edge }]}
      onLayout={(e) => {
        width.value = e.nativeEvent.layout.width;
      }}
    >
      <PageEdges style={[styles.stack, { right: -edge, width: edge + 10 }]} />
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill}>
          {/*
            Sadece mevcut sayfa ve komşuları çizilir, TERS sırayla: sonra çizilen üstte durur,
            böylece önceki sayfa hep sonrakinin üstündedir (gerçek bir kitaptaki gibi).
            Bu sıralama zIndex'e gerek bırakmaz; zIndex iPhone'da animasyonla güvenilir değişmiyor.
          */}
          {pages
            .map((page, i) => ({ page, i }))
            .filter(({ i }) => i >= index - 1 && i <= index + 1)
            .reverse()
            .map(({ page, i }) => (
              <Leaf key={page.key} i={i} position={position} current={i === index} backVariant={page.backVariant}>
                {page.node}
              </Leaf>
            ))}
        </View>
      </GestureDetector>
    </View>
  );
});

export default Book;

/** Tek bir yaprak: ön yüzünde sayfa, çevrilirken arka yüzünde kâğıdın tersi */
function Leaf({ i, position, current, backVariant, children }) {
  const leafStyle = useAnimatedStyle(() => {
    const p = position.value;
    const f = Math.max(0, Math.min(1, p - i)); // bu yaprak ne kadar çevrildi (0…1)
    const visible = f < 1 && i <= Math.floor(p) + 1;
    return {
      transform: [{ perspective: 2000 }, { rotateY: `${-180 * f}deg` }],
      opacity: visible ? 1 : 0,
    };
  });

  // Çevrilirken sayfa kararır; altındaki sayfa ise yavaşça aydınlanır
  const shadeStyle = useAnimatedStyle(() => {
    const p = position.value;
    const f = Math.max(0, Math.min(1, p - i));
    const frac = p - Math.floor(p);
    let shade = 0;
    if (f > 0 && f < 1) shade = f;
    else if (i === Math.floor(p) + 1 && frac > 0) shade = 1 - frac;
    return { opacity: shade * 0.9 };
  });

  // Yarıdan sonra kâğıdın arkası görünür
  const backStyle = useAnimatedStyle(() => {
    const f = Math.max(0, Math.min(1, position.value - i));
    return { opacity: f > 0.5 ? 1 : 0 };
  });

  return (
    <Animated.View
      style={[styles.leaf, leafStyle]}
      pointerEvents={current ? 'auto' : 'none'}
      {...(Platform.OS === 'web'
        ? { 'aria-hidden': !current }
        : { accessibilityElementsHidden: !current, importantForAccessibility: current ? 'auto' : 'no-hide-descendants' })}
    >
      <View style={styles.face}>
        <PaperTexture />
        {children}
        {/* cilt gölgesi */}
        <LinearGradient
          colors={['rgba(70,50,20,0.14)', 'rgba(70,50,20,0)']}
          locations={[0, 0.04]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Animated.View style={[StyleSheet.absoluteFill, shadeStyle]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(40,30,10,0.28)', 'rgba(40,30,10,0.08)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.face, styles.back, backVariant === 'endpaper' && styles.endpaper, backStyle]} pointerEvents="none">
        <PaperTexture />
        {backVariant === 'endpaper' && <Endpaper />}
        <LinearGradient
          colors={['rgba(70,50,20,0)', 'rgba(70,50,20,0.16)']}
          locations={[0.7, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

/** Kapağın arka yüzü: kitap açılınca görünen, noktalı süslü iç kapak kâğıdı */
function Endpaper() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id="endpaper" width={22} height={48} patternUnits="userSpaceOnUse">
          <Circle cx={6} cy={8} r={2} fill="rgba(46,74,51,0.1)" />
          <Circle cx={17} cy={32} r={2} fill="rgba(46,74,51,0.1)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#endpaper)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  book: { flex: 1, minHeight: 0 },
  // Sağ kenarda görünen kalan sayfa yığını
  stack: {
    top: 6,
    bottom: 6,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#46321a',
    shadowOpacity: 0.15,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
  },
  // Not: React Native 0.88'de StyleSheet.absoluteFillObject kaldırıldı; absoluteFill kullanılır.
  leaf: { ...StyleSheet.absoluteFill, transformOrigin: 'left center' },
  face: {
    ...StyleSheet.absoluteFill,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.paper,
  },
  back: { backgroundColor: colors.paper },
  endpaper: { backgroundColor: '#e9dfc6' },
});
