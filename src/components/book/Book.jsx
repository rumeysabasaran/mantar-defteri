/*
  KİTAP — Sayfa çevirme motoru

  Nasıl çalışır?
  - Her sayfa, sol kenarından menteşeli bir kâğıt yaprağıdır.
  - Okunmuş sayfalar -180° dönmüş (sola çevrilmiş), okunmamışlar düz (0°) durur.
  - İleri çevirirken mevcut sayfa 0° → -180° döner, altındaki sonraki sayfa görünür.
  - Geri çevirirken önceki sayfa -180° → 0° döner ve mevcut sayfanın üstüne kapanır.

  Kontroller:
  - Parmakla yatay kaydırma (sayfa parmağı takip eder; yarı yoldan bırakınca tamamlanır)
  - Sağ / sol kenara dokunma
  - Klavye okları ve dışarıdan next() / prev() çağrısı

  Sadece mevcut sayfa ve iki komşusu çizilir; böylece yüzlerce tür olsa da hızlı kalır.
*/
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './Book.css';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [data-no-flip]';

const Book = forwardRef(function Book({ pages, index, onIndexChange, keyboard = true }, ref) {
  const [flip, setFlip] = useState(null); // { dir: 'next'|'prev', p: 0..1, dragging: bool }
  const bookRef = useRef(null);
  const gesture = useRef(null);
  const timer = useRef(null);
  const state = useRef({});
  state.current = { flip, index, pages, onIndexChange };

  const canGo = useCallback((dir) => {
    const { index: i, pages: list } = state.current;
    return dir === 'next' ? i < list.length - 1 : i > 0;
  }, []);

  /** Animasyon bitti: sayfa tamamen döndüyse yeni sayfaya geç */
  const finish = useCallback(() => {
    clearTimeout(timer.current);
    const { flip: f, index: i, onIndexChange: change } = state.current;
    if (!f || f.dragging) return;
    if (f.p >= 1) change(i + (f.dir === 'next' ? 1 : -1));
    setFlip(null);
  }, []);

  /** Yaprağı hedef konuma (0 = geri bırak, 1 = tamamla) yumuşakça götür */
  const settle = useCallback(
    (dir, target) => {
      setFlip({ dir, p: target, dragging: false });
      clearTimeout(timer.current);
      timer.current = setTimeout(finish, 750); // geçiş olayı gelmezse yedek
    },
    [finish]
  );

  /** Düğme, kenar dokunuşu veya klavye ile tam sayfa çevir */
  const start = useCallback(
    (dir) => {
      if (state.current.flip || !canGo(dir)) return;
      setFlip({ dir, p: 0, dragging: true });
      // İki kare bekle ki tarayıcı başlangıç konumunu çizsin, sonra animasyon başlasın
      requestAnimationFrame(() => requestAnimationFrame(() => settle(dir, 1)));
    },
    [canGo, settle]
  );

  useImperativeHandle(ref, () => ({ next: () => start('next'), prev: () => start('prev') }), [start]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Klavye okları
  useEffect(() => {
    if (!keyboard) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === 'ArrowRight') start('next');
      if (e.key === 'ArrowLeft') start('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, start]);

  // ---------- Parmak / fare hareketi ----------

  function onPointerDown(e) {
    if (e.button !== 0 || (state.current.flip && !state.current.flip.dragging)) return;
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      mode: null, // null: henüz belli değil | 'flip' | 'scroll' | 'blocked'
      width: bookRef.current.clientWidth,
    };
  }

  function onPointerMove(e) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (!g.mode) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        const dir = dx < 0 ? 'next' : 'prev';
        if (!canGo(dir)) {
          g.mode = 'blocked';
          return;
        }
        g.mode = 'flip';
        g.dir = dir;
        bookRef.current.setPointerCapture?.(e.pointerId);
      } else if (Math.abs(dy) > 10) {
        g.mode = 'scroll'; // dikey kaydırma: sayfa içeriği kayar, çevirme yok
        return;
      } else {
        return;
      }
    }
    if (g.mode !== 'flip') return;

    const p = clamp(g.dir === 'next' ? -dx / g.width : dx / g.width, 0, 1);
    setFlip({ dir: g.dir, p, dragging: true });
  }

  function onPointerUp(e) {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.mode === 'flip') {
      const p = state.current.flip?.p ?? 0;
      const velocity = (g.dir === 'next' ? -dx : dx) / Math.max(1, performance.now() - g.t); // px/ms
      const complete = p > 0.35 || velocity > 0.6;
      settle(g.dir, complete ? 1 : 0);
      if ((complete && p >= 1) || (!complete && p <= 0)) finish(); // hareket yoksa geçiş olayı da gelmez
      return;
    }

    // Kısa dokunuş: sağ kenar ileri, sol kenar geri
    if (!g.mode && Math.abs(dx) < 6 && Math.abs(dy) < 6 && !e.target.closest(INTERACTIVE)) {
      const rect = bookRef.current.getBoundingClientRect();
      const rx = (e.clientX - rect.left) / rect.width;
      if (rx > 0.8) start('next');
      else if (rx < 0.2) start('prev');
    }
  }

  function onPointerCancel() {
    const g = gesture.current;
    gesture.current = null;
    if (g?.mode === 'flip') settle(g.dir, 0);
  }

  // ---------- Her yaprağın açısı ve görünümü ----------

  function leafState(i) {
    let angle = i < index ? -180 : 0;
    let shade = 0;
    let z = 0;
    let visible = i === index || i === index + 1;

    if (i === index) z = 2;
    if (i === index + 1) z = 1;

    if (flip?.dir === 'next') {
      if (i === index) { angle = -180 * flip.p; z = 3; shade = flip.p; }
      if (i === index + 1) shade = 1 - flip.p;
    }
    if (flip?.dir === 'prev') {
      if (i === index - 1) { angle = -180 * (1 - flip.p); z = 3; visible = true; shade = 1 - flip.p; }
      if (i === index) shade = flip.p;
    }
    return { angle, shade, z, visible };
  }

  const remaining = pages.length - 1 - index;

  return (
    <div
      ref={bookRef}
      className="book"
      style={{ '--edge': `${Math.min(12, 2 + remaining * 0.8)}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="book__stack" aria-hidden="true" />
      {pages.map((page, i) => {
        if (i < index - 1 || i > index + 1) return null; // sadece komşular çizilir
        const { angle, shade, z, visible } = leafState(i);
        const isLeaf = z === 3;
        return (
          <Leaf
            key={page.key}
            angle={angle}
            flat={!flip && angle === 0}
            shade={shade}
            z={z}
            visible={visible}
            current={i === index && !flip}
            animate={isLeaf && !flip.dragging}
            backClass={page.backClass}
            onTransitionEnd={isLeaf ? finish : undefined}
          >
            {page.node}
          </Leaf>
        );
      })}
    </div>
  );
});

export default Book;

/** Tek bir yaprak: ön yüzünde sayfa, arka yüzünde kâğıdın tersi */
function Leaf({ angle, flat, shade, z, visible, current, animate, backClass = '', onTransitionEnd, children }) {
  const ref = useRef(null);

  // Görünmeyen sayfalar klavye ve ekran okuyucu için devre dışı
  useEffect(() => {
    if (!ref.current) return;
    if (current) ref.current.removeAttribute('inert');
    else ref.current.setAttribute('inert', '');
  }, [current]);

  return (
    <div
      ref={ref}
      // Dururken düz kutu (3B yok): tarayıcılar 3B kutularda içerik kaydırmayı bozabiliyor
      className={`book__leaf${animate ? ' is-animating' : ''}${flat ? ' is-flat' : ''}`}
      style={{
        transform: flat ? 'none' : `rotateY(${angle}deg)`,
        zIndex: z,
        visibility: visible ? 'visible' : 'hidden',
        '--shade': shade,
      }}
      aria-hidden={!current}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === 'transform') onTransitionEnd?.();
      }}
    >
      <div className="book__face book__face--front">
        {children}
        <div className="book__shade" aria-hidden="true" />
      </div>
      <div className={`book__face book__face--back ${backClass}`} aria-hidden="true" />
    </div>
  );
}
