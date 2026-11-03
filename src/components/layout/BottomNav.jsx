/*
  ALT MENÜ — Başparmakla ulaşılabilecek yerde 4 sekme ve ortada kamera butonu.
  Kamera butonu her ekranda görünür; dokununca Tara ekranına gider.
*/
import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useStats } from '../../data/hooks.js';
import './BottomNav.css';

const TABS_LEFT = [
  { to: '/', label: 'Ana Sayfa', icon: 'home', end: true },
  { to: '/kitap', label: 'Kitap', icon: 'book' },
];
const TABS_RIGHT = [
  { to: '/geziler', label: 'Geziler', icon: 'trail' },
  { to: '/profil', label: 'Profil', icon: 'user' },
];

function Tab({ to, label, icon, end }) {
  return (
    <NavLink to={to} end={end} className="bottom-nav__tab">
      <Icon name={icon} size={23} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { pendingCount } = useStats();

  return (
    <nav className="bottom-nav" aria-label="Ana menü">
      <div className="bottom-nav__inner">
        {TABS_LEFT.map((t) => <Tab key={t.to} {...t} />)}

        <NavLink to="/tara" className="camera-fab" aria-label="Mantar tara">
          <Icon name="camera" size={28} strokeWidth={1.7} />
          {pendingCount > 0 && (
            <span className="camera-fab__badge" aria-label={`${pendingCount} bekleyen fotoğraf`}>
              {pendingCount}
            </span>
          )}
        </NavLink>

        {TABS_RIGHT.map((t) => <Tab key={t.to} {...t} />)}
      </div>
    </nav>
  );
}
