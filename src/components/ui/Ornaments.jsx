/*
  SÜSLEMELER — Eski doğa defterlerindeki ince el çizimi motifler.
  Hepsi SVG; renkleri içinde bulundukları yazı renginden (currentColor) alır.
*/

/**
 * Eğrelti otu dalı. Yapraklar bir eğri boyunca kodla yerleştirilir,
 * böylece her biri hafif farklı boyda, el çizimi gibi durur.
 */
export function FernSprig({ size = 90, className, flip = false }) {
  // Ana sap: alttan sağ üste kavisli bir çizgi
  const p0 = [10, 86], p1 = [30, 40], p2 = [82, 10];
  const point = (t) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1],
  ];
  const tangent = (t) => {
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy);
    return [dx / len, dy / len];
  };

  const leaves = [];
  for (let i = 1; i <= 9; i++) {
    const t = i / 10.5;
    const [x, y] = point(t);
    const [tx, ty] = tangent(t);
    const len = 15 * (1 - t * 0.7); // uca doğru küçülür
    [-1, 1].forEach((side) => {
      // Sapa dik yön + hafif ileri eğim
      const nx = -ty * side + tx * 0.55;
      const ny = tx * side + ty * 0.55;
      const ex = x + nx * len, ey = y + ny * len;
      const cx = x + nx * len * 0.5 + tx * 4, cy = y + ny * len * 0.5 + ty * 4;
      leaves.push(`M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
    });
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d={`M${p0}Q${p1} ${p2}`} strokeWidth="1.4" />
      {leaves.map((d, i) => (
        <path key={i} d={d} strokeWidth="1.1" />
      ))}
    </svg>
  );
}

/** Küçük bir mantar eskizi: boş ekranlarda ve kapakta kullanılır */
export function MushroomSketch({ size = 72, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* şapka */}
      <path d="M9.5 33.5C11 17.5 53 17 54.5 33.5c-8.8 3.4-36 3.6-45 0z" />
      {/* şapka altı lameller */}
      <path d="M17 35.5l1.5 2M24 36.4l1 2M40 36.4l-1 2M47 35.5l-1.5 2" strokeWidth="1" />
      {/* sap */}
      <path d="M26.5 36.6c-.4 7.5-1.6 13-3.6 17.6h18.2c-2-4.6-3.2-10.1-3.6-17.6" />
      {/* halka */}
      <path d="M26 42.5c3.6 1.6 8.4 1.6 12 0" strokeWidth="1.1" />
      {/* benekler */}
      <path d="M22 27.5c1.4-.6 2.6.2 2.2 1.4M33 23.8c1.6-.4 2.6.6 2 1.8M43 28.2c1.2-.4 2 .4 1.6 1.3" strokeWidth="1.1" />
      {/* çimen */}
      <path d="M12 56c2.5-.6 5-.4 7 .2M44 56c3-.7 6-.5 8.5.3M18 56l-1.5-4M48 56l1.2-3.6" strokeWidth="1.1" />
    </svg>
  );
}

/** Köşe süslemesi: kıvrık bir sarmaşık */
export function CornerFlourish({ size = 46, className, rotate = 0 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M3 45C3 22 20 4 45 3" />
      <path d="M8 30c-5-1.5-5-8 .5-7.5 3.4.4 3 4.6-.2 4.2" />
      <path d="M20 12.5c-.8-4.8 5-6.6 6.4-2.6.9 2.8-2.4 4-3.7 1.6" />
      <path d="M12 21c3.5-.4 6.2 1.6 6.6 4.6-3.4.4-6-1.4-6.6-4.6z" />
      <path d="M28 6.5c1 3 3.6 4.4 6.4 3.8-.6-3-3.4-4.6-6.4-3.8z" />
    </svg>
  );
}

/** Bölüm ayırıcı: ince çizgi, ortada küçük bir yaprak */
export function Divider({ className }) {
  return (
    <svg
      className={className}
      width="100%"
      height="14"
      viewBox="0 0 240 14"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M8 7.2C40 6.4 80 7.8 106 7" strokeWidth="1" />
      <path d="M134 7c26 .8 66-.6 98 .2" strokeWidth="1" />
      <path d="M112 7c3-4.4 9-5 16-.2-6 4.6-12.6 4.6-16 .2z" strokeWidth="1.1" />
      <path d="M112 7h16" strokeWidth=".8" />
    </svg>
  );
}
