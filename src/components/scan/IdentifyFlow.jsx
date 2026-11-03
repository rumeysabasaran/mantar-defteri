/*
  TANIMA AKIŞI — Bir fotoğraf ve tanıma sonucu elimizdeyken:
  1. Adaylar  → kullanıcı türü seçer ya da "emin değilim" der
  2. Saha notu → isteğe bağlı bilgiler
  3. Kutlama  → yeni sayfa / tekrar / taslak

  Hem Tara ekranında hem Bekleyenler ekranında aynı bileşen kullanılır.
*/
import { useState } from 'react';
import Polaroid from '../ui/Polaroid.jsx';
import Icon from '../ui/Icon.jsx';
import CandidateList from './CandidateList.jsx';
import FieldNotesForm from './FieldNotesForm.jsx';
import Celebration from './Celebration.jsx';
import { usePhotoUrl } from '../../data/hooks.js';
import { recordSighting } from '../../services/collection.js';
import { displayName } from '../../services/safety.js';
import './scan.css';

export default function IdentifyFlow({ photoId, result, onSaved, onCancel, onAgain, againLabel }) {
  const photoUrl = usePhotoUrl(photoId, 'full');
  const hasCandidates = result.isMushroom && result.candidates.length > 0;

  const [step, setStep] = useState('choose'); // choose | notes | done
  const [selected, setSelected] = useState(hasCandidates ? 0 : null);
  const [asDraft, setAsDraft] = useState(!hasCandidates);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState(null);

  async function save({ foundAt, notes }) {
    setBusy(true);
    setError('');
    try {
      const candidate = asDraft ? null : result.candidates[selected];
      const res = await recordSighting({ photoId, candidate, candidates: result.candidates, notes, foundAt });
      await onSaved?.(res);
      setOutcome(res);
      setStep('done');
    } catch (err) {
      console.error(err);
      setError('Kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'done') {
    return <Celebration outcome={outcome} onAgain={onAgain} againLabel={againLabel} />;
  }

  const chosen = !asDraft && selected !== null ? result.candidates[selected] : null;

  return (
    <div className="identify">
      <Polaroid
        src={photoUrl}
        alt="Taranan mantar"
        caption={step === 'notes' ? (chosen ? displayName(chosen) : 'Taslak') : undefined}
        className="identify__photo"
        size={step === 'notes' ? 170 : 240}
      />

      {result.mock && (
        <p className="identify__mock">
          <Icon name="info" size={16} /> Deneme modu: Bu sonuçlar sahte. Gerçek tanıma için API anahtarını ekle.
        </p>
      )}

      {step === 'choose' && (
        <>
          {hasCandidates ? (
            <>
              <div>
                <h2>Bu hangisi olabilir?</h2>
                <p className="muted">Fotoğraftan tür tespiti kesin değildir. En yakın görüneni seç.</p>
              </div>
              <CandidateList
                candidates={result.candidates}
                selectedIndex={asDraft ? null : selected}
                onSelect={(i) => {
                  setSelected(i);
                  setAsDraft(false);
                }}
              />
            </>
          ) : (
            <div className="paper empty-state">
              <Icon name="mushroom" size={40} />
              <p>Bu fotoğrafta bir mantar seçemedim.</p>
              {result.photoTip && <p className="muted">{result.photoTip}</p>}
            </div>
          )}

          {hasCandidates && result.photoTip && <p className="identify__tip">💡 {result.photoTip}</p>}

          <div className="identify__actions">
            {hasCandidates && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={asDraft || selected === null}
                onClick={() => setStep('notes')}
              >
                Bu tür, devam et
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                setAsDraft(true);
                setStep('notes');
              }}
            >
              Emin değilim, taslak kaydet
            </button>
            <button type="button" className="btn btn-text" onClick={onCancel}>
              Vazgeç
            </button>
          </div>
        </>
      )}

      {step === 'notes' && (
        <>
          <FieldNotesForm
            onSubmit={save}
            onBack={() => setStep('choose')}
            busy={busy}
            submitLabel={asDraft ? 'Taslak olarak kaydet' : 'Deftere kaydet'}
          />
          {error && <p className="field__error">{error}</p>}
        </>
      )}
    </div>
  );
}
