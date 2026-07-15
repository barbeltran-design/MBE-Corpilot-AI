'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  getOrCreateBabelSession,
  saveBabelMessages,
  approveBabelPhase,
  compileApprovedPhases,
} from '@/lib/babel-session';
import { BABEL_IMPLEMENTED_PHASES, babelApprovalMarker } from '@/lib/babel-constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ChatMessage, SessionDoc } from '@/types/firestore';

// ---------------------------------------------------------------------------
// Babel AI — UI de chat con gate de aprobación por fase.
//
// ESTADO ACTUAL: las 6 fases (0-5) tienen system prompt real en
// src/app/api/babel/route.ts. Esta pantalla soporta la máquina de estados
// completa (currentPhase 0-5, aprobación explícita, avance de fase) y el
// comando /compilar, que se resuelve enteramente aquí (nunca se manda a
// Gemini): concatena los resúmenes de fases ya aprobadas en Firestore.
// ---------------------------------------------------------------------------

export default function BabelPage() {
  const locale = useLocale() as 'es' | 'en';
  const t = useTranslations('babel');
  const router = useRouter();

  const [uid, setUid] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<SessionDoc | null>(null);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push(`/${locale}`);
        return;
      }
      setUid(user.uid);
      const s = await getOrCreateBabelSession(user.uid, locale);
      setSession(s);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length]);

  const currentPhase = session?.currentPhase ?? 0;
  // Con las 6 fases (0-5) implementadas, currentPhase solo llega a
  // BABEL_IMPLEMENTED_PHASES (6) después de aprobar la Fase 5 — en ese punto
  // ya no hay más fases de chat, solo queda /compilar.
  const allPhasesDone = currentPhase >= BABEL_IMPLEMENTED_PHASES;
  const lastMessage = session?.messages[session.messages.length - 1];
  const awaitingApproval =
    !allPhasesDone &&
    !!lastMessage &&
    lastMessage.role === 'assistant' &&
    lastMessage.content.includes(babelApprovalMarker(locale));

  async function sendMessage(text: string) {
    if (!uid || !session || !text.trim()) return;
    setSending(true);
    setError(null);

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Timestamp.now(),
    };
    const historyForApi = [...session.messages, userMsg];
    setSession({ ...session, messages: historyForApi });
    setInput('');

    try {
      const res = await fetch('/api/babel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi.map((m) => ({ role: m.role, content: m.content })),
          language: locale,
          phase: currentPhase,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || t('errorGeneric'));
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply as string,
        timestamp: Timestamp.now(),
      };
      const finalMessages = [...historyForApi, assistantMsg];
      setSession((prev) => (prev ? { ...prev, messages: finalMessages } : prev));
      await saveBabelMessages(uid, finalMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setSending(false);
    }
  }

  async function handleApprove() {
    if (!uid || !session || !lastMessage) return;
    setSending(true);
    try {
      await approveBabelPhase(uid, currentPhase, lastMessage.content, locale);
      const refreshed = await getOrCreateBabelSession(uid, locale);
      setSession(refreshed);
    } finally {
      setSending(false);
    }
  }

  // /compilar se resuelve enteramente aquí, sin llamar a Gemini: junta los
  // resúmenes de todas las fases ya aprobadas (Firestore) en un solo texto,
  // sin resumir ni omitir nada.
  async function handleCompile() {
    if (!uid || !session) return;
    setSending(true);
    setError(null);
    try {
      const compiled = compileApprovedPhases(session);
      const compiledText = compiled ? `${t('compileHeader')}\n\n${compiled}` : t('compileEmpty');
      const userMsg: ChatMessage = { role: 'user', content: '/compilar', timestamp: Timestamp.now() };
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: compiledText,
        timestamp: Timestamp.now(),
      };
      const finalMessages = [...session.messages, userMsg, assistantMsg];
      setSession({ ...session, messages: finalMessages });
      setInput('');
      await saveBabelMessages(uid, finalMessages);
    } finally {
      setSending(false);
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
        <p className="text-sm text-slate-500">{session.topic}</p>
      </div>

      <Card className="flex-1 space-y-3 overflow-y-auto p-4">
        {session.messages.length === 0 && <p className="text-sm text-slate-400">{t('subtitle')}</p>}
        {session.messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2 text-sm ${
              m.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {allPhasesDone && (
        <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {t('allPhasesDone')}
        </Card>
      )}

      {awaitingApproval && (
        <Button onClick={handleApprove} variant="primary" disabled={sending} className="w-full">
          {currentPhase >= 5 ? t('approveFinalButton') : t('approveButton', { phase: currentPhase + 1 })}
        </Button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = input.trim();
          if (!trimmed) return;
          if (trimmed.toLowerCase() === '/compilar') {
            handleCompile();
          } else {
            sendMessage(trimmed);
          }
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? t('loadingReply') : t('send')}
        </Button>
      </form>
      <p className="text-xs text-slate-400">{t('compileHint')}</p>
    </div>
  );
}
