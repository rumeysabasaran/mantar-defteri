# Mantar Defteri — Genel Plan

Orman yürüyüşlerini bir keşif oyununa dönüştüren, telefonda çalışan bir doğa defteri.
Bu dosya projenin yol haritasıdır; her aşama bitince güncellenir.

---

## 1. Değişmez kural: yenebilirlik bilgisi yok

- Arayüzde, verilerde ve tür tanıma sonuçlarında yenebilir / zehirli / tüketilebilir
  bilgisi **hiçbir şekilde** yer almaz (metin, ikon, renk, ima).
- Tanıma servisinden gelen yanıt, ekrana ulaşmadan önce tek bir "güvenlik süzgecinden"
  geçer (`src/services/safety.js`, 2. aşama). Süzgeç izin verilen alanlar dışındaki her
  şeyi atar ve metinlerde yasaklı kelimeleri arar.
- Not her yerde görünür: *"Mantar Defteri bir keşif defteridir, tüketim rehberi değildir.
  Fotoğrafla tür tespiti kesin değildir."*

## 2. Teknik seçimler (sade tutuldu)

| Konu | Seçim | Neden |
|---|---|---|
| Arayüz | React 18 + Vite | Yaygın, hızlı, bol kaynak |
| Dil | JavaScript (JSX) | TypeScript'e göre okuması kolay |
| Sayfa geçişleri | React Router (hash modu) | Her sunucuda ek ayarsız çalışır |
| Yerel veri | IndexedDB, Dexie kütüphanesiyle | Fotoğrafları (Blob) da saklar, ileride Dexie Cloud ile senkron |
| Yazı tipleri | Cormorant Garamond (başlık), Nunito (metin) | Pakete gömülü, internetsiz de çalışır |
| PWA | vite-plugin-pwa (6. aşama) | Ana ekrana ekleme + çevrimdışı önbellek |
| API anahtarı | Küçük bir sunucu fonksiyonu (Netlify / Vercel) | Anahtar telefona hiç inmez |

## 3. Klasör yapısı

```
src/
  main.jsx              → Uygulamanın giriş noktası
  App.jsx               → Sayfa yönlendirmeleri (rotalar)
  styles/               → Tema (renkler, yazı tipleri), genel stiller
  components/
    layout/             → Uygulama iskeleti, alt menü, kamera butonu
    ui/                 → Tekrar kullanılan parçalar: kâğıt kart, süslemeler, ikonlar
    book/               → Kitap kapağı, sayfalar, sayfa çevirme (3. aşama)
  screens/              → Tam ekranlar: Ana Sayfa, Kitap, Tara, Geziler, Profil
  data/
    db.js               → IndexedDB tabloları
    hooks.js            → Ekranların veriyi okuduğu kancalar
    gamification.js     → Puanlar, seviyeler, rozet tanımları
  services/             → Tür tanıma, güvenlik süzgeci, bekleyenler kuyruğu (2. aşama)
api/ veya netlify/functions/
  identify.js           → API anahtarını saklayan sunucu fonksiyonu (2. aşama)
```

## 4. Veri modeli (cihazda, IndexedDB)

Her kayıtta benzersiz `id` ve `updatedAt` var; böylece ileride bulut senkronu eklemek
için yapıyı değiştirmek gerekmez.

- **species** — Kitaptaki her tür sayfası (Türkçe/Latince ad, tanım, "Biliyor muydun?",
  nadirlik, ilk bulunma tarihi, görülme sayısı)
- **sightings** — Her bir buluş (fotoğraf, tarih, konum, hava, kimlerle, not, gezi,
  durum: `onaylı` veya `taslak`)
- **photos** — Fotoğrafların kendisi ve küçük önizlemesi
- **trips** — Geziler (başlangıç, bitiş, yer)
- **pending** — İnternet yokken çekilen, tanınmayı bekleyen fotoğraflar
- **points** — Puan hareketleri (toplam puan bunlardan hesaplanır)
- **badges** — Kazanılan rozetler

## 5. Tür tanıma servisi (öneri — 2. aşamada netleşecek)

Kodda bir "tanıyıcı adaptörü" olacak; servis değiştirmek tek dosyayı değiştirmek demek.

**A) Claude (Anthropic) — görsel analiz yapabilen yapay zekâ** *(önerilen başlangıç)*
- ✅ Tek istekte en olası 3 tür + güven yüzdesi + Türkçe tanım + "Biliyor muydun?" +
  nadirlik döndürebilir. Kitap sayfasını doldurmak için ayrı bir tür veritabanı gerekmez.
- ✅ Yanıtın biçimini biz belirleriz; yenebilirlik alanı hiç istenmez.
- ➖ Mantara özel eğitilmiş bir model değildir; benzer türlerde yanılabilir.
- 💰 Fotoğraf başına düşük bir maliyet (kuruşlar mertebesi). Güncel fiyatı 2. aşamada
  doğrulayıp yazacağım.

**B) Kindwise mushroom.id — mantara özel tanıma API'si**
- ✅ Mantarlar için eğitilmiş; tür tahmininde genelde daha isabetli.
- ➖ Yanıtta yenebilirlik bilgisi var → süzgeçle atılmalı.
- ➖ Türkçe metin yok; tanımlar için ikinci bir kaynak gerekir.
- 💰 Kredi başına ücretli, deneme kredisi var. Güncel fiyat 2. aşamada.

**API anahtarı nereye?** Anahtar sadece sunucu fonksiyonunun ortam değişkeninde durur
(yerelde `.env` dosyası, yayında Netlify/Vercel panelindeki "Environment variables").
Telefon fotoğrafı bizim fonksiyonumuza yollar, fonksiyon anahtarı ekleyip servise iletir.

## 6. Çevrimdışı çalışma

- Uygulama dosyaları ve yazı tipleri önbelleğe alınır → kitap internetsiz açılır.
- Tüm veri cihazdadır → koleksiyon her zaman görünür.
- Bağlantı yokken çekilen fotoğraf **Bekleyenler** listesine düşer; bağlantı gelince
  tanıma yapılır ve kullanıcıya haber verilir.

## 7. Aşamalar

1. ✅ Proje yapısı, tema ve ana ekranlar
2. ⬜ Fotoğraf çekme/yükleme ve tür tanıma entegrasyonu
3. ⬜ Koleksiyon kitabı ve sayfa çevirme
4. ⬜ Puan, rozet, seviye sistemi
5. ⬜ Gezi kayıtları ve profil ekranı
6. ⬜ PWA, çevrimdışı çalışma ve son rötuşlar
