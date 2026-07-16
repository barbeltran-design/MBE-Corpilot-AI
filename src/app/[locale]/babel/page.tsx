'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
import type { ChatMessage, SessionDoc } from '@/types/firestore';

// Preguntas de la Fase 0 (una por una)
const PHASE_0_QUESTIONS = {
  es: [
    { key: 'giro', question: '### 1. Giro y nicho específico\n\n¿Qué vendes exactamente y a quién va dirigido?' },
    { key: 'ubicacion', question: '### 2. Geolocalización operativa\n\n¿En qué ciudad y país operará el negocio?' },
    { key: 'madurez', question: '### 3. Madurez actual\n\n¿Es una idea en papel, un MVP ya validado, o un negocio en marcha buscando escalar?' },
    { key: 'recursos', question: '### 4. Recursos disponibles\n\n¿Con qué activos, canales de venta o equipo humano cuentas actualmente?' },
    { key: 'ambicion', question: '### 5. Nivel de ambición financiera\n\n¿Buscas crear un autoempleo sostenible o una estructura escalable para levantar capital de inversionistas?' },
    { key: 'mision_vision', question: '### 6. Misión y visión\n\n¿Ya las tienes definidas o prefieres que las diseñemos desde cero?' },
    { key: 'utilidad_deseada', question: '### 7. Utilidad mensual deseada\n\n¿Cuánto dinero neto quisieras recibir mensualmente para vivir? (en tu moneda local)' },
    { key: 'sueldo_founder', question: '### 8. Sueldo del fundador\n\nSi vas a operar el negocio, ¿qué sueldo te asignarías para cubrir hasta 3 roles? (Administración, Comercial, Operación)' },
    { key: 'gastos', question: '### 9. Gastos fijos y variables\n\n¿Qué gastos fijos (renta, servicios, software) y gastos variables (materia prima, comisiones) identificas?' },
    { key: 'inversion', question: '### 10. Capacidad de inversión\n\n¿Cuánto capital estimas que podrías invertir al mes o al año para hacer crecer el negocio?' }
  ],
  en: [
    { key: 'giro', question: '### 1. Business Type and Niche\n\nWhat exactly do you sell and who is it for?' },
    { key: 'ubicacion', question: '### 2. Operational Location\n\nIn which city and country will the business operate?' },
    { key: 'madurez', question: '### 3. Current Maturity\n\nIs it an idea on paper, a validated MVP, or an ongoing business seeking to scale?' },
    { key: 'recursos', question: '### 4. Available Resources\n\nWhat assets, sales channels, or human resources do you currently have?' },
    { key: 'ambicion', question: '### 5. Financial Ambition Level\n\nAre you looking to create sustainable self-employment or a scalable structure to raise capital from investors?' },
    { key: 'mision_vision', question: '### 6. Mission and Vision\n\nDo you already have them defined or would you prefer us to design them from scratch?' },
    { key: 'utilidad_deseada', question: '### 7. Desired Monthly Profit\n\nHow much net money would you like to receive monthly to live? (in your local currency)' },
    { key: 'sueldo_founder', question: '### 8. Founder\'s Salary\n\nIf you\'re going to run the business, what salary would you assign yourself to cover up to 3 roles? (Administration, Commercial, Operations)' },
    { key: 'gastos', question: '### 9. Fixed and Variable Costs\n\nWhat fixed costs (rent, services, software) and variable costs (raw materials, commissions) do you identify?' },
    { key: 'inversion', question: '### 10. Investment Capacity\n\nHow much capital do you estimate you could invest per month or per year to grow the business?' }
  ]
};

export default function BabelPage() {
  const locale = useLocale() as 'es' | 'en';
  const t = useTranslations('babel');
  const router = useRouter();

  const [uid, setUid] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<SessionDoc | null>(null);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Estado para el flujo de preguntas una por una
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [phase0Answers, setPhase0Answers] = React.useState<Record<string, string>>({});
  const [isPhase0Complete, setIsPhase0Complete] = React.useState(false);
  
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const questions = PHASE_0_QUESTIONS[locale];

  // 1. Autenticación y carga de sesión
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

  // 2. Auto-scroll al fondo del chat
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length]);

  // 3. Inyectar la primera pregunta automáticamente al iniciar
  React.useEffect(() => {
    if (!session || isPhase0Complete) return;
    if (session.messages.length === 0 && currentQuestionIndex === 0) {
      const firstQuestion = questions[0];
      const questionMsg: ChatMessage = {
        role: 'assistant',
        content: `¡Hola! Soy **Babel**, Strategic Business Architect & Sustainability Lead de MBE Corp.\n\nPara iniciar con el pie derecho, te haré **10 preguntas clave** una por una. Responde con calma.\n\n**Nota:** Usa la tecla Enter para bajar de renglón. El mensaje solo se envía cuando presionas el botón "Enviar".\n\n---\n\n${firstQuestion}`,
        timestamp: Timestamp.now(),
      };
      setSession(prev => prev ? { ...prev, messages: [questionMsg] } : prev);
    }
  }, [session, currentQuestionIndex, isPhase0Complete, questions]);

  const currentPhase = session?.currentPhase ?? 0;
  const allPhasesDone = currentPhase >= BABEL_IMPLEMENTED_PHASES;
  const lastMessage = session?.messages[session.messages.length - 1];
  const awaitingApproval =
    !allPhasesDone &&
    !!lastMessage &&
    lastMessage.role === 'assistant' &&
    lastMessage.content.includes(babelApprovalMarker(locale));

  // 4. Manejar respuesta en Fase 0 (Pregunta por pregunta)
  async function handlePhase0Answer() {
    if (!input.trim() || !uid || !session) return;
    const answer = input.trim();
    setInput('');
    setSending(true);

    const updatedAnswers = { ...phase0Answers, [questions[currentQuestionIndex].key]: answer };
    setPhase0Answers(updatedAnswers);

    const userMsg: ChatMessage = {
      role: 'user',
      content: answer,
      timestamp: Timestamp.now(),
    };

    if (currentQuestionIndex === questions.length - 1) {
      // ÚLTIMA PREGUNTA: Enviar todo a la API
      try {
        const phase0Summary = Object.entries(updatedAnswers)
          .map(([key, value]) => `**${key}**: ${value}`)
          .join('\n\n');

        const summaryMsg: ChatMessage = {
          role: 'user',
          content: `Fase 0 completada:\n\n${phase0Summary}`,
          timestamp: Timestamp.now(),
        };

        const allMessages = [...session.messages, userMsg, summaryMsg];
        
        const res = await fetch('/api/babel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            language: locale,
            phase: 0,
            phase0Complete: true,
            phase0Data: updatedAnswers,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Error al procesar Fase 0');

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.reply as string,
          timestamp: Timestamp.now(),
        };
        
        const finalMessages = [...allMessages, assistantMsg];
        setSession((prev) => (prev ? { ...prev, messages: finalMessages } : prev));
        await saveBabelMessages(uid, finalMessages);
        setIsPhase0Complete(true); // Esto saldrá del modo wizard y entrará al chat normal
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar');
      } finally {
        setSending(false);
      }
    } else {
      // PREGUNTAS INTERMEDIAS: Guardar y avanzar automáticamente
      const updatedMessages = [...session.messages, userMsg];
      setSession((prev) => (prev ? { ...prev, messages: updatedMessages } : prev));
      await saveBabelMessages(uid, updatedMessages);
      
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Inyectar la siguiente pregunta automáticamente
      const nextQuestion = questions[nextIndex];
      const nextQuestionMsg: ChatMessage = {
        role: 'assistant',
        content: nextQuestion,
        timestamp: Timestamp.now(),
      };
      
      const messagesWithNextQuestion = [...updatedMessages, nextQuestionMsg];
      setSession((prev) => (prev ? { ...prev, messages: messagesWithNextQuestion } : prev));
      await saveBabelMessages(uid, messagesWithNextQuestion);
      
      setSending(false);
    }
  }

  // 5. Manejar mensajes de chat normal (Fases 1-5)
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
      if (!res.ok || data.error) throw new Error(data.error || 'Error genérico');

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
      const compiledText = compiled ? `### Plan Estratégico Compilado\n\n${compiled}` : 'No hay fases aprobadas para compilar aún.';
      const userMsg: ChatMessage = { role: 'user', content: '/compilar', timestamp: Timestamp.now() };
      const assistantMsg: ChatMessage = { role: 'assistant', content: compiledText, timestamp: Timestamp.now() };
      const finalMessages = [...session.messages, userMsg, assistantMsg];
      setSession({ ...session, messages: finalMessages });
      setInput('');
      await saveBabelMessages(uid, finalMessages);
    } finally {
      setSending(false);
    }
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push(`/${locale}`);
  }

  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">{t('loading')}</div>;
  }

  // ==========================================
  // VISTA 1: WIZARD DE FASE 0 (Pregunta por pregunta)
  // ==========================================
  const isPhase0Active = currentQuestionIndex < questions.length && !isPhase0Complete;

  if (isPhase0Active) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500">Fase 0: Calibración Inicial</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">Cerrar sesión</Button>
        </div>

        {/* Historial de respuestas previas */}
        {session.messages.length > 0 && (
          <Card className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[40vh]">
            {session.messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                {m.content}
              </div>
            ))}
          </Card>
        )}

        {/* Barra de progreso */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-sm text-slate-600">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>

        {/* Pregunta actual y formulario */}
        <Card className="p-6">
          <div className="whitespace-pre-wrap text-slate-900 mb-4 font-medium">
            {questions[currentQuestionIndex].question}
          </div>
          
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Previene el envío con Enter
              handlePhase0Answer();
            }}
            className="flex gap-2 items-end"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sin Shift = NO envía (permite nueva línea)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                }
              }}
              placeholder="Escribe tu respuesta aquí..."
              disabled={sending}
              rows={3}
              className="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="mb-0 h-10">
              {sending ? 'Enviando...' : t('send')}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: CHAT NORMAL (Fases 1-5 y posterior a Fase 0)
  // ==========================================
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{(session as any).phaseData?.topic || t('subtitle')}</p>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">Cerrar sesión</Button>
      </div>

      <Card className="flex-1 space-y-3 overflow-y-auto p-4 min-h-[60vh]">
        {session.messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
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
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">{error}</div>
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
            e.preventDefault(); // Previene el envío con Enter
            if (input.trim() === '/compilar' && allPhasesDone) {
              handleCompile();
            } else {
              sendMessage(input);
            }
          }}
          className="flex gap-2 items-end"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter sin Shift = NO envía (permite nueva línea)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder={t('placeholder')}
            disabled={sending || awaitingApproval}
            rows={3}
            className="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
          />
          <Button type="submit" disabled={sending || awaitingApproval || !input.trim()} className="mb-0 h-10">
            {t('send')}
          </Button>
        </form>
      </div>
    </div>
  );
}
