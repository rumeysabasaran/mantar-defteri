# 🍄 Mantar Defteri

Orman yürüyüşlerinde gördüğün mantarları biriktirdiğin, telefonda çalışan bir keşif defteri.

> Mantar Defteri bir keşif defteridir, tüketim rehberi değildir. Fotoğrafla tür tespiti kesin değildir.

Yol haritası ve teknik kararlar için: [PLAN.md](PLAN.md)

---

## Bilgisayarda çalıştırma

**Bir kez yapılır:** [Node.js](https://nodejs.org) kurulu olmalı (20 veya üstü).
Kurulu mu diye bakmak için terminale `node --version` yaz.

1. Bu klasörde bir terminal aç (VS Code'da: üst menü → Terminal → New Terminal).
2. Gerekli paketleri indir (sadece ilk seferde ve paket listesi değişince):
   ```
   npm install
   ```
3. Uygulamayı başlat:
   ```
   npm run dev
   ```
4. Terminalde görünen `http://localhost:5173` adresini tarayıcıda aç.
5. Durdurmak için terminalde `Ctrl + C`.

### Telefon görünümünde denemek
Chrome'da sayfadayken `F12` → sol üstteki telefon simgesi (Toggle device toolbar) →
üstten bir telefon modeli seç.

### Gerçek telefonda denemek
Telefon ve bilgisayar **aynı Wi-Fi**'de olmalı. `npm run dev` çalışırken terminalde
`Network: http://192.168.x.x:5173` gibi bir satır görürsün; bu adresi telefonun
tarayıcısına yaz. (Windows güvenlik duvarı sorarsa "İzin ver" de.)

> Not: "Ana ekrana ekle" ve çevrimdışı çalışma 6. aşamada eklenecek; o özellikler
> güvenli bağlantı (https) ister, onun için ayrıca yol göstereceğim.

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
4. Terminalde `npm run dev` komutunu durdurup (`Ctrl + C`) yeniden başlat.
   Terminalde `🍄 Tür tanıma: Evren · gemma-4-31b` yazısını görmelisin.

### Model değiştirmek
`.env` içine `EVREN_MODEL=qwen3-vl-30b` yazarsan daha hızlı (≈5 sn) ama daha yüzeysel
metinler veren modele geçersin. Denemelerde en iyi sonucu `gemma-4-31b` verdi (≈12–20 sn).
`mimo-v2.6-pro` ve `deepseek-v4.1-flash` 80 saniyede yanıt vermediği için önerilmez.

### Ücretli yedek: Claude
`EVREN_API_KEY` boş bırakılıp `ANTHROPIC_API_KEY` yazılırsa Claude kullanılır
(tanıma başına ~3–4 sent). Kod hazır duruyor; şimdilik gerek yok.

### Anahtar neden güvende?
- `.env` dosyası **GitHub'a gönderilmez** (`.gitignore` içinde).
- Anahtar sadece sunucu kodunda (`server/`) okunur. Telefona giden uygulama
  kodunda yer almaz; telefon fotoğrafı `/api/identify` adresine yollar, anahtarı sunucu ekler.
- Yayına alırken (6. aşama) anahtar Cloudflare panelinde "Environment variables" bölümüne girilir.

### Maliyet
Evren modelleri platformun bildirdiğine göre **1 Aralık 2026'ya kadar ücretsiz**. Sonrasında
fiyatlandırma "kredi" (CR) üzerinden olacak; o tarih yaklaşınca Evren panelinden kontrol et.
Ücretli olursa başka bir servise geçmek tek bir ayar değişikliği (`server/providers/`).

---

## Klasörler kısaca

| Klasör | Ne var? |
|---|---|
| `src/screens/` | Ekranlar: Ana Sayfa, Kitap, Tara, Geziler, Profil |
| `src/components/` | Tekrar kullanılan parçalar (menü, kapak, süslemeler, ikonlar) |
| `src/styles/theme.css` | **Tüm renkler ve yazı tipleri** — görünümü buradan değiştirebilirsin |
| `src/data/` | Cihazdaki veritabanı ve oyun kuralları (puan, seviye, rozet) |
| `src/services/` | Fotoğraf küçültme, tür tanıma, **güvenlik süzgeci**, bekleyenler kuyruğu |
| `server/` | Sadece sunucuda çalışan tanıma kodu (API anahtarı burada kullanılır) |
| `functions/` | Yayındaki sunucu (Cloudflare Pages) için giriş dosyası |
| `public/` | Simge gibi sabit dosyalar |
