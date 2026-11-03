/*
  VERİ KANCALARI — Ekranlar veriyi buradan okur.
  useLiveQuery sayesinde veritabanı değişince ekran kendiliğinden yenilenir.
*/
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

/** Son buluşlar (en yeni önce) */
export function useRecentSightings(limit = 5) {
  return (
    useLiveQuery(
      () => db.sightings.orderBy('foundAt').reverse().limit(limit).toArray(),
      [limit]
    ) ?? []
  );
}

/** Şu an devam eden gezi (bitiş zamanı olmayan) */
export function useActiveTrip() {
  return useLiveQuery(
    () => db.trips.filter((t) => !t.endedAt).first(),
    []
  );
}
