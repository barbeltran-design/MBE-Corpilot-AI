import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
type TranslateBody = {
  text: string;
  targetLang: 'es' | 'en';
};
function buildPrompt(text: string, targetLang: 'es' | 'en'): { system: string; user: string } {
  const targetName = targetLang === 'en' ? 'English' : 'Spanish';
  const system =
    'You are a professional translator specialized in business documents. ' +
    'Translate the text the user sends into ' + targetName + '. ' +
    'Keep ALL markdown formatting exactly as-is (###, **, ---, line breaks, lists). ' +
    'Do not add any commentary, notes, or explanations. Output ONLY the translated text.';
  return { system: system, user: text };
}
async function tryGroq(text: string, targetLang: 'es' | 'en'): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const built = buildPrompt(text, targetLang);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: built.system },
        { role: 'user', content: built.user },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
  return typeof content === 'string' ? content : null;
}
async function tryOpenRouter(text: string, targetLang: 'es' | 'en'): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const built = buildPrompt(text, targetLang);
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: built.system },
        { role: 'user', content: built.user },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
  return typeof content === 'string' ? content : null;
}
async function tryGemini(text: string, targetLang: 'es' | 'en'): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  const built = buildPrompt(text, targetLang);
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: built.system + '\n\n---\n\n' + built.user }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const content =
    data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
      ? data.candidates[0].content.parts[0].text
      : null;
  return typeof content === 'string' ? content : null;
}
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateBody;
    const text = (body && body.text ? body.text : '').toString();
    const targetLang = body && body.targetLang === 'en' ? 'en' : 'es';
    if (!text.trim()) {
      return NextResponse.json({ translation: text });
    }
    let translation: string | null = null;
    try {
      translation = await tryGroq(text, targetLang);
    } catch {
      translation = null;
    }
    if (!translation) {
      try {
        translation = await tryOpenRouter(text, targetLang);
      } catch {
        translation = null;
      }
    }
    if (!translation) {
      try {
        translation = await tryGemini(text, targetLang);
      } catch {
        translation = null;
      }
    }
    if (!translation) {
      return NextResponse.json(
        { error: 'No se pudo traducir. Revisa que las API keys en Vercel sean validas (Groq, OpenRouter, Gemini).' },
        { status: 502 }
      );
    }
    return NextResponse.json({ translation: translation.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al traducir';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
