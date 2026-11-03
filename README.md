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

## Klasörler kısaca

| Klasör | Ne var? |
|---|---|
| `src/screens/` | Ekranlar: Ana Sayfa, Kitap, Tara, Geziler, Profil |
| `src/components/` | Tekrar kullanılan parçalar (menü, kapak, süslemeler, ikonlar) |
| `src/styles/theme.css` | **Tüm renkler ve yazı tipleri** — görünümü buradan değiştirebilirsin |
| `src/data/` | Cihazdaki veritabanı ve oyun kuralları (puan, seviye, rozet) |
| `public/` | Simge gibi sabit dosyalar |
