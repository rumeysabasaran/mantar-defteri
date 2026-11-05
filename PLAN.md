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

## 2. Teknik seçimler

**Kasım 2026:** Uygulama web (PWA) yerine **React Native** ile gerçek bir telefon uygulamasına
dönüştürüldü (Aşama 3.5). Amaç hız ya da mağaza değil; kaliteli, akıcı, telefona özgü bir his.
Web sürümünün son hali git'te ayrı `web-son` dalında duruyor; geliştirme `main` dalında React Native ile sürüyor.

| Konu | Seçim | Neden |
|---|---|---|
| Çatı | React Native + **Expo** (SDK 58) | Kamera, konum, dosya gibi telefon özellikleri hazır; Expo Go ile kablosuz deneme |
| Dil | JavaScript (JSX) | TypeScript'e göre okuması kolay |
| Ekranlar arası geçiş | Expo Router (dosya tabanlı) | `app/` klasöründeki her dosya bir ekran |
| Yerel veri | SQLite (`expo-sqlite`) | Telefonun kendi veritabanı; hızlı, internetsiz |
| Fotoğraflar | Uygulamanın kendi klasöründe dosya olarak | Veritabanı hafif kalır |
| Kamera / galeri | `expo-image-picker` + `expo-image-manipulator` | Telefonun kamerası; fotoğraf 1280 px'e küçültülür |
| Konum | `expo-location` | İzinle, tek seferlik konum |
| Animasyon / dokunma | Reanimated + Gesture Handler | Kitap sayfası parmağı 60 fps takip eder |
| Çizimler | `react-native-svg` | Web'deki ikon ve süslemeler aynen taşındı |
| Yazı tipleri | Cormorant Garamond (başlık), Nunito (metin) | Pakete gömülü, internetsiz de çalışır |
| API anahtarı | Küçük bir sunucu (`server/`) | Anahtar telefona hiç inmez |

## 3. Klasör yapısı

```
app/                    → Ekranlar (Expo Router: dosya adı = adres)
  _layout.jsx           → Yazı tipleri, veritabanı, genel çerçeve
  (tabs)/               → Alt menülü ekranlar: index (Ana Sayfa), kitap, tara, geziler, profil
  bekleyenler.jsx       → Çevrimdışı çekilen fotoğraflar
src/
  theme.js              → Renkler, yazı tipleri, ölçüler, gölgeler (tek yer)
  components/
    layout/             → Alt menü ve kamera butonu
    ui/                 → Kâğıt kart, buton, çip, süslemeler, ikonlar, alt pencere
    book/               → Kitap, kapak, sayfalar, sayfa çevirme
    scan/               → Tanıma akışı, adaylar, saha notu formu, kutlama
  data/
    db.js               → SQLite tabloları ve "veri değişti" bildirimi
    hooks.js            → Ekranların veriyi okuduğu kancalar
    catalog.js, fieldNotes.js, gamification.js → değişmedi
  services/
    safety.js           → Güvenlik süzgeci (sunucuyla ortak, değişmedi)
    recognizer.js       → Sunucuya fotoğraf gönderir
    photos.js           → Fotoğrafı küçültür, dosyaya kaydeder
    collection.js, pendingQueue.js → Kayıt ve bekleyenler mantığı
server/
  dev.js                → Bilgisayarda çalışan küçük tanıma sunucusu (telefon buna bağlanır)
  identify.js, providers/ → Evren → Gemini → Claude zinciri (değişmedi)
functions/api/identify.js → Yayın sunucusu (Cloudflare, 6. aşama)
```

## 4. Veri modeli (cihazda, SQLite)

Her kayıtta benzersiz `id` ve `updatedAt` var; böylece ileride bulut senkronu eklemek
için yapıyı değiştirmek gerekmez.

- **species** — Kitaptaki her tür sayfası (Türkçe/Latince ad, tanım, "Biliyor muydun?",
  nadirlik, ilk bulunma tarihi, görülme sayısı)
- **sightings** — Her bir buluş (fotoğraf, tarih, konum, hava, kimlerle, not, gezi,
  durum: `onaylı` veya `taslak`)
- **photos** — Fotoğraf dosyalarının yeri (büyük + küçük önizleme); dosyalar uygulama klasöründe
- **trips** — Geziler (başlangıç, bitiş, yer)
- **pending** — İnternet yokken çekilen, tanınmayı bekleyen fotoğraflar
- **points** — Puan hareketleri (toplam puan bunlardan hesaplanır)
- **badges** — Kazanılan rozetler

## 5. Tür tanıma servisi

**Seçilen: Evren LLM API, `gemma-4-31b`** (`server/providers/evren.js`). Ücretsiz
(platforma göre 1 Aralık 2026'ya kadar). OpenAI uyumlu biçim; görsel base64 olarak gider.
Beş görsel model aynı fotoğrafla denendi: gemma-4-31b en iyi metni verdi (~12 sn),
qwen3-vl-30b en hızlıydı ama yüzeyseldi, diğerleri çok yavaştı.
**Otomatik yedekleme zinciri** (`server/identify.js`): Evren → Gemini → Claude.
Bir servis hata verirse sıradakine geçilir. Gemini (`gemini-3.5-flash-lite`, ücretsiz katman,
Google'ın Interactions API'si) 1 Aralık sonrası için hazır; gerçek fotoğraflarla denendi
(~3 sn, doğru tür). Claude Opus 5.5 ücretli son yedek (`server/providers/claude.js`).
Hangi servis kullanılırsa kullanılsın yanıt aynı JSON kalıbında istenir (`server/prompt.js`,
yenebilirlik alanı yok), sonra sunucuda ve telefonda iki kez süzülür.
Yayın sunucusu olarak Cloudflare Pages seçildi: ücretsiz, ve tanıma 10 saniyeden uzun
sürse bile isteği kesmiyor (Netlify/Vercel ücretsiz planlarında bu sınır var).

Başlangıçtaki karşılaştırma:

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

- Uygulama telefona kurulu olduğu için kitap her zaman internetsiz açılır.
- Tüm veri cihazdadır → koleksiyon her zaman görünür.
- Bağlantı yokken çekilen fotoğraf **Bekleyenler** listesine düşer; bağlantı gelince
  tanıma yapılır ve kullanıcıya haber verilir.

## 7. Aşamalar

1. ✅ Proje yapısı, tema ve ana ekranlar
2. ✅ Fotoğraf çekme/yükleme ve tür tanıma entegrasyonu
3. ✅ Koleksiyon kitabı ve sayfa çevirme
3.5 ✅ React Native'e (Expo) geçiş: 1–3. aşamalardaki her şey telefon uygulaması olarak
   yeniden yazıldı; görünüm ve davranış aynı kaldı. Eklenenler: telefonun kendi kamerası,
   tarih seçicisi ve onay pencereleri, dokunuşta hafif titreşim, parmağı takip eden sayfa çevirme,
   aşağı çekerek kapanan alt pencereler
4. ⬜ Puan, rozet, seviye sistemi
5. ⬜ Gezi kayıtları ve profil ekranı
6. ⬜ Son rötuşlar, uygulama simgesi ve açılış ekranı, tanıma sunucusunu yayına alma,
   telefona kurulabilir sürüm (Android/iOS derlemesi)
