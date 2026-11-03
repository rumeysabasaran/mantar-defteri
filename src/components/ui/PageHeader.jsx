/*
  EKRAN BAŞLIĞI — Üstte küçük bir etiket, büyük serif başlık ve köşede eğrelti süsü.
*/
import { FernSprig } from './Ornaments.jsx';
import './PageHeader.css';

export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-header">
      <FernSprig className="page-header__fern" size={84} flip />
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
      {children}
    </header>
  );
}
