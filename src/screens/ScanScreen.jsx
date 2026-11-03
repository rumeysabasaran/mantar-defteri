/*
  TARA EKRANI — Fotoğraf çek / yükle → tanı → seç → kaydet.

  Adımlar (step):
    pick       Fotoğraf seçme butonları
    analyzing  Fotoğraf hazırlanıyor ve tanınıyor
    result     Tanıma sonucu geldi → IdentifyFlow devralır
    offline    İnternet yok → fotoğraf bekleyenlere eklendi
    error      Bir sorun çıktı → tekrar dene / bekleyenlere ekle / vazgeç
*/
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import Disclaimer from '../components/ui/Disclaimer.jsx';
import Icon from '../components/ui/Icon.jsx';
import Polaroid from '../components/ui/Polaroid.jsx';
import IdentifyFlow from '../components/scan/IdentifyFlow.jsx';
import { usePhotoUrl, useStats } from '../data/hooks.js';
import { db } from '../data/db.js';
import { prepareImage } from '../services/imageTools.js';
import { identify, OfflineError } from '../services/recognizer.js';
import { savePhoto, deletePhoto } from '../services/collection.js';
import { addPending } from '../services/pendingQueue.js';
import '../components/scan/scan.css';
import './ScanScreen.css';

export default function ScanScreen() {
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);
  const [state, setState] = useState({ step: 'pick' });
  const { pendingCount } = useStats();
  const photoUrl = usePhotoUrl(state.photoId, 'full');

  async function runIdentify(photoId) {
    setState({ step: 'analyzing', photoId });
    try {
      const photo = await db.photos.get(photoId);
      const result = await identify(photo.full);
      setState({ step: 'result', photoId, result });
    } catch (err) {
      if (err instanceof OfflineError) {
        await addPending(photoId, 'offline');
        setState({ step: 'offline', photoId });
      } else {
        setState({ step: 'error', photoId, message: err.message, code: err.code });
      }
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // aynı dosyayı tekrar seçebilmek için
    if (!file) return;

    setState({ step: 'analyzing' });
    try {
      const images = await prepareImage(file);
      const photoId = await savePhoto(images); // önce cihaza kaydet: internet giderse kaybolmasın
      await runIdentify(photoId);
    } catch (err) {
      setState({ step: 'error', message: err.message });
    }
  }

  /** Kaydetmeden vazgeç: fotoğrafı da sil */
  async function cancel() {
    await deletePhoto(state.photoId);
    setState({ step: 'pick' });
  }

  async function moveToPending() {
    await addPending(state.photoId, 'error');
    setState({ step: 'offline', photoId: state.photoId });
  }

  const restart = () => setState({ step: 'pick' });

  return (
    <div className="screen scan">
      <PageHeader
        eyebrow="Yeni keşif"
        title="Mantar tara"
        subtitle={state.step === 'pick' ? 'Mantarı yakından, şapkası ve sapı görünecek şekilde çek.' : undefined}
      />

      {state.step === 'pick' && (
        <>
          <div className="paper scan__frame" aria-hidden="true">
            <Icon name="mushroom" size={54} strokeWidth={1.2} />
            <p className="muted">Şapkanın altı da görünürse tanıma daha isabetli olur.</p>
          </div>

          <div className="scan__actions">
            {/* capture="environment" → telefonda arka kamerayı doğrudan açar */}
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            <input ref={galleryInput} type="file" accept="image/*" hidden onChange={handleFile} />

            <button className="btn btn-primary btn-block" onClick={() => cameraInput.current.click()}>
              <Icon name="camera" /> Fotoğraf çek
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => galleryInput.current.click()}>
              <Icon name="gallery" /> Galeriden yükle
            </button>
          </div>

          {pendingCount > 0 && (
            <Link to="/bekleyenler" className="paper scan__pending-link">
              <Icon name="clock" />
              <span>
                <strong>{pendingCount} fotoğraf</strong> tanınmayı bekliyor
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}

          <Disclaimer />
        </>
      )}

      {state.step === 'analyzing' && (
        <div className="analyzing">
          <Polaroid src={photoUrl} alt="Taranan mantar" className="identify__photo" size={240} />
          <p className="analyzing__text">Defterin sayfaları karıştırılıyor…</p>
          <div className="analyzing__dots" aria-label="Tanınıyor">
            <span /><span /><span />
          </div>
        </div>
      )}

      {state.step === 'result' && (
        <IdentifyFlow
          photoId={state.photoId}
          result={state.result}
          onCancel={cancel}
          onAgain={restart}
        />
      )}

      {state.step === 'offline' && (
        <section className="paper empty-state">
          <Polaroid src={photoUrl} alt="" size={150} tilt={2} />
          <h3>Fotoğraf bekleyenlere eklendi</h3>
          <p>Bağlantı gelince otomatik olarak tanınacak. Sonra Bekleyenler'den türü seçebilirsin.</p>
          <div className="scan__actions scan__actions--wide">
            <button className="btn btn-primary btn-block" onClick={restart}>
              <Icon name="camera" /> Yeni tarama
            </button>
            <Link to="/bekleyenler" className="btn btn-ghost btn-block">
              <Icon name="clock" /> Bekleyenler
            </Link>
          </div>
        </section>
      )}

      {state.step === 'error' && (
        <section className="paper empty-state">
          <Icon name="info" size={36} />
          <h3>Tanıma yapılamadı</h3>
          <p>{state.message}</p>
          {state.code === 'no-key' && (
            <p className="muted">README'deki "API anahtarı" bölümüne bak.</p>
          )}
          <div className="scan__actions scan__actions--wide">
            {state.photoId && (
              <button className="btn btn-primary btn-block" onClick={() => runIdentify(state.photoId)}>
                Tekrar dene
              </button>
            )}
            {state.photoId && (
              <button className="btn btn-ghost btn-block" onClick={moveToPending}>
                Bekleyenlere ekle, sonra dene
              </button>
            )}
            <button className="btn btn-text" onClick={cancel}>
              Vazgeç
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
