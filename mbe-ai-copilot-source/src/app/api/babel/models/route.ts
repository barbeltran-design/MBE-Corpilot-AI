import { NextResponse } from 'next/server';

// Endpoint de diagnóstico (temporal): lista los modelos Gemini realmente
// disponibles para la GEMINI_API_KEY configurada en este proyecto de Vercel.
// gemini-2.5-flash dejó de estar disponible para keys nuevas (error 404:
// "This model models/gemini-2.5-flash is no longer available to new users"),
// así que en vez de adivinar un nombre de modelo desde conocimiento
// desactualizado, le preguntamos directamente a Google cuáles están vigentes.
// No expone la key: solo reenvía la lista de modelos de Google tal cual.
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no está configurada.' }, { status: 500 });
  }

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': apiKey },
  });

  const data = await res.json();
  return NextResponse.json({ upstreamStatus: res.status, data });
}
