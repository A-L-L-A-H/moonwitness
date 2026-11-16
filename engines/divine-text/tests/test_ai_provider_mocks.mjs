import assert from 'node:assert/strict';
import {askOpenAI, askGemini} from '../src/ai-providers.mjs';

const originalFetch = globalThis.fetch;
const originalOpenAI = process.env.OPENAI_API_KEY;
const originalGemini = process.env.GEMINI_API_KEY;

try {
  process.env.OPENAI_API_KEY = 'test-key';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.authorization, 'Bearer test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'test-openai');
    return new Response(JSON.stringify({ id: 'resp_test', output_text: 'OPENAI_OK' }), {status: 200, headers: {'content-type':'application/json'}});
  };
  const o = await askOpenAI('hello', {model:'test-openai'});
  assert.equal(o.text, 'OPENAI_OK');

  process.env.GEMINI_API_KEY = 'test-gemini';
  globalThis.fetch = async (url, options) => {
    assert.match(url, /generativelanguage\.googleapis\.com\/v1beta\/models\/test-gemini-model:generateContent\?key=test-gemini/);
    const body = JSON.parse(options.body);
    assert.equal(body.contents[0].parts[0].text, 'hello');
    return new Response(JSON.stringify({ responseId:'gem_test', candidates:[{content:{parts:[{text:'GEMINI_OK'}]}}] }), {status: 200, headers: {'content-type':'application/json'}});
  };
  const g = await askGemini('hello', {model:'test-gemini-model'});
  assert.equal(g.text, 'GEMINI_OK');

  console.log('AI provider mock tests: 2/2 passed');
} finally {
  globalThis.fetch = originalFetch;
  if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalOpenAI;
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
}
