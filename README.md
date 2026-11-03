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

Tanıma için **Claude** (Anthropic) kullanılıyor. Anahtar yoksa uygulama **deneme modunda**
çalışır: her fotoğrafa aynı üç türden sahte bir sonuç verir. Bütün akışı böyle de deneyebilirsin.

### Gerçek tanımayı açmak
1. https://console.anthropic.com adresinde hesap aç, **Billing** bölümünden biraz kredi yükle
   (5 $ ile başlamak yeter).
2. **API Keys → Create Key** ile bir anahtar oluştur ve kopyala (`sk-ant-...` diye başlar).
3. Proje klasöründeki `.env.example` dosyasının bir kopyasını oluştur, adını `.env` yap.
4. `.env` dosyasını aç ve anahtarı yapıştır:
   ```
   ANTHROPIC_API_KEY=sk-ant-buraya-anahtarın
   ```
5. Terminalde `npm run dev` komutunu durdurup (`Ctrl + C`) yeniden başlat.
   Terminalde `🍄 Tür tanıma: Claude (gerçek tanıma)` yazısını görmelisin.

### Anahtar neden güvende?
- `.env` dosyası **GitHub'a gönderilmez** (`.gitignore` içinde).
- Anahtar sadece sunucu kodunda (`server/identify.js`) okunur. Telefona giden uygulama
  kodunda yer almaz; telefon fotoğrafı `/api/identify` adresine yollar, anahtarı sunucu ekler.
- Yayına alırken (6. aşama) anahtar Cloudflare panelinde "Environment variables" bölümüne girilir.

### Maliyet
Model: Claude Opus 5.5 (1 milyon token başına girdi 4 $, çıktı 20 $).
Telefon fotoğrafı göndermeden önce küçültüyor; **bir tanıma yaklaşık 3–4 sent** tutar.
Yani 100 mantar ≈ 3–4 $. Harcamanı console.anthropic.com → **Usage** sayfasından izleyebilir,
**Limits** bölümünden aylık üst sınır koyabilirsin.

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
