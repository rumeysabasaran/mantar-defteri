/*
  CLAUDE (Anthropic) — Yedek tanıma servisi (ücretli)
  Sadece .env içinde EVREN_API_KEY yoksa ve ANTHROPIC_API_KEY varsa kullanılır.
*/
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, USER_TEXT, RESULT_SCHEMA, IdentifyError, parseJsonReply } from '../prompt.js';

export const CLAUDE_MODEL = 'claude-opus-5-5';

export async function askClaude({ image, mediaType, apiKey }) {
  const client = new Anthropic({ apiKey });

  let response;
  try {
    response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      // Güvenlik sınıflandırıcısı bir isteği yanlışlıkla reddederse,
      // Anthropic isteği otomatik olarak uygun başka bir modelle yeniden dener.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: RESULT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: USER_TEXT },
          ],
        },
      ],
    });
  } catch (err) {
    throw claudeError(err);
  }

  if (response.stop_reason === 'refusal') {
    throw new IdentifyError('refused', 'Bu fotoğraf için tanıma yapılamadı. Başka bir fotoğrafla dener misin?');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new IdentifyError('incomplete', 'Tanıma yanıtı yarım kaldı. Lütfen tekrar dene.');
  }
  return parseJsonReply(response.content.find((block) => block.type === 'text')?.text);
}

// En özel hatadan en genele doğru
function claudeError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    return new IdentifyError('bad-key', 'API anahtarı geçersiz. .env dosyasını kontrol et.', 500);
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new IdentifyError('no-permission', 'API anahtarının bu modele erişimi yok.', 500);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new IdentifyError('rate-limit', 'Çok fazla istek gönderildi. Biraz sonra tekrar dene.', 429);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new IdentifyError('unreachable', 'Tanıma servisine ulaşılamadı.', 503);
  }
  if (err instanceof Anthropic.APIError) {
    console.error('[identify:claude]', err.status, err.message);
    return new IdentifyError('api-error', `Tanıma servisi hata verdi (${err.status ?? '?'}).`, 502);
  }
  return err;
}
