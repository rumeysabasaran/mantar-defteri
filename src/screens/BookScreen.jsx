/*
  KİTAP EKRANI — Koleksiyon kitabı.

  Sayfa sırası:
    Kapak → İçindekiler → Tür sayfaları (bulunma sırasıyla) → Taslaklar
    → "?" sayfaları (isteğe bağlı) → Son sayfa

  Adres: /kitap            → kaldığın sayfa (ilk açılışta kapak)
         /kitap/<tür-id>   → kitap o sayfaya çevrilerek açılır (ör. yeni kayıttan sonra)
         /kitap/taslaklar  → taslaklar sayfası
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Book from '../components/book/Book.jsx';
import { CoverPage, TocPage, SpeciesPage, MysteryPage, DraftsPage, EndPage } from '../components/book/pages/BookPages.jsx';
import { PhotoSheet, EditSheet, DraftSheet } from '../components/book/BookSheets.jsx';
import { useBookData } from '../data/hooks.js';
import { MYSTERY_SPECIES } from '../data/catalog.js';
import { speciesKeyOf } from '../services/collection.js';
import { displayName } from '../services/safety.js';
import './BookScreen.css';

// Uygulama açık kaldığı sürece kitabın kaldığı sayfayı hatırla
let lastIndex = 0;

/** Cihazda hatırlanan küçük bir aç/kapa tercihi (tarayıcı izin vermezse varsayılan kullanılır) */
function useRememberedToggle(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved == null ? fallback : saved === '1';
    } catch {
      return fallback;
    }
  });
  const update = useCallback(
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, next ? '1' : '0');
      } catch {
        /* kaydedilemezse sadece bu oturumda geçerli olur */
      }
    },
    [key]
  );
  return [value, update];
}

export default function BookScreen() {
  const { pageKey } = useParams();
  const data = useBookData();
  const [showMystery, setShowMystery] = useRememberedToggle('mantar-defteri.showMystery', true);
  const [index, setIndexState] = useState(lastIndex);
  const [sheet, setSheet] = useState(null); // { type: 'photo'|'edit'|'draft', ... }
  const bookRef = useRef(null);
  const handledKey = useRef(null);
  const flipTimer = useRef(null);

  const setIndex = useCallback((i) => {
    lastIndex = i;
    setIndexState(i);
  }, []);

  // Sayfaların listesi: her biri { key, node }
  const pages = useMemo(() => {
    if (!data) return [];
    const { species, bySpecies, drafts } = data;

    const found = new Set(species.map((s) => s.speciesKey));
    const mysteries = showMystery ? MYSTERY_SPECIES.filter((m) => !found.has(speciesKeyOf(m.latinName))) : [];

    // Sayfa numarası = kitaptaki sırası (kapak 0, içindekiler 1)
    const firstSpeciesPage = 2;
    const draftsPage = drafts.length ? firstSpeciesPage + species.length : null;
    const firstMysteryPage = firstSpeciesPage + species.length + (drafts.length ? 1 : 0);

    const list = [
      {
        key: 'cover',
        backClass: 'is-endpaper',
        node: <CoverPage speciesCount={species.length} onOpen={() => bookRef.current?.next()} />,
      },
      {
        key: 'toc',
        node: (
          <TocPage
            number={1}
            entries={species.map((s, i) => ({
              key: s.id,
              no: i + 1,
              name: displayName(s),
              latin: s.turkishName ? s.latinName : '',
              page: firstSpeciesPage + i,
            }))}
            draftCount={drafts.length}
            draftsPage={draftsPage}
            mysteryCount={mysteries.length}
            mysteryPage={firstMysteryPage}
            showMystery={showMystery}
            onToggleMystery={setShowMystery}
            onJump={setIndex}
          />
        ),
      },
    ];

    species.forEach((s, i) =>
      list.push({
        key: s.id,
        node: (
          <SpeciesPage
            number={firstSpeciesPage + i}
            no={i + 1}
            species={s}
            sightings={bySpecies[s.id] ?? []}
            onOpenPhoto={(photoId) => setSheet({ type: 'photo', photoId, species: s })}
            onEditSighting={(sighting) => setSheet({ type: 'edit', sighting })}
          />
        ),
      })
    );

    if (drafts.length) {
      list.push({
        key: 'taslaklar',
        node: <DraftsPage number={draftsPage} drafts={drafts} onOpenDraft={(sighting) => setSheet({ type: 'draft', sighting })} />,
      });
    }

    mysteries.forEach((m, i) =>
      list.push({ key: `mystery-${m.latinName}`, node: <MysteryPage number={firstMysteryPage + i} entry={m} first={i === 0} /> })
    );

    list.push({ key: 'end', node: <EndPage number={list.length} speciesCount={species.length} /> });
    return list;
  }, [data, showMystery, setShowMystery, setIndex]);

  // Sayfa sayısı azaldıysa (ör. buluş silindi) dizini sınırla
  useEffect(() => {
    if (pages.length && index > pages.length - 1) setIndex(pages.length - 1);
  }, [pages.length, index, setIndex]);

  // /kitap/<sayfa> ile gelindiyse: bir önceki sayfada aç, sonra o sayfaya çevir
  useEffect(() => {
    if (!pages.length || !pageKey || handledKey.current === pageKey) return;
    handledKey.current = pageKey;
    setSheet(null);
    const target = pages.findIndex((p) => p.key === pageKey);
    if (target <= 0) return;
    setIndex(target - 1);
    clearTimeout(flipTimer.current);
    flipTimer.current = setTimeout(() => bookRef.current?.next(), 500);
  }, [pages, pageKey, setIndex]);

  useEffect(() => () => clearTimeout(flipTimer.current), []);

  const closeSheet = useCallback(() => setSheet(null), []);
  const last = pages.length - 1;

  return (
    <div className="screen book-screen">
      <header className="book-screen__bar">
        <div>
          <span className="eyebrow">Koleksiyon</span>
          <h1 className="book-screen__title">Defterin</h1>
        </div>
        {data && <span className="book-screen__count">{data.species.length} tür</span>}
      </header>

      {pages.length > 0 ? (
        <Book ref={bookRef} pages={pages} index={Math.min(index, last)} onIndexChange={setIndex} keyboard={!sheet} />
      ) : (
        <div className="book-screen__loading" aria-busy="true" />
      )}

      <nav className="book-controls" aria-label="Sayfa gezinme">
        <button type="button" className="book-controls__arrow" onClick={() => bookRef.current?.prev()} disabled={index <= 0} aria-label="Önceki sayfa">
          ‹
        </button>
        <button type="button" className="book-controls__toc" onClick={() => setIndex(1)} disabled={pages.length < 2}>
          İçindekiler
        </button>
        <span className="book-controls__pos">{index === 0 ? 'Kapak' : `${index} / ${last}`}</span>
        <button type="button" className="book-controls__arrow" onClick={() => bookRef.current?.next()} disabled={index >= last} aria-label="Sonraki sayfa">
          ›
        </button>
      </nav>

      {sheet?.type === 'photo' && <PhotoSheet photoId={sheet.photoId} species={sheet.species} onClose={closeSheet} />}
      {sheet?.type === 'edit' && <EditSheet sighting={sheet.sighting} onClose={closeSheet} />}
      {sheet?.type === 'draft' && <DraftSheet sighting={sheet.sighting} onClose={closeSheet} />}
    </div>
  );
}
