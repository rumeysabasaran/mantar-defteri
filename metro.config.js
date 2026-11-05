/*
  METRO AYARLARI — Expo'nun paketleyicisi.
  Sadece web önizlemesi için iki ek ayar var (telefonu etkilemez):
  - .wasm dosyaları: SQLite'ın tarayıcıda çalışan sürümü bunları kullanır.
  - İki güvenlik başlığı: tarayıcı, SQLite'ın ihtiyaç duyduğu paylaşımlı belleğe ancak bunlarla izin verir.
*/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
