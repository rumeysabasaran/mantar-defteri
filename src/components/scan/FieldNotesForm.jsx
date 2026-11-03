/*
  SAHA NOTU FORMU — Kitabı "senin" yapan kısım. Hepsi isteğe bağlı.
  Tarih, yer, hava, kimlerle olduğun ve serbest not.

  initial: düzenleme için mevcut buluş ({ foundAt, notes }). Yoksa boş form açılır.
*/
import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { WEATHER, todayInputValue, timeToInputValue, inputValueToTime } from '../../data/fieldNotes.js';

export default function FieldNotesForm({ initial, onSubmit, onBack, submitLabel = 'Deftere kaydet', busy = false }) {
  const n = initial?.notes ?? {};
  const initialDate = initial?.foundAt ? timeToInputValue(initial.foundAt) : todayInputValue();
  const initialCoords = n.location?.lat != null ? { lat: n.location.lat, lng: n.location.lng, accuracy: n.location.accuracy } : null;

  const [date, setDate] = useState(initialDate);
  const [placeName, setPlaceName] = useState(n.location?.placeName ?? '');
  const [coords, setCoords] = useState(initialCoords); // { lat, lng, accuracy }
  const [geoState, setGeoState] = useState('idle'); // idle | loading | error
  const [weather, setWeather] = useState(n.weather ?? '');
  const [companions, setCompanions] = useState(n.companions ?? '');
  const [note, setNote] = useState(n.note ?? '');

  function addLocation() {
    if (!('geolocation' in navigator)) {
      setGeoState('error');
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGeoState('idle');
      },
      () => setGeoState('error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      // Tarih değişmediyse saati de koru
      foundAt: initial?.foundAt && date === initialDate ? initial.foundAt : inputValueToTime(date),
      notes: {
        weather,
        companions: companions.trim(),
        note: note.trim(),
        location: (placeName.trim() || coords) ? { placeName: placeName.trim(), ...(coords ?? {}) } : null,
      },
    });
  }

  return (
    <form className="paper field-notes" onSubmit={handleSubmit}>
      {!initial && (
        <>
          <h3>Saha notu</h3>
          <p className="muted field-notes__hint">Hepsi isteğe bağlı. Sonra kitaptan da düzenleyebilirsin.</p>
        </>
      )}

      <label className="field">
        <span className="field__label">Tarih</span>
        <input type="date" value={date} max={todayInputValue()} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="field">
        <span className="field__label">Yer</span>
        <input
          type="text"
          placeholder="ör. Belgrad Ormanı, göl kıyısı"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
        />
        <button type="button" className="field__link" onClick={addLocation} disabled={geoState === 'loading'}>
          <Icon name="trail" size={16} />
          {coords
            ? `Konum eklendi (±${coords.accuracy} m)`
            : geoState === 'loading'
              ? 'Konum alınıyor…'
              : 'Konumumu ekle'}
        </button>
        {geoState === 'error' && (
          <span className="field__error">Konum alınamadı. İzin verilmemiş ya da bağlantı güvenli (https) değil.</span>
        )}
      </div>

      <div className="field">
        <span className="field__label">Hava</span>
        <div className="chip-picker" role="radiogroup" aria-label="Hava durumu">
          {WEATHER.map((w) => (
            <button
              key={w.key}
              type="button"
              role="radio"
              aria-checked={weather === w.key}
              className={`pick-chip${weather === w.key ? ' is-on' : ''}`}
              onClick={() => setWeather(weather === w.key ? '' : w.key)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">Kimlerle?</span>
        <input
          type="text"
          placeholder="ör. Ayşe ve köpeğimiz Pamuk"
          value={companions}
          onChange={(e) => setCompanions(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">Not</span>
        <textarea
          rows={3}
          placeholder="Nerede, nasıl gördün? Aklında kalan küçük bir ayrıntı…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <div className="field-notes__actions">
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Kaydediliyor…' : submitLabel}
        </button>
        {onBack && (
          <button type="button" className="btn btn-text" onClick={onBack} disabled={busy}>
            ← Seçime dön
          </button>
        )}
      </div>
    </form>
  );
}
