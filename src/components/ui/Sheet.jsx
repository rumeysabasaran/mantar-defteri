/*
  ALT PENCERE — Ekranın altından kayarak açılan kâğıt pencere.
  Sayfanın en üstüne (body) çizilir ki kitabın 3B dönüşleri konumunu bozmasın.
  Kapatma: arka plana dokun, ✕ düğmesi ya da Esc tuşu.
*/
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Sheet.css';

export default function Sheet({ title, onClose, children, variant = '' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // arkadaki sayfa kaymasın
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className={`sheet-backdrop ${variant}`} onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <span className="sheet__grip" aria-hidden="true" />
          {title && <h2 className="sheet__title">{title}</h2>}
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
