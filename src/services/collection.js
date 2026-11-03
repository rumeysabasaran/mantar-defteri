/*
  KOLEKSİYON — Fotoğrafları ve buluşları veritabanına yazan işlemler.

  Akış:
  - Tür kitapta YOKSA → yeni tür sayfası açılır, nadirliğe göre puan kazanılır.
  - Tür kitapta VARSA → görülme sayısı artar, küçük bonus puan kazanılır.
  - "Emin değilim" → taslak buluş olarak kaydedilir, puan yok (sonra türü seçilebilir).

  Puan kuralı (bir tür için): en eski buluş yeni tür puanını, diğer her buluş
  tekrar bonusunu alır. Buluş silinince ya da tarihi değişince bu yeniden hesaplanır.
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
 * Seçilen adayı kitaptaki bir tür sayfasına bağlar (yoksa sayfayı açar).
 * Bir veritabanı işleminin (transaction) içinden çağrılmalıdır.
 */
async function attachToSpecies(candidate, photoId, foundAt) {
  const now = Date.now();
  const speciesKey = speciesKeyOf(candidate.latinName);
  let species = await db.species.where('speciesKey').equals(speciesKey).first();

  if (species) {
    const changes = {
      seenCount: (species.seenCount || 1) + 1,
      firstFoundAt: Math.min(species.firstFoundAt, foundAt),
      lastSeenAt: Math.max(species.lastSeenAt || 0, foundAt),
      updatedAt: now,
    };
    await db.species.update(species.id, changes);
    return { species: { ...species, ...changes }, isNew: false, pointsEarned: REPEAT_BONUS };
  }

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
  return { species, isNew: true, pointsEarned: (RARITY[candidate.rarity] ?? RARITY.common).points };
}

/**
 * Bir türün puanlarını baştan hesaplar: en eski buluş yeni tür puanı,
 * diğerleri tekrar bonusu alır. Bir işlemin içinden çağrılmalıdır.
 */
async function recomputeSpeciesPoints(speciesId) {
  await db.points.where('speciesId').equals(speciesId).delete();
  const species = await db.species.get(speciesId);
  if (!species) return;
  const sightings = (await db.sightings.where('speciesId').equals(speciesId).toArray()).sort((a, b) => a.foundAt - b.foundAt);
  const rows = sightings.map((s, i) =>
    withMeta({
      amount: i === 0 ? (RARITY[species.rarity] ?? RARITY.common).points : REPEAT_BONUS,
      reason: i === 0 ? 'new-species' : 'repeat',
      sightingId: s.id,
      speciesId,
      tripId: s.tripId ?? null,
    })
  );
  if (rows.length) await db.points.bulkAdd(rows);
}

/** Türün tarihlerini ve görülme sayısını buluşlardan yeniden hesaplar. */
async function refreshSpecies(speciesId) {
  const sightings = await db.sightings.where('speciesId').equals(speciesId).toArray();
  if (sightings.length === 0) {
    await db.species.delete(speciesId); // son buluş da silindiyse sayfa kalkar
    return;
  }
  const times = sightings.map((s) => s.foundAt);
  const species = await db.species.get(speciesId);
  const coverStillExists = sightings.some((s) => s.photoId === species?.coverPhotoId);
  await db.species.update(speciesId, {
    firstFoundAt: Math.min(...times),
    lastSeenAt: Math.max(...times),
    seenCount: sightings.length,
    ...(coverStillExists ? {} : { coverPhotoId: sightings.sort((a, b) => a.foundAt - b.foundAt)[0].photoId }),
    updatedAt: Date.now(),
  });
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
    const attached = candidate ? await attachToSpecies(candidate, photoId, foundAt) : null;

    const sighting = withMeta({
      speciesId: attached?.species.id ?? null,
      photoId,
      tripId: activeTrip?.id ?? null,
      foundAt,
      status: candidate ? 'confirmed' : 'draft',
      confidence: candidate?.confidence ?? null,
      candidates,
      notes,
    });
    await db.sightings.add(sighting);
    await db.photos.update(photoId, { sightingId: sighting.id, updatedAt: Date.now() });
    if (attached) await recomputeSpeciesPoints(attached.species.id);

    return {
      type: !attached ? 'draft' : attached.isNew ? 'new' : 'repeat',
      species: attached?.species ?? null,
      sighting,
      pointsEarned: attached?.pointsEarned ?? 0,
    };
  });
}

/** Taslak bir buluşun türünü sonradan seçer. Kayıt gibi puan ve kutlama döndürür. */
export async function resolveDraft(sightingId, candidate) {
  return db.transaction('rw', db.species, db.sightings, db.points, async () => {
    const sighting = await db.sightings.get(sightingId);
    if (!sighting || sighting.speciesId) throw new Error('Taslak bulunamadı.');

    const attached = await attachToSpecies(candidate, sighting.photoId, sighting.foundAt);
    await db.sightings.update(sightingId, {
      speciesId: attached.species.id,
      status: 'confirmed',
      confidence: candidate.confidence ?? null,
      updatedAt: Date.now(),
    });
    await recomputeSpeciesPoints(attached.species.id);

    return { type: attached.isNew ? 'new' : 'repeat', species: attached.species, pointsEarned: attached.pointsEarned };
  });
}

/** Saha notlarını ve tarihi günceller. */
export async function updateSighting(sightingId, { foundAt, notes }) {
  return db.transaction('rw', db.species, db.sightings, db.points, async () => {
    const sighting = await db.sightings.get(sightingId);
    if (!sighting) return;
    await db.sightings.update(sightingId, { foundAt, notes, updatedAt: Date.now() });
    if (sighting.speciesId && foundAt !== sighting.foundAt) {
      await refreshSpecies(sighting.speciesId);
      await recomputeSpeciesPoints(sighting.speciesId); // "ilk buluş" değişmiş olabilir
    }
  });
}

/** Bir buluşu fotoğrafı ve puanıyla birlikte siler. Türün son buluşuysa sayfa da kalkar. */
export async function deleteSighting(sightingId) {
  return db.transaction('rw', db.species, db.sightings, db.photos, db.points, async () => {
    const sighting = await db.sightings.get(sightingId);
    if (!sighting) return;
    await db.sightings.delete(sightingId);
    await db.photos.delete(sighting.photoId);
    await db.points.where('sightingId').equals(sightingId).delete();
    if (sighting.speciesId) {
      await refreshSpecies(sighting.speciesId);
      await recomputeSpeciesPoints(sighting.speciesId);
    }
  });
}

/** Tür sayfasındaki polaroidi başka bir fotoğrafla değiştirir. */
export async function setCoverPhoto(speciesId, photoId) {
  await db.species.update(speciesId, { coverPhotoId: photoId, updatedAt: Date.now() });
}
