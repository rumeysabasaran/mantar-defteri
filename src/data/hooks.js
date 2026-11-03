/*
  VERİ KANCALARI — Ekranlar veriyi buradan okur.
  useLiveQuery sayesinde veritabanı değişince ekran kendiliğinden yenilenir.
*/
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db.js';

const EMPTY_STATS = { speciesCount: 0, points: 0, tripCount: 0, pendingCount: 0, badgeCount: 0 };

/** Profil ve ana sayfadaki özet sayılar */
export function useStats() {
  return (
    useLiveQuery(async () => {
      const [speciesCount, tripCount, pendingCount, badgeCount, pointRows] = await Promise.all([
        db.species.count(),
        db.trips.count(),
        db.pending.count(),
        db.badges.count(),
        db.points.toArray(),
      ]);
      const points = pointRows.reduce((sum, row) => sum + (row.amount || 0), 0);
      return { speciesCount, points, tripCount, pendingCount, badgeCount };
    }, []) ?? EMPTY_STATS
  );
}

/** Son buluşlar (en yeni önce), tür bilgisiyle birlikte */
export function useRecentSightings(limit = 5) {
  return (
    useLiveQuery(async () => {
      const sightings = await db.sightings.orderBy('foundAt').reverse().limit(limit).toArray();
      const speciesIds = [...new Set(sightings.map((s) => s.speciesId).filter(Boolean))];
      const species = await db.species.bulkGet(speciesIds);
      const byId = Object.fromEntries(species.filter(Boolean).map((sp) => [sp.id, sp]));
      return sightings.map((s) => ({ ...s, species: byId[s.speciesId] ?? null }));
    }, [limit]) ?? []
  );
}

/**
 * Kitabın bütün verisi: türler (bulunma sırasına göre), türlere göre buluşlar, taslaklar.
 * Yüklenirken undefined döner.
 */
export function useBookData() {
  return useLiveQuery(async () => {
    const [species, sightings] = await Promise.all([db.species.orderBy('firstFoundAt').toArray(), db.sightings.toArray()]);
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
  return useLiveQuery(() => db.pending.orderBy('createdAt').toArray(), []) ?? [];
}

/** Şu an devam eden gezi (bitiş zamanı olmayan) */
export function useActiveTrip() {
  return useLiveQuery(() => db.trips.filter((t) => !t.endedAt).first(), []);
}

/**
 * Veritabanındaki bir fotoğrafı <img> içinde gösterilebilir adrese çevirir.
 * variant: 'thumb' (küçük) veya 'full' (büyük)
 */
export function usePhotoUrl(photoId, variant = 'thumb') {
  const blob = useLiveQuery(
    async () => (photoId ? (await db.photos.get(photoId))?.[variant] ?? null : null),
    [photoId, variant]
  );
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // bellek sızmasın
  }, [blob]);

  return url;
}
