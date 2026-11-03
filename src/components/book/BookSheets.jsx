/*
  KİTAP PENCERELERİ
  - PhotoSheet:   fotoğrafı büyütür, istenirse kapak fotoğrafı yapar
  - EditSheet:    bir buluşun saha notlarını düzenler ya da buluşu siler
  - DraftSheet:   taslağın türünü sonradan seçer (puan ve kutlama ile)
*/
import { useState } from 'react';
import Sheet from '../ui/Sheet.jsx';
import Polaroid from '../ui/Polaroid.jsx';
import Icon from '../ui/Icon.jsx';
import FieldNotesForm from '../scan/FieldNotesForm.jsx';
import CandidateList from '../scan/CandidateList.jsx';
import Celebration from '../scan/Celebration.jsx';
import { usePhotoUrl } from '../../data/hooks.js';
import { deleteSighting, resolveDraft, setCoverPhoto, updateSighting } from '../../services/collection.js';
import '../scan/scan.css';
import './BookSheets.css';

// ---------------------------------------------------------------- FOTOĞRAF

export function PhotoSheet({ photoId, species, onClose }) {
  const url = usePhotoUrl(photoId, 'full');
  const isCover = species?.coverPhotoId === photoId;

  return (
    <Sheet title="Fotoğraf" onClose={onClose} variant="is-photo">
      <div className="photo-view">
        {url && <img src={url} alt="" className="photo-view__img" />}
        {species && !isCover && (
          <button
            type="button"
            className="btn btn-ghost photo-view__btn"
            onClick={async () => {
              await setCoverPhoto(species.id, photoId);
              onClose();
            }}
          >
            <Icon name="book" /> Sayfanın fotoğrafı yap
          </button>
        )}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- NOT DÜZENLEME

export function EditSheet({ sighting, onClose }) {
  const [busy, setBusy] = useState(false);

  async function save({ foundAt, notes }) {
    setBusy(true);
    await updateSighting(sighting.id, { foundAt, notes });
    onClose();
  }

  async function remove() {
    const ok = window.confirm('Bu buluş, fotoğrafı ve puanıyla birlikte silinsin mi? Bu geri alınamaz.');
    if (!ok) return;
    setBusy(true);
    await deleteSighting(sighting.id);
    onClose();
  }

  return (
    <Sheet title="Saha notunu düzenle" onClose={onClose}>
      <FieldNotesForm initial={sighting} onSubmit={save} submitLabel="Kaydet" busy={busy} />
      <button type="button" className="btn btn-text danger-link" onClick={remove} disabled={busy}>
        Bu buluşu sil
      </button>
    </Sheet>
  );
}

// ---------------------------------------------------------------- TASLAK

export function DraftSheet({ sighting, onClose }) {
  const url = usePhotoUrl(sighting.photoId, 'full');
  const candidates = sighting.candidates ?? [];
  const [selected, setSelected] = useState(candidates.length ? 0 : null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);

  async function confirm() {
    setBusy(true);
    try {
      setOutcome(await resolveDraft(sighting.id, candidates[selected]));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Bu taslak ve fotoğrafı silinsin mi?')) return;
    await deleteSighting(sighting.id);
    onClose();
  }

  if (outcome) {
    return (
      <Sheet title="" onClose={onClose}>
        <Celebration outcome={outcome} onAgain={onClose} againLabel="Kitaba dön" againIcon="book" hideBookLink />
      </Sheet>
    );
  }

  return (
    <Sheet title="Taslağın türünü seç" onClose={onClose}>
      <Polaroid src={url} size={180} tilt={-1.5} className="identify__photo" />
      {candidates.length > 0 ? (
        <>
          <p className="muted">Kayıt sırasında önerilen türler. Hangisi olduğuna karar verdin mi?</p>
          <CandidateList candidates={candidates} selectedIndex={selected} onSelect={setSelected} />
          <button type="button" className="btn btn-primary btn-block" onClick={confirm} disabled={busy || selected === null}>
            Bu tür, kitaba ekle
          </button>
        </>
      ) : (
        <p className="muted">Bu fotoğraf için tür önerisi yok. Yeniden çekip taratmayı deneyebilirsin.</p>
      )}
      <button type="button" className="btn btn-text danger-link" onClick={remove} disabled={busy}>
        Taslağı sil
      </button>
    </Sheet>
  );
}
