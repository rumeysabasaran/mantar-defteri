/*
  VERİ KANCALARI — Ekranlar veriyi buradan okur.
  useLiveQuery sayesinde veritabanı değişince ekran kendiliğinden yenilenir
  (web sürümündeki Dexie'nin useLiveQuery'si ile aynı fikir).
*/
import { useEffect, useRef, useState } from 'react';
import { tables, subscribe } from './db.js';
import { photoUri } from '../services/photos';

/**
 * Sorguyu çalıştırır, veritabanı her değiştiğinde yeniden çalıştırır.
 * Yüklenirken `fallback` döner.
 */
export function useLiveQuery(query, deps = [], fallback = undefined) {
  const [value, setValue] = useState(fallback);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let alive = true;
    let version = 0;
    const run = () => {
      const mine = ++version;
      queryRef
        .current()
        .then((result) => {
          if (alive && mine === version) setValue(result); // sadece en son sorgunun sonucu
        })
        .catch((err) => console.warn('[veri]', err));
    };
    run();
    const unsubscribe = subscribe(run);
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

const EMPTY_STATS = { speciesCount: 0, points: 0, tripCount: 0, pendingCount: 0, badgeCount: 0 };

/** Profil ve ana sayfadaki özet sayılar */
export function useStats() {
  return useLiveQuery(
    async () => {
      const [speciesCount, tripCount, pendingCount, badgeCount, pointRows] = await Promise.all([
        tables.species.count(),
        tables.trips.count(),
        tables.pending.count(),
        tables.badges.count(),
        tables.points.all(),
      ]);
      const points = pointRows.reduce((sum, row) => sum + (row.amount || 0), 0);
      return { speciesCount, points, tripCount, pendingCount, badgeCount };
    },
    [],
    EMPTY_STATS
  );
}

/** Son buluşlar (en yeni önce), tür bilgisiyle birlikte */
export function useRecentSightings(limit = 5) {
  return useLiveQuery(
    async () => {
      const sightings = await tables.sightings.all({ orderBy: 'foundAt', desc: true, limit });
      const species = await tables.species.bulkGet(sightings.map((s) => s.speciesId));
      const byId = Object.fromEntries(species.map((sp) => [sp.id, sp]));
      return sightings.map((s) => ({ ...s, species: byId[s.speciesId] ?? null }));
    },
    [limit],
    []
  );
}

/**
 * Kitabın bütün verisi: türler (bulunma sırasına göre), türlere göre buluşlar, taslaklar.
 * Yüklenirken undefined döner.
 */
export function useBookData() {
  return useLiveQuery(async () => {
    const [species, sightings] = await Promise.all([
      tables.species.all({ orderBy: 'firstFoundAt' }),
      tables.sightings.all(),
    ]);
    const bySpecies = {};
    const drafts = [];
    for (const s of sightings) {
      if (!s.speciesId) drafts.push(s);
      else (bySpecies[s.speciesId] ??= []).push(s);
    }
    Object.values(bySpecies).forEach((list) => list.sort((a, b) => a.foundAt - b.foundAt));
    drafts.sort((a, b) => b.foundAt - a.foundAt);
    return { species, bySpecies, drafts };
  }, []);
}

/** Bekleyen fotoğraflar (en eski önce) */
export function usePendingList() {
  return useLiveQuery(() => tables.pending.all({ orderBy: 'createdAt' }), [], []);
}

/**
 * Veritabanındaki bir fotoğrafı <Image> içinde gösterilebilir adrese çevirir.
 * variant: 'thumb' (küçük) veya 'full' (büyük)
 */
export function usePhotoUri(photoId, variant = 'thumb') {
  return useLiveQuery(
    async () => (photoId ? photoUri(await tables.photos.get(photoId), variant) : null),
    [photoId, variant],
    null
  );
}
