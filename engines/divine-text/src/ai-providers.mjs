const SYSTEM_PROMPT = `You are a source-critical research assistant for Divine Text Verification.\nRules:\n1) Never invent citations, manuscripts, dates, or quotations.\n2) Separate direct evidence, interpretation, inference, and unknowns.\n3) Never convert PENDING into false/zero or a confident conclusion.\n4) Do not assign a score without an evidence basis.\n5) When evidence is insufficient, say UNRESOLVED.\nReturn concise, auditable prose.`;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function extractGeminiText(json) {
  const parts = json?.candidates?.flatMap(c => c?.content?.parts ?? []) ?? [];
  return parts.map(p => p?.text ?? '').join('').trim();
}

function extractOpenAIText(json) {
  if (typeof json?.output_text === 'string') return json.output_text.trim();
  const items = json?.output ?? [];
  return items.flatMap(item => item?.content ?? []).map(part => part?.text ?? '').join('').trim();
}

export async function askOpenAI(prompt, { model = process.env.OPENAI_MODEL || 'gpt-5.6' } = {}) {
  const apiKey = requireEnv('OPENAI_API_KEY');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input: [
      { role: 'developer', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ] })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${json?.error?.message ?? 'request failed'}`);
  return { provider: 'openai', model, text: extractOpenAIText(json), request_id: json?.id ?? null };
}

export async function askGemini(prompt, { model = process.env.GEMINI_MODEL || 'gemini-3.7-flash' } = {}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Missing environment variable: GEMINI_API_KEY or GOOGLE_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}: ${json?.error?.message ?? 'request failed'}`);
  return { provider: 'gemini', model, text: extractGeminiText(json), request_id: json?.responseId ?? null };
}

export async function askAI(prompt, options = {}) {
  const provider = (options.provider || process.env.DTV_AI_PROVIDER || 'deterministic').toLowerCase();
  if (provider === 'openai') return askOpenAI(prompt, options);
  if (provider === 'gemini') return askGemini(prompt, options);
  if (provider === 'deterministic') return { provider: 'deterministic', model: null, text: null, status: 'DISABLED' };
  throw new Error(`Unsupported AI provider: ${provider}`);
}

export function providerStatus() {
  const selected = (process.env.DTV_AI_PROVIDER || 'deterministic').toLowerCase();
  return {
    selected,
    openai_configured: Boolean(process.env.OPENAI_API_KEY),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    deterministic_available: true
  };
}
