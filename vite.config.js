import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleIdentify } from './server/identify.js';
import { mockIdentify } from './server/mockIdentify.js';

/**
 * Bilgisayarda çalışırken /api/identify adresini sağlayan küçük eklenti.
 * .env dosyasındaki ANTHROPIC_API_KEY sadece burada (sunucu tarafında) okunur.
 * Anahtar yoksa deneme tanıyıcısı devreye girer.
 */
function identifyApi(env) {
  const middleware = async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.end();
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body = null;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      /* geçersiz istek: handleIdentify uygun hatayı döndürür */
    }

    const key = env.ANTHROPIC_API_KEY;
    const { status, body: out } = key ? await handleIdentify(body, key) : await mockIdentify(body);

    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(out));
  };

  return {
    name: 'mantar-defteri-identify-api',
    configureServer(server) {
      server.middlewares.use('/api/identify', middleware);
      const mode = env.ANTHROPIC_API_KEY ? 'Claude (gerçek tanıma)' : 'DENEME modu (.env içinde anahtar yok)';
      server.httpServer?.once('listening', () => console.log(`\n  🍄 Tür tanıma: ${mode}\n`));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/identify', middleware);
    },
  };
}

// Vite ayarları.
// host: true → aynı Wi-Fi'deki telefondan da açabilmen için
export default defineConfig(({ mode }) => {
  // '' öneki: VITE_ ile başlamayan değişkenleri de oku. Bunlar SADECE burada,
  // sunucu tarafında kalır; uygulama koduna (telefona) gönderilmez.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), identifyApi(env)],
    server: {
      host: true,
      port: 5173,
    },
  };
});
