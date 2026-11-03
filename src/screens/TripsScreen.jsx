/*
  GEZİLER EKRANI — Gezi başlatma/bitirme ve geçmiş gezilerin özeti.
  Kayıt mantığı 5. aşamada eklenecek; şimdilik görünüm hazır.
*/
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import { FernSprig } from '../components/ui/Ornaments.jsx';
import './TripsScreen.css';

export default function TripsScreen() {
  return (
    <div className="screen trips">
      <PageHeader
        eyebrow="Saha günlüğü"
        title="Geziler"
        subtitle="Her yürüyüş; tarihi, yeri ve bulduğun türlerle bir hatıraya dönüşür."
      />

      <section className="paper trips__start">
        <h3>Yeni gezi</h3>
        <p className="muted">Başlattığında, bitirene kadar taradığın her mantar bu geziye yazılır.</p>
        <button className="btn btn-primary btn-block" disabled>
          <Icon name="trail" /> Gezi başlat
        </button>
        <p className="trips__soon">5. aşamada etkinleşecek</p>
      </section>

      <section className="trips__list">
        <h2>Geçmiş geziler</h2>
        <div className="paper empty-state">
          <FernSprig size={70} className="trips__fern" />
          <p>Henüz bir gezi yok. İlk yürüyüşünden sonra burada görünecek.</p>
        </div>
      </section>
    </div>
  );
}
