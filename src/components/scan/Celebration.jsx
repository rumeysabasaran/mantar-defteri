/*
  KUTLAMA — Kayıttan sonra gösterilen küçük, zarif sonuç kartı.
  - Yeni tür: kitaba yeni bir sayfa eklenir (sayfa kayarak gelir, hardal pırıltı).
  - Tekrar: "eski bir tanıdık", görülme sayısı.
  - Taslak: sakin bir onay.
*/
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { MushroomSketch } from '../ui/Ornaments.jsx';
import { RARITY } from '../../data/gamification.js';
import { displayName } from '../../services/safety.js';

export default function Celebration({ outcome, onAgain, againLabel = 'Yeni tarama', againIcon = 'camera', hideBookLink = false }) {
  const { type, species, pointsEarned } = outcome;
  // "Kitaba git" doğrudan ilgili sayfayı açar
  const bookLink = type === 'draft' ? '/kitap/taslaklar' : `/kitap/${species.id}`;

  return (
    <section className={`paper celebration celebration--${type}`} aria-live="polite">
      {type === 'new' && (
        <>
          <div className="celebration__page" aria-hidden="true">
            <MushroomSketch size={54} />
            <span className="celebration__spark s1"><Icon name="sparkle" size={18} /></span>
            <span className="celebration__spark s2"><Icon name="sparkle" size={13} /></span>
          </div>
          <span className="eyebrow">Kitabına yeni bir sayfa eklendi</span>
          <h2>{displayName(species)}</h2>
          {species.turkishName && <p className="celebration__latin">{species.latinName}</p>}
          <div className="celebration__chips">
            <span className="chip">{RARITY[species.rarity]?.label}</span>
            <span className="chip chip--points">+{pointsEarned} puan</span>
          </div>
        </>
      )}

      {type === 'repeat' && (
        <>
          <Icon name="eye" size={40} className="celebration__icon" />
          <span className="eyebrow">Eski bir tanıdık</span>
          <h2>{displayName(species)}</h2>
          <p className="muted">
            Bu türü {species.seenCount}. kez gördün. Fotoğraf sayfasına eklendi.
          </p>
          <div className="celebration__chips">
            <span className="chip chip--points">+{pointsEarned} puan</span>
          </div>
        </>
      )}

      {type === 'draft' && (
        <>
          <Icon name="book" size={40} className="celebration__icon" />
          <span className="eyebrow">Taslak olarak kaydedildi</span>
          <h2>Sonra karar verebilirsin</h2>
          <p className="muted">Fotoğraf ve notların defterin taslaklar bölümünde duruyor.</p>
        </>
      )}

      <div className="celebration__actions">
        <button type="button" className="btn btn-primary btn-block" onClick={onAgain}>
          <Icon name={againIcon} /> {againLabel}
        </button>
        {!hideBookLink && (
          <Link to={bookLink} className="btn btn-ghost btn-block">
            <Icon name="book" /> {type === 'draft' ? 'Taslaklara git' : 'Sayfasını aç'}
          </Link>
        )}
      </div>
    </section>
  );
}
