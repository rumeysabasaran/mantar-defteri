/*
  BEKLEYENLER EKRANI — İnternet yokken çekilen fotoğraflar.
  Hazır olanlara dokununca tanıma sonucu açılır ve deftere kaydedilebilir.
*/
import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Icon from '../components/ui/Icon.jsx';
import IdentifyFlow from '../components/scan/IdentifyFlow.jsx';
import { usePendingList, usePhotoUrl } from '../data/hooks.js';
import { formatDate } from '../data/fieldNotes.js';
import { processPending, retryPending, removePending } from '../services/pendingQueue.js';
import '../components/scan/scan.css';

const STATUS_TEXT = {
  waiting: 'İnternet bekleniyor',
  processing: 'Tanınıyor…',
  ready: 'Hazır: türü seç',
  error: 'Tanınamadı',
};

function PendingItem({ item, onOpen }) {
  const thumb = usePhotoUrl(item.photoId, 'thumb');

  async function handleDelete() {
    if (window.confirm('Bu fotoğraf silinsin mi?')) await removePending(item.id);
  }

  return (
    <li className="paper pending-item">
      <img className="pending-item__thumb" src={thumb ?? undefined} alt="" />
      <div className="pending-item__body">
        <span className={`pending-item__status${item.status === 'error' ? ' is-error' : ''}`}>
          {STATUS_TEXT[item.status]}
        </span>
        {item.status === 'error' && item.errorMessage && <span className="muted">{item.errorMessage}</span>}
        <span className="pending-item__date">{formatDate(item.createdAt)}</span>
      </div>
      <div className="pending-item__actions">
        {item.status === 'ready' && (
          <button className="btn btn-primary btn-small" onClick={() => onOpen(item)}>Aç</button>
        )}
        {item.status === 'error' && (
          <button className="btn btn-ghost btn-small" onClick={() => retryPending(item.id)}>Tekrar</button>
        )}
        <button className="btn btn-text btn-small" onClick={handleDelete} aria-label="Sil">Sil</button>
      </div>
    </li>
  );
}

export default function PendingScreen() {
  const items = usePendingList();
  const [open, setOpen] = useState(null); // açık olan bekleyen kayıt

  if (open) {
    return (
      <div className="screen">
        <PageHeader eyebrow="Bekleyenler" title="Tanıma sonucu" />
        <IdentifyFlow
          photoId={open.photoId}
          result={open.result}
          // Kaydedilince bekleyenlerden çıkar ama fotoğrafı koru (artık defterde)
          onSaved={() => removePending(open.id, { keepPhoto: true })}
          onCancel={() => setOpen(null)}
          onAgain={() => setOpen(null)}
          againLabel="Bekleyenlere dön"
        />
      </div>
    );
  }

  const waitingCount = items.filter((i) => i.status === 'waiting').length;

  return (
    <div className="screen">
      <PageHeader
        eyebrow="Çevrimdışı çekilenler"
        title="Bekleyenler"
        subtitle="Bağlantı gelince bu fotoğraflar kendiliğinden tanınır."
      />

      {items.length === 0 ? (
        <div className="paper empty-state">
          <Icon name="clock" size={40} />
          <p>Bekleyen fotoğraf yok. Hepsi deftere işlenmiş.</p>
        </div>
      ) : (
        <>
          <ul className="pending-list">
            {items.map((item) => (
              <PendingItem key={item.id} item={item} onOpen={setOpen} />
            ))}
          </ul>
          {waitingCount > 0 && (
            <button className="btn btn-ghost btn-block" onClick={() => processPending()}>
              Şimdi dene
            </button>
          )}
        </>
      )}
    </div>
  );
}
