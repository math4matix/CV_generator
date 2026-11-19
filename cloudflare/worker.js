const MAX_TEXTS = 50;
const MAX_CHARACTERS = 12000;

const jsonResponse = (body, status, origin) => {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '86400');
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowedOrigins = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const isCodespacesOrigin = /^https:\/\/[a-z0-9-]+-[a-z0-9-]+-\d+\.app\.github\.dev$/i.test(origin || '');

    if (!origin || (!allowedOrigins.includes(origin) && !isCodespacesOrigin)) {
      return jsonResponse({ error: 'Origin not allowed.' }, 403);
    }

    if (request.method === 'OPTIONS') {
      return jsonResponse({}, 204, origin);
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405, origin);
    }
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return jsonResponse({ error: 'Content-Type must be application/json.' }, 415, origin);
    }
    if (!env.DEEPL_API_KEY) {
      return jsonResponse({ error: 'DeepL API key is not configured.' }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, origin);
    }

    if (!Array.isArray(body?.texts) || body.texts.length > MAX_TEXTS ||
      body.texts.some((text) => typeof text !== 'string')) {
      return jsonResponse({ error: `Provide up to ${MAX_TEXTS} text values.` }, 400, origin);
    }
    const characterCount = body.texts.reduce((sum, text) => sum + text.length, 0);
    if (characterCount > MAX_CHARACTERS) {
      return jsonResponse({ error: `Text exceeds the ${MAX_CHARACTERS}-character request limit.` }, 413, origin);
    }
    if (body.texts.length === 0) {
      return jsonResponse({ translations: [] }, 200, origin);
    }

    let deeplResponse;
    try {
      deeplResponse = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: body.texts,
          target_lang: 'EN-US',
        }),
      });
    } catch {
      return jsonResponse({ error: 'Could not reach the DeepL translation service.' }, 502, origin);
    }

    if (!deeplResponse.ok) {
      return jsonResponse(
        { error: `DeepL returned an error (HTTP ${deeplResponse.status}).` },
        deeplResponse.status === 429 ? 429 : 502,
        origin,
      );
    }

    let result;
    try {
      result = await deeplResponse.json();
    } catch {
      return jsonResponse({ error: 'DeepL returned an invalid response.' }, 502, origin);
    }
    const translations = Array.isArray(result.translations)
      ? result.translations.map((item) => item.text)
      : null;
    if (!Array.isArray(translations) || translations.length !== body.texts.length ||
      translations.some((text) => typeof text !== 'string')) {
      return jsonResponse({ error: 'DeepL returned an unexpected response.' }, 502, origin);
    }

    return jsonResponse({ translations }, 200, origin);
  },
};
