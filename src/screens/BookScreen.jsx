/*
  KİTAP EKRANI — 1. aşamada kapak görünür.
  Sayfa çevirme, içindekiler ve tür sayfaları 3. aşamada eklenecek.
*/
import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { useStats } from '../data/hooks.js';
import './BookScreen.css';

export default function BookScreen() {
  const { speciesCount } = useStats();
  const [tapped, setTapped] = useState(false);

  return (
    <div className="screen book">
      <PageHeader
        eyebrow="Koleksiyon"
        title="Defterin"
        subtitle="Her yeni tür kitaba yeni bir sayfa ekler."
      />

      <button className="book__cover-btn" onClick={() => setTapped(true)} aria-label="Kitabı aç">
        <BookCover speciesCount={speciesCount} />
      </button>

      <p className="book__hint muted">
        {tapped
          ? 'Sayfalar 3. aşamada açılacak: içindekiler, tür sayfaları ve sayfa çevirme.'
          : 'Kapağa dokun'}
      </p>
    </div>
  );
}
