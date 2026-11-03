/*
  PROFİL EKRANI — Seviye, toplam sayılar, rozetler ve unvan basamakları.
*/
import PageHeader from '../components/ui/PageHeader.jsx';
import Disclaimer from '../components/ui/Disclaimer.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useStats } from '../data/hooks.js';
import { BADGES, LEVELS, levelFor } from '../data/gamification.js';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const stats = useStats();
  const { current, next, index, progress } = levelFor(stats.points);

  return (
    <div className="screen profile">
      <PageHeader eyebrow="Kâşif kartı" title={current.title} />

      {/* Seviye ilerlemesi */}
      <section className="paper profile__level">
        <div className="profile__level-row">
          <span className="muted">{stats.points} puan</span>
          <span className="muted">
            {next ? `${next.title}: ${next.minPoints}` : 'En yüksek unvan'}
          </span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </section>

      {/* Özet sayılar */}
      <section className="paper stat-row">
        <div className="stat">
          <div className="stat-value">{stats.speciesCount}</div>
          <div className="stat-label">Tür</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.points}</div>
          <div className="stat-label">Puan</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.tripCount}</div>
          <div className="stat-label">Gezi</div>
        </div>
      </section>

      {/* Rozetler (henüz kazanılmadıkları için silik) */}
      <section className="profile__section">
        <h2>Rozetler</h2>
        <ul className="badge-grid">
          {BADGES.map((b) => (
            <li key={b.key} className="badge badge--locked" title={b.description}>
              <span className="badge__seal">
                <Icon name={b.icon} size={24} />
              </span>
              <span className="badge__title">{b.title}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Unvan basamakları */}
      <section className="profile__section">
        <h2>Unvanlar</h2>
        <ol className="paper level-ladder">
          {LEVELS.map((lvl, i) => (
            <li key={lvl.key} className={i <= index ? 'is-reached' : ''}>
              <span className="level-ladder__dot" />
              <span className="level-ladder__title">{lvl.title}</span>
              <span className="level-ladder__pts">{lvl.minPoints} puan</span>
            </li>
          ))}
        </ol>
      </section>

      <Disclaimer />
    </div>
  );
}
