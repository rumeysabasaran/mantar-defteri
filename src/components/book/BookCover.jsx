/*
  KİTAP KAPAĞI — Koyu yeşil, altın çerçeveli defter kapağı.
  Sağdaki sayfa kenarları tür sayısı arttıkça kalınlaşır: kitap büyüdükçe görünür.
*/
import { MushroomSketch, CornerFlourish } from '../ui/Ornaments.jsx';
import './BookCover.css';

export default function BookCover({ speciesCount = 0, small = false, fill = false }) {
  // 0 türde ince, her türle biraz kalınlaşır (en fazla 22px)
  const thickness = Math.min(22, 4 + speciesCount * 0.6);

  return (
    <div
      className={`book-cover${small ? ' book-cover--small' : ''}${fill ? ' book-cover--fill' : ''}`}
      style={{ '--pages': `${thickness}px` }}
    >
      <div className="book-cover__pages" aria-hidden="true" />
      <div className="book-cover__front">
        <div className="book-cover__frame">
          <CornerFlourish className="book-cover__corner tl" size={small ? 28 : 40} />
          <CornerFlourish className="book-cover__corner tr" size={small ? 28 : 40} rotate={90} />
          <CornerFlourish className="book-cover__corner br" size={small ? 28 : 40} rotate={180} />
          <CornerFlourish className="book-cover__corner bl" size={small ? 28 : 40} rotate={270} />

          <MushroomSketch className="book-cover__emblem" size={small ? 46 : 76} />
          <h2 className="book-cover__title">Mantar Defteri</h2>
          <p className="book-cover__subtitle">Saha Notları &amp; Keşifler</p>
          <p className="book-cover__count">
            {speciesCount === 0 ? 'Henüz boş sayfalar' : `${speciesCount} tür`}
          </p>
        </div>
      </div>
    </div>
  );
}
