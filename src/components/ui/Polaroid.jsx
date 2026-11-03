/*
  POLAROİD — Fotoğrafı sayfaya bantla yapıştırılmış gibi gösterir.
  tilt: hafif eğim (derece). Her fotoğraf biraz farklı dursun diye.
*/
export default function Polaroid({ src, alt = '', caption, tilt = -1.5, className = '', size }) {
  return (
    <figure
      className={`polaroid ${className}`}
      style={{ '--tilt': `${tilt}deg`, ...(size ? { width: size } : {}) }}
    >
      {src ? <img src={src} alt={alt} /> : <div className="polaroid__blank" aria-hidden="true" />}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
