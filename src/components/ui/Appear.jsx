/*
  BELİRME ANİMASYONU — Bir parça ekrana ilk geldiğinde yumuşakça yerine oturur.
  "from" başlangıç halini verir; bitişte her şey doğal haline (0 / 1) döner.

  <Appear from={{ opacity: 0, translateY: 12, rotate: -6, scale: 0.96 }} duration={420}>
    ...
  </Appear>

  overshoot: true ise hedefi biraz geçip geri gelir (kitaba giren sayfa gibi).
*/
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const EASE = Easing.bezier(0.25, 0.8, 0.3, 1);

export default function Appear({ from = {}, duration = 420, delay = 0, overshoot = false, to = {}, style, children }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: overshoot ? Easing.out(Easing.back(1.6)) : EASE }));
  }, [t, delay, duration, overshoot]);

  const f = {
    opacity: from.opacity ?? 1,
    translateX: from.translateX ?? 0,
    translateY: from.translateY ?? 0,
    rotate: from.rotate ?? 0,
    scale: from.scale ?? 1,
  };
  const e = { opacity: to.opacity ?? 1, scale: to.scale ?? 1 };

  const animated = useAnimatedStyle(() => {
    const k = t.value;
    const lerp = (a, b) => a + (b - a) * k;
    return {
      opacity: Math.min(1, lerp(f.opacity, e.opacity)),
      transform: [
        { translateX: lerp(f.translateX, 0) },
        { translateY: lerp(f.translateY, 0) },
        { rotate: `${lerp(f.rotate, 0)}deg` },
        { scale: lerp(f.scale, e.scale) },
      ],
    };
  });

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** Fotoğraf hafifçe dönerek sayfaya "yapıştırılır" */
export const POLAROID_IN = { opacity: 0, translateY: 12, rotate: -6, scale: 0.96 };
