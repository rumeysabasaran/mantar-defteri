/*
  KİTAP SAYFALARI — Kitabın içindeki her sayfa türü burada.
  Her sayfa aynı kâğıt çerçeveyi (Page) kullanır; içerik uzunsa sayfa içinde kayar.
*/
import BookCover from '../BookCover.jsx';
import Polaroid from '../../ui/Polaroid.jsx';
import Icon from '../../ui/Icon.jsx';
import Disclaimer from '../../ui/Disclaimer.jsx';
import { CornerFlourish, Divider, FernSprig, MushroomSketch } from '../../ui/Ornaments.jsx';
import { usePhotoUrl } from '../../../data/hooks.js';
import { RARITY } from '../../../data/gamification.js';
import { formatDate, weatherLabel } from '../../../data/fieldNotes.js';
import { displayName } from '../../../services/safety.js';
import './pages.css';

/** Ortak sayfa çerçevesi: kâğıt, kenar boşluğu çizgisi, altta sayfa numarası */
function Page({ number, className = '', children }) {
  return (
    <article className={`page ${className}`}>
      <div className="page__scroll">{children}</div>
      {number != null && (
        <footer className="page__number" aria-label={`Sayfa ${number}`}>
          <span aria-hidden="true">~</span> {number} <span aria-hidden="true">~</span>
        </footer>
      )}
    </article>
  );
}

/** Kimliğe göre her seferinde aynı küçük eğimi verir (polaroidler hep aynı açıda dursun) */
function tiltFor(id = '') {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 50) / 10 - 2.5).toFixed(1); // -2.5° … +2.5°
}

// ---------------------------------------------------------------- KAPAK

export function CoverPage({ speciesCount, onOpen }) {
  return (
    <div className="page page--cover">
      <button type="button" className="page-cover__btn" onClick={onOpen} aria-label="Kitabı aç">
        <BookCover speciesCount={speciesCount} fill />
      </button>
      <p className="page-cover__hint">Açmak için dokun ya da sola kaydır</p>
    </div>
  );
}

// ---------------------------------------------------------------- İÇİNDEKİLER

export function TocPage({ number, entries, draftCount, draftsPage, mysteryCount, mysteryPage, showMystery, onToggleMystery, onJump }) {
  return (
    <Page number={number} className="page--toc">
      <CornerFlourish className="page__corner" size={40} />
      <h2 className="page__title">İçindekiler</h2>
      <Divider className="page__divider" />

      {entries.length === 0 ? (
        <div className="toc__empty">
          <MushroomSketch size={64} />
          <p>Sayfalar henüz boş. İlk mantarını taradığında buraya yazılacak.</p>
        </div>
      ) : (
        <ol className="toc__list">
          {entries.map((e) => (
            <li key={e.key}>
              <button type="button" className="toc__row" onClick={() => onJump(e.page)}>
                <span className="toc__no">{e.no}.</span>
                <span className="toc__name">
                  {e.name}
                  {e.latin && <em>{e.latin}</em>}
                </span>
                <span className="toc__dots" aria-hidden="true" />
                <span className="toc__page">{e.page}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {(draftCount > 0 || (showMystery && mysteryCount > 0)) && <Divider className="page__divider" />}
      <ul className="toc__list toc__list--extra">
        {draftCount > 0 && (
          <li>
            <button type="button" className="toc__row" onClick={() => onJump(draftsPage)}>
              <span className="toc__name">Taslaklar ({draftCount})</span>
              <span className="toc__dots" aria-hidden="true" />
              <span className="toc__page">{draftsPage}</span>
            </button>
          </li>
        )}
        {showMystery && mysteryCount > 0 && (
          <li>
            <button type="button" className="toc__row" onClick={() => onJump(mysteryPage)}>
              <span className="toc__name">Keşfedilmeyi bekleyenler ({mysteryCount})</span>
              <span className="toc__dots" aria-hidden="true" />
              <span className="toc__page">{mysteryPage}</span>
            </button>
          </li>
        )}
      </ul>

      <label className="toc__toggle">
        <input type="checkbox" checked={showMystery} onChange={(e) => onToggleMystery(e.target.checked)} />
        <span>Henüz bulunmamış türleri silik "?" sayfaları olarak göster</span>
      </label>
    </Page>
  );
}

// ---------------------------------------------------------------- TÜR SAYFASI

function DescriptionRow({ label, text }) {
  if (!text) return null;
  return (
    <div className="species__row">
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function Thumb({ photoId, onClick, isCover }) {
  const url = usePhotoUrl(photoId, 'thumb');
  return (
    <button type="button" className={`species__thumb${isCover ? ' is-cover' : ''}`} onClick={onClick} aria-label="Fotoğrafı büyüt">
      {url && <img src={url} alt="" />}
    </button>
  );
}

function NoteEntry({ sighting, onEdit }) {
  const n = sighting.notes ?? {};
  const facts = [
    weatherLabel(n.weather),
    n.location?.placeName,
    n.location?.lat != null && !n.location?.placeName ? 'Konum kayıtlı' : '',
    n.companions && `Yanımda: ${n.companions}`,
  ].filter(Boolean);

  return (
    <li className="note">
      <div className="note__head">
        <span className="note__date">{formatDate(sighting.foundAt)}</span>
        <button type="button" className="note__edit" onClick={onEdit}>
          Düzenle
        </button>
      </div>
      {facts.length > 0 && <p className="note__facts">{facts.join(' · ')}</p>}
      {n.note ? <p className="note__text">“{n.note}”</p> : facts.length === 0 && <p className="note__empty">Not eklenmemiş.</p>}
    </li>
  );
}

export function SpeciesPage({ number, no, species, sightings, onOpenPhoto, onEditSighting }) {
  const coverUrl = usePhotoUrl(species.coverPhotoId, 'full');
  const d = species.description ?? {};
  const newestFirst = [...sightings].reverse();

  return (
    <Page number={number} className="page--species">
      <CornerFlourish className="page__corner" size={40} />

      <header className="species__head">
        <span className="eyebrow">No. {no}</span>
        <h2 className="species__name">{displayName(species)}</h2>
        {species.turkishName && <p className="species__latin">{species.latinName}</p>}
        <div className="species__chips">
          <span className="chip">{RARITY[species.rarity]?.label}</span>
          <span className="chip chip--quiet">
            <Icon name="eye" size={14} /> {species.seenCount} kez görüldü
          </span>
        </div>
      </header>

      <button type="button" className="species__polaroid" onClick={() => onOpenPhoto(species.coverPhotoId)} aria-label="Fotoğrafı büyüt">
        <Polaroid src={coverUrl} alt={displayName(species)} caption={formatDate(species.firstFoundAt)} tilt={tiltFor(species.id)} size="min(78%, 260px)" />
      </button>

      <section className="species__section">
        <h3 className="species__h">Tanım</h3>
        <dl className="species__desc">
          <DescriptionRow label="Şapka" text={d.capShape} />
          <DescriptionRow label="Renk" text={d.color} />
          <DescriptionRow label="Sap" text={d.stem} />
          <DescriptionRow label="Ortam" text={d.habitat} />
          <DescriptionRow label="Mevsim" text={d.season} />
        </dl>
      </section>

      {species.funFact && (
        <aside className="species__fact">
          <span className="species__fact-title">
            <Icon name="sparkle" size={16} /> Biliyor muydun?
          </span>
          <p>{species.funFact}</p>
        </aside>
      )}

      <p className="species__ai-note">Tanım ve bilgi yapay zekâ tarafından yazıldı; hatalı olabilir.</p>

      <Divider className="page__divider" />

      <section className="species__section">
        <h3 className="species__h">Saha notları</h3>
        <ul className="notes">
          {newestFirst.map((s) => (
            <NoteEntry key={s.id} sighting={s} onEdit={() => onEditSighting(s)} />
          ))}
        </ul>
      </section>

      {sightings.length > 1 && (
        <section className="species__section">
          <h3 className="species__h">Fotoğraflar ({sightings.length})</h3>
          <div className="species__gallery">
            {sightings.map((s) => (
              <Thumb key={s.id} photoId={s.photoId} isCover={s.photoId === species.coverPhotoId} onClick={() => onOpenPhoto(s.photoId)} />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- "?" SAYFASI

export function MysteryPage({ number, entry, first }) {
  return (
    <Page number={number} className="page--mystery">
      {first && <p className="mystery__section">Keşfedilmeyi bekleyenler</p>}
      <div className="mystery__body">
        <span className="mystery__mark" aria-hidden="true">?</span>
        <MushroomSketch size={84} className="mystery__sketch" />
        <span className="eyebrow">Henüz keşfedilmedi</span>
        <p className="mystery__hint">{entry.hint}</p>
        <span className="chip chip--quiet">{entry.season}</span>
      </div>
    </Page>
  );
}

// ---------------------------------------------------------------- TASLAKLAR

function DraftItem({ sighting, onOpen }) {
  const url = usePhotoUrl(sighting.photoId, 'thumb');
  const guess = sighting.candidates?.[0];
  return (
    <li>
      <button type="button" className="draft" onClick={onOpen}>
        <Polaroid src={url} size={92} tilt={tiltFor(sighting.id)} />
        <span className="draft__body">
          <span className="draft__date">{formatDate(sighting.foundAt)}</span>
          <span className="draft__guess">{guess ? `Belki: ${displayName(guess)}` : 'Tür önerisi yok'}</span>
          <span className="draft__cta">Türünü seç →</span>
        </span>
      </button>
    </li>
  );
}

export function DraftsPage({ number, drafts, onOpenDraft }) {
  return (
    <Page number={number} className="page--drafts">
      <h2 className="page__title">Taslaklar</h2>
      <p className="muted page__lead">Emin olamadığın buluşlar. Türünü seçince kendi sayfasına taşınır.</p>
      <Divider className="page__divider" />
      <ul className="drafts">
        {drafts.map((s) => (
          <DraftItem key={s.id} sighting={s} onOpen={() => onOpenDraft(s)} />
        ))}
      </ul>
    </Page>
  );
}

// ---------------------------------------------------------------- SON SAYFA

export function EndPage({ number, speciesCount }) {
  return (
    <Page number={number} className="page--end">
      <div className="end__body">
        <FernSprig size={110} className="end__fern" />
        <h2 className="page__title">Defterin devam ediyor…</h2>
        <p className="muted">
          {speciesCount === 0
            ? 'İlk yürüyüşün bu sayfaları dolduracak.'
            : `${speciesCount} tür kaydettin. Her yeni keşif bu kitaba bir sayfa daha ekleyecek.`}
        </p>
        <Disclaimer />
      </div>
    </Page>
  );
}
