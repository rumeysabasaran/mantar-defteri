/*
  KOLEKSİYON — Fotoğrafları ve buluşları veritabanına yazan işlemler.

  Akış:
  - Tür kitapta YOKSA → yeni tür sayfası açılır, nadirliğe göre puan kazanılır.
  - Tür kitapta VARSA → görülme sayısı artar, küçük bonus puan kazanılır.
  - "Emin değilim" → taslak buluş olarak kaydedilir, puan yok (sonra türü seçilebilir).
*/
import { db, withMeta } from '../data/db.js';
import { RARITY, REPEAT_BONUS } from '../data/gamification.js';

/** Latince addan benzersiz anahtar: "Trametes  Versicolor" → "trametes versicolor" */
export function speciesKeyOf(latinName) {
  return String(latinName).trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Küçültülmüş fotoğrafları kaydeder, kimliğini döndürür. */
export async function savePhoto({ full, thumb }) {
  const photo = withMeta({ full, thumb, sightingId: null });
  await db.photos.add(photo);
  return photo.id;
}

/** Kaydedilmeden vazgeçilen fotoğrafı siler. */
export async function deletePhoto(photoId) {
  if (photoId) await db.photos.delete(photoId);
}

/**
 * Bir buluşu kaydeder.
 * @param {object} p
 * @param {string} p.photoId
 * @param {object|null} p.candidate   Seçilen tür; null ise taslak
 * @param {object[]} p.candidates     Tanımanın önerdiği tüm adaylar (taslak için saklanır)
 * @param {object} p.notes            Saha notları { weather, companions, note, location }
 * @param {number} p.foundAt          Bulunma zamanı (ms)
 * @returns {{type:'new'|'repeat'|'draft', species, sighting, pointsEarned}}
 */
export async function recordSighting({ photoId, candidate = null, candidates = [], notes = {}, foundAt = Date.now() }) {
  const activeTrip = await db.trips.filter((t) => !t.endedAt).first();

  return db.transaction('rw', db.species, db.sightings, db.photos, db.points, async () => {
    const now = Date.now();
    let species = null;
    let isNew = false;
    let pointsEarned = 0;

    if (candidate) {
      const speciesKey = speciesKeyOf(candidate.latinName);
      species = await db.species.where('speciesKey').equals(speciesKey).first();

      if (species) {
        const changes = {
          seenCount: (species.seenCount || 1) + 1,
          lastSeenAt: Math.max(species.lastSeenAt || 0, foundAt),
          updatedAt: now,
        };
        await db.species.update(species.id, changes);
        species = { ...species, ...changes };
        pointsEarned = REPEAT_BONUS;
      } else {
        isNew = true;
        species = withMeta({
          speciesKey,
          latinName: candidate.latinName,
          turkishName: candidate.turkishName,
          rarity: candidate.rarity,
          description: {
            capShape: candidate.capShape,
            color: candidate.color,
            stem: candidate.stem,
            habitat: candidate.habitat,
            season: candidate.season,
          },
          funFact: candidate.funFact,
          coverPhotoId: photoId,
          firstFoundAt: foundAt,
          lastSeenAt: foundAt,
          seenCount: 1,
        });
        await db.species.add(species);
        pointsEarned = (RARITY[candidate.rarity] ?? RARITY.common).points;
      }
    }

    const sighting = withMeta({
      speciesId: species?.id ?? null,
      photoId,
      tripId: activeTrip?.id ?? null,
      foundAt,
      status: candidate ? 'confirmed' : 'draft',
      confidence: candidate?.confidence ?? null,
      candidates,
      notes,
    });
    await db.sightings.add(sighting);
    await db.photos.update(photoId, { sightingId: sighting.id, updatedAt: now });

    if (pointsEarned > 0) {
      await db.points.add(
        withMeta({
          amount: pointsEarned,
          reason: isNew ? 'new-species' : 'repeat',
          sightingId: sighting.id,
          speciesId: species.id,
          tripId: sighting.tripId,
        })
      );
    }

    return { type: !candidate ? 'draft' : isNew ? 'new' : 'repeat', species, sighting, pointsEarned };
  });
}
