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
  }, [locale, router]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length]);

  const currentPhase = session?.currentPhase ?? 0;
  const allPhasesDone = currentPhase >= BABEL_IMPLEMENTED_PHASES;
  const lastMessage = session?.messages?.[session.messages.length - 1];
  
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
        throw new Error(data.error || 'Error genérico al procesar la solicitud');
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
      setError(err instanceof Error ? err.message : 'Error genérico');
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

  async function handleCompile() {
    if (!uid || !session) return;
    setSending(true);
    setError(null);
    try {
      const compiled = compileApprovedPhases(session);
      const compiledText = compiled 
        ? `### Plan Estratégico Compilado\n\n${compiled}` 
        : 'No hay fases aprobadas para compilar aún.';
        
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
        {/* Corregido: session.topic no existe, usamos phaseData o un fallback */}
        <p className="text-sm text-slate-500">
          {session.phaseData?.topic || t('subtitle')}
        </p>
      </div>

      <Card className="flex-1 space-y-3 overflow-y-auto p-4 min-h-[60vh]">
        {session.messages.length === 0 && (
          <p className="text-sm text-slate-400">{t('subtitle')}</p>
        )}
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
        {sending && (
          <div className="max-w-[85%] rounded-xl bg-slate-100 px-3.5 py-2 text-sm text-slate-500 animate-pulse">
            {t('loadingReply')}
          </div>
        )}
        <div ref={bottomRef} />
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {awaitingApproval && (
          <Button onClick={handleApprove} disabled={sending} className="w-full">
            {allPhasesDone ? t('approveFinalButton') : t('approveButton', { phase: currentPhase })}
          </Button>
        )}
        
        {allPhasesDone && !awaitingApproval && (
           <Button onClick={handleCompile} disabled={sending} variant="outline" className="w-full">
             Compilar Plan Completo (/compilar)
           </Button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() === '/compilar' && allPhasesDone) {
              handleCompile();
            } else {
              sendMessage(input);
            }
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            disabled={sending || awaitingApproval}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || awaitingApproval || !input.trim()}>
            {t('send')}
          </Button>
        </form>
      </div>
    </div>
  );
}
