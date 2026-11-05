# 🍄 Mantar Defteri

Orman yürüyüşlerinde gördüğün mantarları biriktirdiğin, telefonda çalışan bir keşif defteri.

> Mantar Defteri bir keşif defteridir, tüketim rehberi değildir. Fotoğrafla tür tespiti kesin değildir.

Yol haritası ve teknik kararlar için: [PLAN.md](PLAN.md)

---

## Telefonda çalıştırma (Expo Go)

Mantar Defteri artık bir **React Native (Expo)** telefon uygulaması. Geliştirirken uygulama
bilgisayarında çalışır, telefonundaki **Expo Go** uygulaması onu kablosuz olarak açar.

**Bir kez yapılır:**
1. Bilgisayarda [Node.js](https://nodejs.org) **22.13 veya üstü** kurulu olmalı
   (terminalde `node --version` ile bakabilirsin).
2. Telefonuna mağazadan **Expo Go** uygulamasını kur (Android: Play Store, iPhone: App Store).
3. Bu klasörde bir terminal açıp paketleri indir (paket listesi değişince de tekrarlanır):
   ```
   npm install
   ```

**Her seferinde:**
1. Telefon ve bilgisayar **aynı Wi-Fi**'de olmalı.
2. Terminalde uygulamayı başlat:
   ```
   npm start
   ```
   (Windows güvenlik duvarı izin isterse "İzin ver" de.)
3. Terminalde bir **QR kodu** belirir.
   - **Android:** Expo Go'yu aç → "Scan QR code" ile kodu okut.
   - **iPhone:** Telefonun kendi kamerasıyla kodu okut → çıkan bağlantıya dokun.
4. Kodu kaydettiğinde telefondaki uygulama kendiliğinden yenilenir.
5. Durdurmak için terminalde `Ctrl + C`.

> Aynı Wi-Fi'de bağlanamazsan (ör. okul/iş ağı): `npx expo start --tunnel` dene.

### Bilgisayarda (tarayıcıda) hızlıca bakmak
`npm run web` → `http://localhost:8081`. Bu sadece geliştirme kolaylığı içindir; kamera
yerine dosya seçici açılır ve bazı telefon özellikleri (titreşim, telefonun tarih seçicisi) yoktur.

### Web sürümüne geri dönmek istersen
React Native'e geçmeden önceki web sürümü git'te ayrı bir dalda, `web-son` dalında duruyor.
O sürüme bakmak için `git checkout web-son`, geri dönmek için `git checkout main`.

---

## Tür tanıma ve API anahtarı

Tanıma için **Evren LLM API** (`gemma-4-31b` modeli) kullanılıyor; şu an ücretsiz.
Anahtar yoksa uygulama **deneme modunda** çalışır: her fotoğrafa aynı üç türden sahte bir
sonuç verir.

### Anahtarı ayarlamak
1. Evren panelindeki `/api-keys` sayfasından bir anahtar oluştur (`evren_llm_...` diye başlar)
   ve kullanım şartlarını onayla.
2. Proje klasöründeki `.env.example` dosyasının bir kopyasını oluştur, adını `.env` yap.
3. `.env` dosyasını aç ve anahtarı yapıştır:
   ```
   EVREN_API_KEY=evren_llm_buraya-anahtarın
   ```
4. Terminalde `npm start` komutunu durdurup (`Ctrl + C`) yeniden başlat.
   Terminalde `🍄 Tür tanıma: Evren · gemma-4-31b` yazısını görmelisin.

### Model değiştirmek
`.env` içine `EVREN_MODEL=qwen3-vl-30b` yazarsan daha hızlı (≈5 sn) ama daha yüzeysel
metinler veren modele geçersin. Denemelerde en iyi sonucu `gemma-4-31b` verdi (≈12–20 sn).
`mimo-v2.6-pro` ve `deepseek-v4.1-flash` 80 saniyede yanıt vermediği için önerilmez.

### Otomatik yedek: Google Gemini (ücretsiz)
`.env` içinde `GEMINI_API_KEY` varsa, Evren hata verdiğinde (kredi bitti, kota doldu,
yanıt yok...) uygulama **kendiliğinden** Gemini'ye geçer. Kullanıcı bir şey fark etmez.
- Anahtar: https://aistudio.google.com/apikey (kart gerekmez)
- Model: `gemini-3.5-flash-lite` (~3–4 sn). `gemini-3.8-flash` daha güçlü ama ücretsiz
  katmanda sık sık "çok yoğun" hatası veriyor.
- Gizlilik: Google ücretsiz katmanda gönderilen içeriği ürünlerini geliştirmek için
  kullanabilir. Sadece fotoğraf gider; konum ve saha notları gönderilmez.
- Günlük ücretsiz limitler Google tarafından belirlenir; AI Studio'dan görebilirsin.

Terminalde şunu görürsün: `🍄 Tür tanıma: Evren · gemma-4-31b → yedek: Gemini · gemini-3.5-flash-lite`

Sırayı değiştirmek istersen (ör. 1 Aralık'tan sonra önce Gemini): `RECOGNIZER_ORDER=gemini,evren`

### Ücretli yedek: Claude
`ANTHROPIC_API_KEY` yazılırsa zincirin en sonuna eklenir (tanıma başına ~3–4 sent).
Kod hazır duruyor; şimdilik gerek yok.

### Anahtar neden güvende?
- `.env` dosyası **GitHub'a gönderilmez** (`.gitignore` içinde).
- Anahtar sadece bilgisayarda çalışan sunucu kodunda (`server/` ve `src/app/api/`) okunur.
  Telefona giden uygulama kodunda yer almaz; telefon fotoğrafı `/api/identify` adresine
  yollar, anahtarı sunucu ekler.
- Yayına alırken (6. aşama) anahtar Cloudflare panelinde "Environment variables" bölümüne girilir.

### Maliyet
Evren modelleri platformun bildirdiğine göre **1 Aralık 2026'ya kadar ücretsiz**. Sonrasında
fiyatlandırma "kredi" (CR) üzerinden olacak; o tarih yaklaşınca Evren panelinden kontrol et.
Ücretli olursa Gemini yedeği zaten hazır; Evren hata verdiği anda otomatik devralır.

---

## Klasörler kısaca

| Klasör | Ne var? |
|---|---|
| `src/app/` | Ekranlar (dosya adı = ekran): Ana Sayfa, Kitap, Tara, Geziler, Profil, Bekleyenler |
| `src/app/api/identify+api.js` | Tür tanıma adresi (bilgisayarda çalışır, API anahtarını kullanır) |
| `src/components/` | Tekrar kullanılan parçalar (menü, kitap, kapak, süslemeler, ikonlar, formlar) |
| `src/theme.js` | **Tüm renkler, yazı tipleri ve ölçüler** — görünümü buradan değiştirebilirsin |
| `src/data/` | Telefondaki veritabanı (SQLite) ve oyun kuralları (puan, seviye, rozet) |
| `src/services/` | Fotoğraf kaydetme, tür tanıma, **güvenlik süzgeci**, bekleyenler kuyruğu |
| `server/` | Tanıma servislerine bağlanan kod (Evren → Gemini → Claude) |
| `functions/` | Yayındaki sunucu için giriş dosyası (6. aşamada) |
| `assets/` | Kâğıt dokusu gibi görseller |
