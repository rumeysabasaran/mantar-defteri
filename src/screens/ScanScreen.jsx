/*
  TARA EKRANI — Kamerayla çek ya da galeriden seç.
  1. aşamada sadece fotoğrafı polaroid içinde önizler.
  Tür tanıma 2. aşamada buraya bağlanacak.
*/
import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Disclaimer from '../components/ui/Disclaimer.jsx';
import Icon from '../components/ui/Icon.jsx';
import './ScanScreen.css';

export default function ScanScreen() {
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);
  const [preview, setPreview] = useState(null); // { url, takenAt }

  // Önizleme adresini işi bitince serbest bırak (bellek sızmasın)
  useEffect(() => () => preview && URL.revokeObjectURL(preview.url), [preview]);

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // aynı dosyayı tekrar seçebilmek için
    if (!file) return;
    setPreview({ url: URL.createObjectURL(file), takenAt: new Date() });
  }

  return (
    <div className="screen scan">
      <PageHeader
        eyebrow="Yeni keşif"
        title="Mantar tara"
        subtitle="Mantarı yakından, şapkası ve sapı görünecek şekilde çek."
      />

      {preview ? (
        <figure className="polaroid scan__polaroid">
          <img src={preview.url} alt="Seçilen mantar fotoğrafı" />
          <figcaption>
            {preview.takenAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </figcaption>
        </figure>
      ) : (
        <div className="paper scan__frame" aria-hidden="true">
          <Icon name="mushroom" size={54} strokeWidth={1.2} />
          <p className="muted">Fotoğraf burada görünecek</p>
        </div>
      )}

      {preview && (
        <p className="paper scan__soon">
          Tür tanıma bir sonraki aşamada eklenecek. Şimdilik fotoğrafın doğru geldiğini kontrol edebilirsin.
        </p>
      )}

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

      <Disclaimer />
    </div>
  );
}
