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
import { Input } from '@/components/ui/input';
import type { ChatMessage, SessionDoc } from '@/types/firestore';

// Preguntas de la Fase 0 (una por una)
const PHASE_0_QUESTIONS = {
  es: [
    {
      key: 'giro',
      question: '### 1. Giro y nicho específico\n\n¿Qué vendes exactamente y a quién va dirigido?',
      placeholder: 'Ej. Vendemos pan artesanal a familias de clase media en la Ciudad de México...'
    },
    {
      key: 'ubicacion',
      question: '### 2. Geolocalización operativa\n\n¿En qué ciudad y país operará el negocio?',
      placeholder: 'Ej. Ciudad de México, México'
    },
    {
      key: 'madurez',
      question: '### 3. Madurez actual\n\n¿Es una idea en papel, un MVP ya validado, o un negocio en marcha buscando escalar?',
      placeholder: 'Ej. Tenemos un MVP validado con 50 clientes...'
    },
    {
      key: 'recursos',
      question: '### 4. Recursos disponibles\n\n¿Con qué activos, canales de venta o equipo humano cuentas actualmente?',
      placeholder: 'Ej. Tenemos un local de 50m2, 2 empleados y ventas por Instagram...'
    },
    {
      key: 'ambicion',
      question: '### 5. Nivel de ambición financiera\n\n¿Buscas crear un autoempleo sostenible o una estructura escalable para levantar capital de inversionistas?',
      placeholder: 'Ej. Busco una estructura escalable para levantar capital...'
    },
    {
      key: 'mision_vision',
      question: '### 6. Misión y visión\n\n¿Ya las tienes definidas o prefieres que las diseñemos desde cero?',
      placeholder: 'Ej. Aún no las tenemos, necesitamos ayuda...'
    },
    {
      key: 'utilidad_deseada',
      question: '### 7. Utilidad mensual deseada\n\n¿Cuánto dinero neto quisieras recibir mensualmente para vivir? (en tu moneda local)',
      placeholder: 'Ej. $30,000 MXN mensuales'
    },
    {
      key: 'sueldo_founder',
      question: '### 8. Sueldo del fundador\n\nSi vas a operar el negocio, ¿qué sueldo te asignarías para cubrir hasta 3 roles? (Administración, Comercial, Operación)',
      placeholder: 'Ej. $25,000 MXN (Admin: $10k, Comercial: $10k, Operación: $5k)'
    },
    {
      key: 'gastos',
      question: '### 9. Gastos fijos y variables\n\n¿Qué gastos fijos (renta, servicios, software) y gastos variables (materia prima, comisiones) identificas?',
      placeholder: 'Ej. Fijos: $15,000 (renta $8k, servicios $2k, software $1k, otros $4k). Variables: 40% de las ventas'
    },
    {
      key: 'inversion',
      question: '### 10. Capacidad de inversión\n\n¿Cuánto capital estimas que podrías invertir al mes o al año para hacer crecer el negocio?',
      placeholder: 'Ej. $5,000 MXN mensuales o $60,000 anuales'
    }
  ],
  en: [
    {
      key: 'giro',
      question: '### 1. Business Type and Niche\n\nWhat exactly do you sell and who is it for?',
      placeholder: 'e.g. We sell artisanal bread to middle-class families in Mexico City...'
    },
    {
      key: 'ubicacion',
      question: '### 2. Operational Location\n\nIn which city and country will the business operate?',
      placeholder: 'e.g. Mexico City, Mexico'
    },
    {
      key: 'madurez',
      question: '### 3. Current Maturity\n\nIs it an idea on paper, a validated MVP, or an ongoing business seeking to scale?',
      placeholder: 'e.g. We have a validated MVP with 50 customers...'
    },
    {
      key: 'recursos',
      question: '### 4. Available Resources\n\nWhat assets, sales channels, or human resources do you currently have?',
      placeholder: 'e.g. We have a 50m2 store, 2 employees, and Instagram sales...'
    },
    {
      key: 'ambicion',
      question: '### 5. Financial Ambition Level\n\nAre you looking to create sustainable self-employment or a scalable structure to raise capital from investors?',
      placeholder: 'e.g. I\'m looking for a scalable structure to raise capital...'
    },
    {
      key: 'mision_vision',
      question: '### 6. Mission and Vision\n\nDo you already have them defined or would you prefer us to design them from scratch?',
      placeholder: 'e.g. We don\'t have them yet, we need help...'
    },
    {
      key: 'utilidad_deseada',
      question: '### 7. Desired Monthly Profit\n\nHow much net money would you like to receive monthly to live? (in your local currency)',
      placeholder: 'e.g. $30,000 MXN monthly'
    },
    {
      key: 'sueldo_founder',
      question: '### 8. Founder\'s Salary\n\nIf you\'re going to run the business, what salary would you assign yourself to cover up to 3 roles? (Administration, Commercial, Operations)',
      placeholder: 'e.g. $25,000 MXN (Admin: $10k, Commercial: $10k, Operations: $5k)'
    },
    {
      key: 'gastos',
      question: '### 9. Fixed and Variable Costs\n\nWhat fixed costs (rent, services, software) and variable costs (raw materials, commissions) do you identify?',
      placeholder: 'e.g. Fixed: $15,000 (rent $8k, services $2k, software $1k, others $4k). Variable: 40% of sales'
    },
    {
      key: 'inversion',
      question: '### 10. Investment Capacity\n\nHow much capital do you estimate you could invest per month or per year to grow the business?',
      placeholder: 'e.g. $5,000 MXN monthly or $60,000 annually'
    }
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
  
  // Estado para preguntas una por una
  const [waitingForPhase0Answer, setWaitingForPhase0Answer] = React.useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [phase0Answers, setPhase0Answers] = React.useState<Record<string, string>>({});
  const [isPhase0Complete, setIsPhase0Complete] = React.useState(false);
  
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const questions = PHASE_0_QUESTIONS[locale];
  const currentQuestion = questions[currentQuestionIndex];

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
  const lastMessage = session?.messages[session.messages.length - 1];
  const awaitingApproval =
    !allPhasesDone &&
    !!lastMessage &&
    lastMessage.role === 'assistant' &&
    lastMessage.content.includes(babelApprovalMarker(locale));

  // Manejar respuesta de pregunta individual
  async function handleAnswerQuestion() {
    if (!input.trim()) return;
    
    // Guardar respuesta
    const updatedAnswers = {
      ...phase0Answers,
      [currentQuestion.key]: input.trim()
    };
    setPhase0Answers(updatedAnswers);
    setInput('');

    // Verificar si es la última pregunta
    if (currentQuestionIndex === questions.length - 1) {
      // Enviar todas las respuestas a la API
      await sendPhase0Data(updatedAnswers);
      setIsPhase0Complete(true);
    } else {
      // Pasar a la siguiente pregunta
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  // Enviar datos completos de Fase 0 a la API
  async function sendPhase0Data(answers: Record<string, string>) {
    if (!uid || !session) return;
    setSending(true);
    setError(null);

    const phase0Summary = Object.entries(answers)
      .map(([key, value]) => `**${key}**: ${value}`)
      .join('\n\n');

    const userMsg: ChatMessage = {
      role: 'user',
      content: `Fase 0 completada:\n\n${phase0Summary}`,
      timestamp: Timestamp.now(),
    };

    try {
      const res = await fetch('/api/babel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...session.messages, userMsg],
          language: locale,
          phase: 0,
          phase0Data: answers, // Enviar datos estructurados
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al procesar Fase 0');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply as string,
        timestamp: Timestamp.now(),
      };
      
      const finalMessages = [...session.messages, userMsg, assistantMsg];
      setSession((prev) => (prev ? { ...prev, messages: finalMessages } : prev));
      await saveBabelMessages(uid, finalMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setSending(false);
    }
  }

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
        throw new Error(data.error || 'Error genérico');
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

  // Cerrar sesión
  async function handleLogout() {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push(`/${locale}`);
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        {t('loading')}
      </div>
    );
  }

  // Si ya hay mensajes, mostrar el chat normal
  if (session.messages.length > 0 || isPhase0Complete) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-4 sm:p-6">
        {/* Header con botón de logout */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500">
              {session.phaseData?.topic || t('subtitle')}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </div>

        <Card className="flex-1 space-y-3 overflow-y-auto p-4 min-h-[60vh]">
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

  // Modo Fase 0: Una pregunta a la vez
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 sm:p-6">
      {/* Header con botón de logout */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">Fase 0: Calibración Inicial</p>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Cerrar sesión
        </Button>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-sm text-slate-600">
        Pregunta {currentQuestionIndex + 1} de {questions.length}
      </p>

      {/* Pregunta actual */}
      <Card className="p-6">
        <div className="prose prose-slate max-w-none mb-4">
          <div dangerouslySetInnerHTML={{ __html: currentQuestion.question }} />
        </div>
        
<form
  onSubmit={(e) => {
    e.preventDefault();
    if (input.trim() === '/compilar' && allPhasesDone) {
     handleCompile();
    } else if (!waitingForPhase0Answer) {
      sendMessage(input);
    } else {
      handleSendAnswer();
    }
  }}
  className="flex gap-2 items-end"
>
  <textarea
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      // Enter sin Shift = NO envía (permite nueva línea)
      // Shift+Enter = nueva línea explícita
      // El envío SOLO ocurre con el botón
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Evita el submit automático
      }
    }}
    placeholder={waitingForPhase0Answer ? "Escribe tu respuesta..." : t('placeholder')}
    disabled={sending || awaitingApproval}
    rows={3}
    className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
  />
  <Button type="submit" disabled={sending || awaitingApproval || !input.trim()} className="mb-0">
    {t('send')}
  </Button>
</form>
      </Card>

      <div className="text-center text-sm text-slate-500">
        Puedes responder todo junto o por partes
      </div>
    </div>
  );
}
