/*
  YEREL VERİTABANI (SQLite)

  Tüm veriler telefonun içinde saklanır; internet gerekmez.
  Her tablo bir "kayıt kutusu" gibidir: her satırda kaydın kimliği (id) ve kaydın
  kendisi (doc, JSON metni) durur. Böylece kayıtlara istediğimiz alanı ekleyebiliriz;
  tablo yapısını değiştirmek gerekmez. Sık arama yapılan alanlar için dizin var.

  Her kayıtta benzersiz `id` ve `updatedAt` (son değişiklik zamanı) bulunur.
  İleride bulut senkronu eklersek hangi kaydın daha yeni olduğunu bunlardan anlarız.

  Kullanım (web sürümündeki Dexie'ye benzer):
    await tables.species.get(id)
    await tables.sightings.where('speciesId', id)
    await tables.points.add({ ... })
    await transaction(async () => { ... })     // ya hep ya hiç
*/
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mantar-defteri.db';

// Tablolar ve hızlı arama yapılacak alanları
const SCHEMA = {
  species: ['speciesKey', 'firstFoundAt'], // kitaptaki tür sayfaları
  sightings: ['speciesId', 'tripId', 'foundAt'], // her bir buluş (speciesId boşsa taslak)
  photos: ['sightingId'], // fotoğraf dosyalarının adları
  trips: ['startedAt', 'endedAt'], // geziler
  pending: ['createdAt'], // internet yokken tanınmayı bekleyen fotoğraflar
  points: ['sightingId', 'speciesId'], // puan hareketleri; toplam puan bunların toplamı
  badges: ['earnedAt'], // kazanılan rozetler (id = rozet anahtarı)
};

const SCHEMA_VERSION = 1;

let dbPromise = null;

/** Veritabanını açar (ilk çağrıda tabloları kurar). Hep aynı bağlantıyı döndürür. */
export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndMigrate().catch((err) => {
      dbPromise = null; // bir sonraki denemede yeniden açmayı dene
      throw err;
    });
  }
  return dbPromise;
}

async function openAndMigrate() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  const row = await db.getFirstAsync('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    const statements = ['PRAGMA journal_mode = WAL;'];
    for (const [name, indexed] of Object.entries(SCHEMA)) {
      statements.push(`CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY NOT NULL, doc TEXT NOT NULL);`);
      for (const field of indexed) {
        statements.push(
          `CREATE INDEX IF NOT EXISTS ${name}_${field} ON ${name} (json_extract(doc, '$.${field}'));`
        );
      }
    }
    statements.push(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    await db.execAsync(statements.join('\n'));
  }
  // İleride yapı değişirse: if (version < 2) { ... } şeklinde buraya eklenir.

  return db;
}

// ---------------------------------------------------------------- değişiklik bildirimi

/*
  Bir kayıt yazılınca ekranlar kendiliğinden yenilensin diye küçük bir bildirim sistemi.
  Aynı anda yapılan birçok yazma tek bir bildirimde toplanır.
*/
const listeners = new Set();
let notifyScheduled = false;
let transactionDepth = 0;
let changedDuringTransaction = false;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function markChanged() {
  if (transactionDepth > 0) {
    changedDuringTransaction = true; // işlem bitince bildir
    return;
  }
  if (notifyScheduled) return;
  notifyScheduled = true;
  setTimeout(() => {
    notifyScheduled = false;
    listeners.forEach((fn) => fn());
  }, 0);
}

/**
 * Birden fazla yazmayı "ya hep ya hiç" olarak yapar: arada hata çıkarsa hiçbiri kaydedilmez.
 * İç içe çağrılırsa dıştaki işleme katılır.
 */
export async function transaction(task) {
  const db = await getDb();
  if (transactionDepth > 0) return task();

  transactionDepth += 1;
  let result;
  try {
    await db.withTransactionAsync(async () => {
      result = await task();
    });
  } finally {
    transactionDepth -= 1;
    if (changedDuringTransaction) {
      changedDuringTransaction = false;
      markChanged();
    }
  }
  return result;
}

// ---------------------------------------------------------------- tablolar

const parse = (row) => (row ? JSON.parse(row.doc) : null);
const field = (name) => {
  if (!/^[A-Za-z]+$/.test(name)) throw new Error(`Geçersiz alan adı: ${name}`);
  return `json_extract(doc, '$.${name}')`;
};

function makeTable(name) {
  return {
    /** Kimliğe göre tek kayıt (yoksa null) */
    async get(id) {
      if (!id) return null;
      const db = await getDb();
      return parse(await db.getFirstAsync(`SELECT doc FROM ${name} WHERE id = ?`, id));
    },

    /** Birden çok kimlik → kayıtlar (bulunamayanlar atlanır) */
    async bulkGet(ids) {
      const list = [...new Set(ids.filter(Boolean))];
      if (!list.length) return [];
      const db = await getDb();
      const rows = await db.getAllAsync(
        `SELECT doc FROM ${name} WHERE id IN (${list.map(() => '?').join(',')})`,
        list
      );
      return rows.map(parse);
    },

    /** Tüm kayıtlar; orderBy verilirse o alana göre sıralı */
    async all({ orderBy, desc = false, limit } = {}) {
      const db = await getDb();
      let sql = `SELECT doc FROM ${name}`;
      if (orderBy) sql += ` ORDER BY ${field(orderBy)} ${desc ? 'DESC' : 'ASC'}`;
      if (limit) sql += ` LIMIT ${Number(limit)}`;
      return (await db.getAllAsync(sql)).map(parse);
    },

    /** Bir alanı verilen değere eşit olan kayıtlar (değer null ise boş olanlar) */
    async where(fieldName, value) {
      const db = await getDb();
      const rows =
        value == null
          ? await db.getAllAsync(`SELECT doc FROM ${name} WHERE ${field(fieldName)} IS NULL`)
          : await db.getAllAsync(`SELECT doc FROM ${name} WHERE ${field(fieldName)} = ?`, value);
      return rows.map(parse);
    },

    async count() {
      const db = await getDb();
      const row = await db.getFirstAsync(`SELECT COUNT(*) AS n FROM ${name}`);
      return row?.n ?? 0;
    },

    /** Yeni kayıt ekler (aynı kimlik varsa üzerine yazar) */
    async put(record) {
      const db = await getDb();
      await db.runAsync(`INSERT OR REPLACE INTO ${name} (id, doc) VALUES (?, ?)`, record.id, JSON.stringify(record));
      markChanged();
      return record;
    },

    async bulkPut(records) {
      if (!records.length) return;
      await transaction(async () => {
        for (const r of records) await this.put(r);
      });
    },

    /** Kaydın sadece verilen alanlarını değiştirir */
    async update(id, changes) {
      const current = await this.get(id);
      if (!current) return null;
      const next = { ...current, ...changes };
      await this.put(next);
      return next;
    },

    async delete(id) {
      if (!id) return;
      const db = await getDb();
      await db.runAsync(`DELETE FROM ${name} WHERE id = ?`, id);
      markChanged();
    },

    async deleteWhere(fieldName, value) {
      const db = await getDb();
      await db.runAsync(`DELETE FROM ${name} WHERE ${field(fieldName)} = ?`, value);
      markChanged();
    },
  };
}

export const tables = Object.fromEntries(Object.keys(SCHEMA).map((name) => [name, makeTable(name)]));

// ---------------------------------------------------------------- yardımcılar

/** Yeni benzersiz kimlik üretir */
export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Yeni bir kayda ortak alanları (id, zamanlar) ekler */
export function withMeta(record) {
  const now = Date.now();
  return { id: newId(), createdAt: now, updatedAt: now, ...record };
}
