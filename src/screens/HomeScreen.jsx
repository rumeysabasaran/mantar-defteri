/*
  ANA SAYFA — Selam, seviye özeti, kitaba kısa yol, gezi başlatma ve son buluşlar.
*/
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import BookCover from '../components/book/BookCover.jsx';
import Disclaimer from '../components/ui/Disclaimer.jsx';
import Icon from '../components/ui/Icon.jsx';
import { MushroomSketch, Divider } from '../components/ui/Ornaments.jsx';
import { useStats, useRecentSightings, usePhotoUrl } from '../data/hooks.js';
import { levelFor } from '../data/gamification.js';
import { formatDate, weatherLabel } from '../data/fieldNotes.js';
import { displayName } from '../services/safety.js';
import './HomeScreen.css';

/** Son buluşlar listesindeki tek satır: küçük fotoğraf, tür adı, tarih */
function RecentItem({ sighting }) {
  const thumb = usePhotoUrl(sighting.photoId, 'thumb');
  const isDraft = sighting.status === 'draft';
  const meta = [formatDate(sighting.foundAt, false), weatherLabel(sighting.notes?.weather), sighting.notes?.location?.placeName]
    .filter(Boolean)
    .join(' · ');

  return (
    <li>
      <Link to={isDraft ? '/kitap/taslaklar' : `/kitap/${sighting.speciesId}`} className="paper home__recent-item">
        <img src={thumb ?? undefined} alt="" className="home__recent-thumb" />
        <div>
          <p className="home__recent-name">{isDraft ? 'Taslak buluş' : displayName(sighting.species)}</p>
          <p className="home__recent-meta">{meta}</p>
        </div>
      </Link>
    </li>
  );
}

/** Günün saatine göre selamlama */
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function HomeScreen() {
  const stats = useStats();
  const recent = useRecentSightings(5);
  const { current } = levelFor(stats.points);

  return (
    <div className="screen home">
      <PageHeader eyebrow={greeting()} title="Bugün ormanda ne var?">
        <span className="chip home__level">
          <Icon name="leaf" size={15} /> {current.title} · {stats.points} puan
        </span>
      </PageHeader>

      {/* Kitaba kısa yol */}
      <Link to="/kitap" className="paper home__book" aria-label="Koleksiyon kitabını aç">
        <BookCover speciesCount={stats.speciesCount} small />
        <div className="home__book-text">
          <h3>Koleksiyon Kitabın</h3>
          <p className="muted">
            {stats.speciesCount === 0
              ? 'İlk sayfa seni bekliyor. Yürüyüşte gördüğün ilk mantarı tara.'
              : `${stats.speciesCount} tür kaydettin. Kitabın kalınlaşıyor.`}
          </p>
          <span className="home__link">Kitabı aç →</span>
        </div>
      </Link>

      {/* Gezi başlat */}
      <section className="paper home__trip">
        <div>
          <span className="eyebrow">Yürüyüşe mi çıkıyorsun?</span>
          <h3>Bir gezi başlat</h3>
          <p className="muted">Gezi boyunca bulduğun türler tek bir hatırada toplanır.</p>
        </div>
        <Link to="/geziler" className="btn btn-ghost">
          <Icon name="trail" size={20} /> Gezilere git
        </Link>
      </section>

      <Divider className="home__divider" />

      {/* Son buluşlar */}
      <section className="home__recent">
        <h2>Son buluşlar</h2>
        {recent.length === 0 ? (
          <div className="paper empty-state">
            <MushroomSketch size={64} className="home__sketch" />
            <p>Henüz bir buluş yok. Alttaki kamera butonuyla başlayabilirsin.</p>
          </div>
        ) : (
          <ul className="home__recent-list">
            {recent.map((s) => (
              <RecentItem key={s.id} sighting={s} />
            ))}
          </ul>
        )}
      </section>

      {stats.pendingCount > 0 && (
        <Link to="/bekleyenler" className="paper home__pending">
          <Icon name="clock" /> {stats.pendingCount} fotoğraf tanınmayı bekliyor →
        </Link>
      )}

      <Disclaimer compact />
    </div>
  );
}
