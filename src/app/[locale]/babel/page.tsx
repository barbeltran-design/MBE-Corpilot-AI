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
  resetBabelSession,
  updateBabelPhaseSummary,
} from '@/lib/babel-session';
import { BABEL_IMPLEMENTED_PHASES, babelApprovalMarker } from '@/lib/babel-constants';
import { createCompiledPlanDeliverable } from '@/lib/deliverables';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import type { BabelPhaseRecord, ChatMessage, SessionDoc } from '@/types/firestore';

// Preguntas de la Fase 0 (una por una)
const PHASE_0_QUESTIONS = {
  es: [
    { key: 'giro', question: '### 1. Giro y nicho específico\n\nQué vendes exactamente y a quien va dirigido' },
    { key: 'ubicacion', question: '### 2. Ubicación operativa\n\nEn qué ciudad, estado y pais opera el negocio' },
    { key: 'madurez', question: '### 3. Madurez actual\n\nEs una idea en papel, un producto o servicio ya validado, o un negocio en marcha buscando escalar' },
    { key: 'recursos', question: '### 4. Recursos disponibles\n\nCon qué recursos materiales, humanos, intelectuales (marca, procesos, patentes) y financieros cuentas actualmente' },
    { key: 'ambicion', question: '### 5. Nivel de ambición financiera\n\nBuscas crear un autoempleo sostenible o una estructura escalable para levantar capital de inversionistas' },
    { key: 'mision_vision', question: '### 6. Proposito Común, Misión y visión\n\nYa las tienes definidas (escríbelas) o prefieres que las diseñemos desde cero' },
    { key: 'utilidad_deseada', question: '### 7. Utilidad mensual deseada\n\nCuánto dinero neto quisieras que sobrara de ganancias mensualmente para vivir (en tu moneda local)' },
    { key: 'sueldo_founder', question: '### 8. Sueldo del fundador\n\nSi vas a operar el negocio, que sueldo te asignarías para cubrir hasta 3 roles, que seria el mismo que le pagarías a otra persona por hacer cada rol (Administración, Comercial, Operación)' },
    { key: 'gastos_fijos', question: '### 9. Gastos fijos\n\nQué gastos fijos tienes que pagar aunque no vendas (renta, servicios, software)' },
    { key: 'gastos_variables', question: '### 10. Gastos variables\n\nQué % de tus ingresos pagas de gastos variables paraa entregar tu producto o servicio (materia prima, comisiones, impuestos)' }
  ],
  en: [
    { key: 'giro', question: '### 1. Business Type and Niche\n\nWhat exactly do you sell and who is it for?' },
    { key: 'ubicacion', question: '### 2. Operational Location\n\nIn which city, state and country the business operate?' },
    { key: 'madurez', question: '### 3. Current Maturity\n\nIs it an idea on paper, a validated product or service, or an ongoing business seeking to scale?' },
    { key: 'recursos', question: '### 4. Available Resources\n\nWhat material, human, intelectual and financial resources do you currently have?' },
    { key: 'ambicion', question: '### 5. Financial Ambition Level\n\nAre you looking to create sustainable self-employment or a scalable structure to raise capital from investors?' },
    { key: 'mision_vision', question: '### 6. Shared Goal, Mission and Vision\n\nDo you already have them defined or would you prefer us to design them from scratch?' },
    { key: 'utilidad_deseada', question: '### 7. Desired Monthly Profit\n\nHow much net profit would you like to have left over each month to live on? (in your local currency)' },
    { key: 'sueldo_founder', question: '### 8. Founder Salary\n\nIf you are going to run the business, what salary would you assign yourself to cover up to 3 roles, which would be the same as what you would pay another person to perform each role? (Administration, Commercial, Operations)' },
    { key: 'gastos_fijos', question: '### 9. Fixed Costs\n\nWhat fixed costs (rent, services, software) do you pay even if you dont sale anything?' },
    { key: 'gastos_variables', question: '### 10. Variable Costs\n\nWhat percentage of your revenue goes toward variable costs (raw materials, commissions, taxes) to deliver your product or service?' }
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
  const retryRef = React.useRef<(() => Promise<void>) | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = React.useState<number | null>(null);
  const [editContent, setEditContent] = React.useState('');

  const [chatExpanded, setChatExpanded] = React.useState<Set<number>>(new Set());
  const [compiling, setCompiling] = React.useState(false);
  const [showManualEditor, setShowManualEditor] = React.useState(false);
  const [manualContent, setManualContent] = React.useState('');

  // Estado para el flujo de preguntas una por una
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [phase0Answers, setPhase0Answers] = React.useState<Record<string, string>>({});
  const [isPhase0Complete, setIsPhase0Complete] = React.useState(false);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const questions = PHASE_0_QUESTIONS[locale];

  // 1. Autenticacion y carga de sesion
  React.useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/' + locale);
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

  // 3. Inyectar la primera pregunta automaticamente al iniciar
  React.useEffect(() => {
    if (!session || isPhase0Complete) return;
    if (session.messages.length === 0 && currentQuestionIndex === 0) {
      const firstQuestion = questions[0];
      const questionMsg: ChatMessage = {
        role: 'assistant',
        content: 'Hola! Soy **Babel**, Strategic Business Architect & Sustainability Lead de MBE Corp.\n\nPara iniciar con el pie derecho, te hare **10 preguntas clave** una por una. Responde con calma.\n\n**Nota:** Usa la tecla Enter para bajar de renglon. El mensaje solo se envia cuando presionas el boton "Enviar".\n\n---\n\n' + firstQuestion.question,
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

  const phaseTemplate = function (phase: number): string {
    if (phase <= 0) return '';
    const templates: Record<number, string> = {
      1: '### 1. Propuesta de Valor\n\n**Resultado que espera el cliente de tu producto o servicio:** \n\n**Beneficios funcionales:** \n\n**Beneficios emocionales:** \n\n**Beneficios atención:** \n\n---\n\n### 2. Modelo de Negocio\n\n**Segmento de clientes y usuarios:** \n\n**Canales de mercadotecnia:** \n\n**Fuentes de ingreso:** \n\n**Costos más importantes:** \n\n**Aliados, Socios y Proveedores:** \n\n**Recursos Humanos, Materiales, Intelectuales, Financieros:** \n\n---\n\n### 3. Proposito (Golden Circle)\n\n**Why (Proposito):** \n\n**How (Diferenciacion):** \n\n**What (Que vendes):** \n\n---\n\n### 4. Segmentacion\n\n**Arquetipo 1:** \n\n**Oceano Azul:** \n\n**Impacto social:** \n\n---\n\n###,
      2: '### 1. Analisis PESTEL\n\n**Politico:** \n\n**Economico:** \n\n**Social:** \n\n**Tecnologico:** \n\n**Ecologico:** \n\n**Legal:** \n\n---\n\n### 2. Fuerzas del Mercado\n\n**Competidores directos:** \n\n**Competidores indirectos:** \n\n**Nuevos entrantes:** \n\n---\n\n### 3. Tendencias Sectoriales\n\n\n---\n\n### 4. Prospectiva a 5 Años\n\n**Escenario optimista:** \n\n**Escenario conservador:** \n\n---\n\n### 5. ODS y Fondos\n\n**ODS vinculados:** \n\n**Fondos sugeridos:**,
      3: '### 1. Capacidades Clave\n\n**Capacidades basicas:** \n\n**Capacidades diferenciadoras:** \n\n---\n\n### 2. Plan Operativo\n\n**Infraestructura:** \n\n**Cadena de suministro:** \n\n**Personal requerido:** \n\n---\n\n### 3. Estrategia Comercial\n\n**Marketing mix:** \n\n**Embudo de ventas:** \n\n**Customer Journey:**',
      4: '### 1. Costos de Arranque y OpEx\n\n**Costos de arranque:** \n\n**Gastos operativos mensuales:** \n\n---\n\n### 2. Estrategia de Precios\n\n\n---\n\n### 3. Flujo de Caja Ano 1\n\n**Mes 1:** \n\n**Mes 2-12:** \n\n---\n\n### 4. Estado de Resultados\n\n**Ano 1:** \n\n**Ano 3:** \n\n**Ano 5:**',
      5: '### 1. Balanced Scorecard + OKRs\n\n**Finanzas:** \n\n**Clientes:** \n\n**Procesos:** \n\n**Aprendizaje:** \n\n---\n\n### 2. Matriz de Impacto\n\n**Colaboradores:** \n\n**Sociedad:** \n\n**Medio ambiente:** \n\n---\n\n### 3. FODA Cruzado\n\n**Fortalezas:** \n\n**Oportunidades:** \n\n**Debilidades:** \n\n**Amenazas:** \n\n---\n\n### 4. Marco Agil\n\n\n---\n\n### 5. Elevator Pitch\n\n',
    };
    return templates[phase] ?? '### Escribe aqui tu analisis para esta fase...';
  };

  function friendlyError(raw: string): string {
    if (raw.includes('image.png')) {
      return 'Error de formato al contactar la IA. Revisa que las API keys en Vercel sean validas (Groq, OpenRouter, Gemini). Detalle: ' + raw.slice(0, 300);
    }
    return raw;
  }

  // Si la sesion ya tiene fases aprobadas desde Firestore, salir del wizard
  React.useEffect(() => {
    if (session && (session.currentPhase ?? 0) > 0) {
      setIsPhase0Complete(true);
    }
  }, [session]);

  // 4. Manejar respuesta en Fase 0 (Pregunta por pregunta)
  async function handlePhase0Answer() {
    if (!input.trim() || !uid || !session) return;
    const answer = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    const userMsg: ChatMessage = {
      role: 'user',
      content: answer,
      timestamp: Timestamp.now(),
    };

    try {
      const updatedAnswers = { ...phase0Answers, [questions[currentQuestionIndex].key]: answer };
      setPhase0Answers(updatedAnswers);

      if (currentQuestionIndex === questions.length - 1) {
        // ULTIMA PREGUNTA: generar conclusion local (sin API)
        const phase0Labels: Record<string, string> = locale === 'en'
          ? { giro: 'Business Type', ubicacion: 'Location', madurez: 'Maturity', recursos: 'Resources', ambicion: 'Ambition', mision_vision: 'Mission & Vision', utilidad_deseada: 'Desired Monthly Profit', sueldo_founder: 'Founder Salary', gastos_fijos: 'Fixed Costs', gastos_variables: 'Variable Costs' }
          : { giro: 'Giro y nicho', ubicacion: 'Ubicación', madurez: 'Madurez', recursos: 'Recursos', ambicion: 'Ambición', mision_vision: 'Misión y Visión', utilidad_deseada: 'Utilidad mensual deseada', sueldo_founder: 'Sueldo del fundador', gastos_fijos: 'Gastos fijos', gastos_variables: 'Gastos variables' };

        const conclusionLines = Object.entries(updatedAnswers).map(function (entry) {
          return '**' + (phase0Labels[entry[0]] ?? entry[0]) + ':** ' + entry[1];
        });
        const conclusionBody = '### Resumen de Fase 0 — Calibración Inicial\n\n' + conclusionLines.join('\n\n---\n\n') + '\n\n---\n\n*¿Apruebas este resumen de la Fase 0 para continuar a la Fase 1?*';

        const summaryMsg: ChatMessage = {
          role: 'user',
          content: 'Fase 0 completada:\n\n' + conclusionLines.join('\n\n'),
          timestamp: Timestamp.now(),
        };
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: conclusionBody,
          timestamp: Timestamp.now(),
        };

        const cleanMessages: ChatMessage[] = [summaryMsg, assistantMsg];
        setSession(function (prev) { return prev ? { ...prev, messages: cleanMessages } : prev; });
        await saveBabelMessages(uid, cleanMessages);
        setIsPhase0Complete(true);
      } else {
        // PREGUNTAS INTERMEDIAS: solo estado local, NO a Firestore
        const updatedMessages = [...session.messages, userMsg];
        setSession(function (prev) { return prev ? { ...prev, messages: updatedMessages } : prev; });

        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);

        const nextQuestion = questions[nextIndex];
        const nextQuestionMsg: ChatMessage = {
          role: 'assistant',
          content: nextQuestion.question,
          timestamp: Timestamp.now(),
        };

        const messagesWithNextQuestion = [...updatedMessages, nextQuestionMsg];
        setSession(function (prev) { return prev ? { ...prev, messages: messagesWithNextQuestion } : prev; });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al procesar';
      setError(errMsg);
      // Guardar reintento solo si estabamos en la ultima pregunta
      if (currentQuestionIndex === questions.length - 1) {
        const phase0Summary = Object.entries({ ...phase0Answers, [questions[currentQuestionIndex].key]: input.trim() })
          .map(function (entry) { return '**' + entry[0] + '**: ' + entry[1]; })
          .join('\n\n');
        const summaryMsg: ChatMessage = {
          role: 'user',
          content: 'Fase 0 completada:\n\n' + phase0Summary,
          timestamp: Timestamp.now(),
        };
        const allMessages = [...session.messages, userMsg, summaryMsg];
        const retryBody = {
          messages: allMessages,
          language: locale,
          phase: 0,
          phase0Complete: true,
          phase0Data: { ...phase0Answers, [questions[currentQuestionIndex].key]: input.trim() },
        };
        retryRef.current = async function () {
          setSending(true);
          setError(null);
          try {
            const res = await fetch('/api/babel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(retryBody),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Error al procesar Fase 0');
            retryRef.current = null;
            const assistantMsg: ChatMessage = {
              role: 'assistant',
              content: data.reply as string,
              timestamp: Timestamp.now(),
            };
            const cleanMessages: ChatMessage[] = [summaryMsg, assistantMsg];
            setSession(function (prev) { return prev ? { ...prev, messages: cleanMessages } : prev; });
            await saveBabelMessages(uid, cleanMessages);
            setIsPhase0Complete(true);
          } catch (retryErr) {
            setError(retryErr instanceof Error ? retryErr.message : 'Error al procesar');
          } finally {
            setSending(false);
          }
        };
      }
    } finally {
      setSending(false);
    }
  }

  // 5. Manejar mensajes de chat normal (Fases 1-5)
  async function sendMessage(text: string) {
    if (!uid || !session || !text.trim()) return;
    setSending(true);
    setError(null);
    retryRef.current = null;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Timestamp.now(),
    };
    const historyForApi = [...session.messages, userMsg];
    setSession({ ...session, messages: historyForApi });
    const sentText = text.trim();
    setInput('');

    // Guardar payload para reintentar
    const payload = {
      messages: historyForApi.map(function (m) { return { role: m.role, content: m.content }; }),
      language: locale,
      phase: currentPhase,
    };

    try {
      const res = await fetch('/api/babel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error generico');

      retryRef.current = null;

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply as string,
        timestamp: Timestamp.now(),
      };
      const finalMessages = [...historyForApi, assistantMsg];
      setSession(function (prev) { return prev ? { ...prev, messages: finalMessages } : prev; });
      await saveBabelMessages(uid, finalMessages);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error generico';
      setError(errMsg);
      retryRef.current = async function () {
        setSending(true);
        setError(null);
        try {
          const res = await fetch('/api/babel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('[babel] API error response completa:', JSON.stringify(data, null, 2));
        throw new Error(data.error || 'Error generico');
      }
          retryRef.current = null;
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: data.reply as string,
            timestamp: Timestamp.now(),
          };
          const finalMessages = [...historyForApi, assistantMsg];
          setSession(function (prev) { return prev ? { ...prev, messages: finalMessages } : prev; });
          await saveBabelMessages(uid, finalMessages);
        } catch (retryErr) {
          setError(retryErr instanceof Error ? retryErr.message : 'Error generico');
        } finally {
          setSending(false);
        }
      };
    } finally {
      setSending(false);
    }
  }

  async function handleApprove(editedText?: string) {
    if (!uid || !session || !lastMessage) return;
    setSending(true);
    setError(null);
    setEditingMessageIndex(null);
    const approvedContent = editedText ?? lastMessage.content;
    try {
      await approveBabelPhase(uid, currentPhase, approvedContent, locale);
      const refreshed = await getOrCreateBabelSession(uid, locale);

      if ((refreshed.currentPhase ?? 0) >= BABEL_IMPLEMENTED_PHASES) {
        setSession(refreshed);
        setSending(false);
        setCompiling(true);
        await upsertCompiledPlan(refreshed.messages, refreshed.phases);
        setCompiling(false);
        return;
      }

      const approvalMsg: ChatMessage = {
        role: 'user',
        content: locale === 'en' ? "I approve, let's continue." : 'Apruebo, continuemos.',
        timestamp: Timestamp.now(),
      };
      const historyForApi = [...refreshed.messages, approvalMsg];

      const res = await fetch('/api/babel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi.map(function (m) { return { role: m.role, content: m.content }; }),
          language: locale,
          phase: refreshed.currentPhase,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('[babel] API error response completa:', JSON.stringify(data, null, 2));
        throw new Error(data.error || 'Error generico');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply as string,
        timestamp: Timestamp.now(),
      };
      const finalMessages = [...refreshed.messages, assistantMsg];
      setSession({ ...refreshed, messages: finalMessages });
      await saveBabelMessages(uid, finalMessages);
      if ((refreshed.currentPhase ?? 0) >= BABEL_IMPLEMENTED_PHASES) {
      await upsertCompiledPlan(finalMessages, refreshed.phases);
      }
      } catch (err) {
      const refreshedCatch = await getOrCreateBabelSession(uid, locale);
      setError(err instanceof Error ? err.message : 'Error generico');
      setShowManualEditor(true);
      setManualContent(phaseTemplate(refreshedCatch.currentPhase ?? 0));
      setSession(refreshedCatch);
    } finally {
      setSending(false);
    }
  }

  function handleStartEdit(index: number, content: string) {
    setEditingMessageIndex(index);
    setEditContent(content);
  }

  function handleCancelEdit() {
    setEditingMessageIndex(null);
    setEditContent('');
  }

  async function handleSaveEdit() {
    if (!uid || !session || editingMessageIndex === null) return;
    setError(null);
    try {
      const originalContent = session.messages[editingMessageIndex]?.content ?? '';
      const updatedMessages = session.messages.map(function (m, i) {
        return i === editingMessageIndex ? { ...m, content: editContent } : m;
      });
      await saveBabelMessages(uid, updatedMessages);
      for (const p of session.phases ?? []) {
        if (p.summary === originalContent || originalContent.startsWith(p.summary) || p.summary.startsWith(originalContent)) {
          await updateBabelPhaseSummary(uid, p.phase, editContent);
        }
      }
      setEditingMessageIndex(null);
      setEditContent('');
      const refreshed = await getOrCreateBabelSession(uid, locale);
      setSession(refreshed);
      await upsertCompiledPlan(refreshed.messages, refreshed.phases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  async function manualApprovePhase(phase: number, text: string) {
    if (!uid || !session) return;
    setSending(true);
    setError(null);
    setShowManualEditor(false);
    try {
      await approveBabelPhase(uid, phase, text, locale);
      const refreshed = await getOrCreateBabelSession(uid, locale);
      const isLastPhase = phase >= BABEL_IMPLEMENTED_PHASES - 1;
      const nextPhaseContent = text + (isLastPhase ? '' : '\n\n' + babelApprovalMarker(locale));
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: nextPhaseContent,
        timestamp: Timestamp.now(),
      };
      const finalMessages = [...refreshed.messages, assistantMsg];
      setSession({ ...refreshed, messages: finalMessages });
      await saveBabelMessages(uid, finalMessages);
      setManualContent('');
      if (isLastPhase) {
      await upsertCompiledPlan(finalMessages, refreshed.phases);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSending(false);
    }
  }


  async function upsertCompiledPlan(overrideMessages?: ChatMessage[], overridePhases?: BabelPhaseRecord[]) {
    if (!uid || !session) return;
    try {
      const phases = overridePhases ?? session.phases ?? [];
      const compiled = phases.length > 0 ? [...phases].sort((a, b) => a.phase - b.phase).map((p) => p.summary).join('\n\n---\n\n') : '';
      const compiledText = compiled ? '### Plan Estrategico Compilado\n\n' + compiled : 'No hay fases aprobadas para compilar aun.';

      const baseMessages = overrideMessages ?? session.messages;
      let existingIdx = -1;
      for (let j = baseMessages.length - 1; j >= 0; j--) {
        if (baseMessages[j].role === 'assistant' && baseMessages[j].content.startsWith('### Plan Estrategico Compilado')) {
          existingIdx = j;
          break;
        }
      }

      let finalMessages: ChatMessage[];
      if (existingIdx >= 0) {
        finalMessages = baseMessages.map(function (m, i) {
          return i === existingIdx ? { ...m, content: compiledText } : m;
        });
      } else {
        const assistantMsg: ChatMessage = { role: 'assistant', content: compiledText, timestamp: Timestamp.now() };
        if (compiled) {
          try {
            const deliverable = await createCompiledPlanDeliverable({
              uid: uid, agentId: 'babel', sessionTopic: session.topic, compiledText: compiled, language: locale,
            });
            assistantMsg.deliverables = [deliverable];
          } catch (deliverableErr) {
            console.error('[babel] No se pudo generar el PDF del plan compilado', deliverableErr);
          }
        }
        finalMessages = [...baseMessages, assistantMsg];
      }

      setSession(function (prev) { return prev ? { ...prev, messages: finalMessages } : prev; });
      setInput('');
    } catch (err) {
      console.error('[babel] Error en upsertCompiledPlan:', err);
      throw err;
    }
  }

  async function handleCompile() {
    if (!uid || !session || compiling) return;
    setCompiling(true);
    setError(null);
    try {
      await upsertCompiledPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al compilar');
    } finally {
      setCompiling(false);
    }
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.push('/' + locale);
  }

  async function handleReset() {
    if (!uid) return;
    const confirmMsg =
      locale === 'en'
        ? 'This will erase all progress in this session and start over from scratch. This cannot be undone. Continue?'
        : 'Esto borrara todo el progreso de esta sesion y empezara de nuevo desde cero. No se puede deshacer. Continuar?';
    if (!window.confirm(confirmMsg)) return;
    setSending(true);
    setError(null);
    try {
      const fresh = await resetBabelSession(uid, locale);
      setSession(fresh);
      setInput('');
      setCurrentQuestionIndex(0);
      setPhase0Answers({});
      setIsPhase0Complete(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reiniciar');
    } finally {
      setSending(false);
    }
  }

  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">{t('loading')}</div>;
  }

  // VISTA 1: WIZARD DE FASE 0 (Pregunta por pregunta)
  const isPhase0Active = currentPhase === 0 && currentQuestionIndex < questions.length && !isPhase0Complete;

  if (isPhase0Active) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500">Fase 0: Calibracion Inicial</p>
          </div>
          <div className="flex gap-2">
           <Button onClick={handleReset} disabled={sending} variant="outline" size="sm">Empezar de nuevo</Button>
           <Button onClick={handleLogout} variant="outline" size="sm">Cerrar sesion</Button>
          </div>
        </div>

        {/* Historial de respuestas previas */}
        {session.messages.length > 0 && (
          <Card className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[40vh]">
            {session.messages.map(function (m, i) {
              const isLong = m.content.length > 300;
              const isExpanded = chatExpanded.has(i);
              return (
                <div key={i} className={'max-w-[85%] rounded-xl px-3.5 py-2 text-sm ' + (m.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'bg-slate-100 text-slate-900')}>
                  <div className={'whitespace-pre-wrap ' + (isLong && !isExpanded ? 'max-h-32 overflow-y-auto' : '')}>
                    {m.content}
                  </div>
                  {isLong && (
                    <div className="mt-1 flex gap-3">
                      <button
                        onClick={function () {
                          setChatExpanded(function (prev) {
                            const next = new Set(prev);
                            if (next.has(i)) { next.delete(i); } else { next.add(i); }
                            return next;
                          });
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                      >
                        {isExpanded ? 'Ver menos' : 'Ver todo'}
                      </button>
                      {m.role === 'assistant' && (
                        <button
                          onClick={function () { handleStartEdit(i, m.content); }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        {/* Barra de progreso */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: String(((currentQuestionIndex + 1) / questions.length) * 100) + '%' }} />
        </div>
        <p className="text-sm text-slate-600">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            <div className="mb-1">{friendlyError(error)}</div>
            <div className="mt-2 flex gap-2">
              {retryRef.current && (
                <button
                  onClick={function () { if (retryRef.current) retryRef.current(); }}
                  disabled={sending}
                  className="text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900 disabled:opacity-50"
                >
                  {sending ? 'Reintentando...' : 'Reintentar'}
                </button>
              )}
              {currentQuestionIndex === questions.length - 1 && !showManualEditor && (
                <button
                  onClick={function () { setShowManualEditor(true); }}
                  className="text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                >
                  Escribir mi propia conclusion
                </button>
              )}
            </div>
          </div>
        )}

        {showManualEditor && (
          <Card className="p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">Escribe tu conclusion de la Fase 0 manualmente:</p>
            <textarea
              value={manualContent}
              onChange={function (e) { setManualContent(e.target.value); }}
              rows={10}
              placeholder="Describe aqui el resumen de tu negocio..."
              className="w-full resize-y rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <Button onClick={function () { setShowManualEditor(false); setManualContent(''); }} variant="outline" size="sm">
                Cancelar
              </Button>
              <Button onClick={function () { manualApprovePhase(0, manualContent); }} disabled={sending || !manualContent.trim()} size="sm">
                {sending ? 'Guardando...' : 'Guardar y aprobar Fase 0'}
              </Button>
            </div>
          </Card>
        )}

        {/* Pregunta actual y formulario */}
        <Card className="p-6">
          <div className="whitespace-pre-wrap text-slate-900 mb-4 font-medium">
            {questions[currentQuestionIndex].question}
          </div>

          <form
            onSubmit={function (e) {
              e.preventDefault();
              handlePhase0Answer();
            }}
            className="flex gap-2 items-end"
          >
            <textarea
              value={input}
              onChange={function (e) { setInput(e.target.value); }}
              onKeyDown={function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                }
              }}
              placeholder="Escribe tu respuesta aqui..."
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

  // VISTA 2: CHAT NORMAL (Fases 1-5 y posterior a Fase 0)
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{(session as any).phaseData?.topic || t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
         <Button onClick={handleReset} disabled={sending} variant="outline" size="sm">Empezar de nuevo</Button>
         <Button onClick={handleLogout} variant="outline" size="sm">Cerrar sesion</Button>
        </div>
      </div>

      <Card className="flex-1 space-y-3 overflow-y-auto p-4 min-h-[60vh]">
        {session.messages.map(function (m, i) {
          const isLong = m.content.length > 300;
          const isExpanded = chatExpanded.has(i);
          return (
            <div key={i} className={'max-w-[85%] rounded-xl px-3.5 py-2 text-sm ' + (m.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'bg-slate-100 text-slate-900')}>
              {editingMessageIndex === i ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={function (e) { setEditContent(e.target.value); }}
                    rows={12}
                    className="w-full resize-y rounded border border-blue-300 bg-white p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={sending}>Cancelar</Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={sending || !editContent.trim()}>
                      {sending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={'whitespace-pre-wrap ' + (isLong && !isExpanded ? 'max-h-32 overflow-y-auto' : '')}>
                  {m.content}
                </div>
              )}
              {isLong && !(editingMessageIndex === i) && (
                <div className="mt-1 flex gap-3">
                  <button
                    onClick={function () {
                      setChatExpanded(function (prev) {
                        const next = new Set(prev);
                        if (next.has(i)) { next.delete(i); } else { next.add(i); }
                        return next;
                      });
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver todo'}
                  </button>
                  {m.role === 'assistant' && !m.content.startsWith('### Plan Estrategico Compilado') && (
                    <button
                      onClick={function () { handleStartEdit(i, m.content); }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      Editar
                    </button>
                  )}
                </div>
              )}
              {m.deliverables && m.deliverables.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 border-t border-slate-200 pt-2">
                  {m.deliverables.map(function (d, di) {
                    return (
                      <a key={di} href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900">
                        {t('downloadDeliverable')}: {d.name}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {sending && (
          <div className="max-w-[85%] rounded-xl bg-slate-100 px-3.5 py-2 text-sm text-slate-500 animate-pulse">
            {t('loadingReply')}
          </div>
        )}
        <div ref={bottomRef} />
      </Card>

        {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          <div className="mb-1">{friendlyError(error)}</div>
          <div className="mt-2 flex gap-2">
            {retryRef.current && (
              <button
                onClick={function () { if (retryRef.current) retryRef.current(); }}
                disabled={sending}
                className="text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900 disabled:opacity-50"
              >
                {sending ? 'Reintentando...' : 'Reintentar'}
              </button>
            )}
            {!showManualEditor && (
              <button
                onClick={function () { setShowManualEditor(true); }}
                className="text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                Escribir mi propia conclusion
              </button>
            )}
          </div>
        </div>
      )}

      {showManualEditor && !awaitingApproval && (
        <Card className="p-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">Escribe tu conclusion para la Fase {currentPhase} manualmente:</p>
          <textarea
            value={manualContent}
            onChange={function (e) { setManualContent(e.target.value); }}
            rows={10}
            placeholder="Describe aqui tu analisis para esta fase..."
            className="w-full resize-y rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <Button onClick={function () { setShowManualEditor(false); setManualContent(''); }} variant="outline" size="sm">
              Cancelar
            </Button>
            <Button onClick={function () { manualApprovePhase(currentPhase, manualContent); }} disabled={sending || !manualContent.trim()} size="sm">
              {sending ? 'Guardando...' : 'Guardar y aprobar Fase ' + String(currentPhase)}
            </Button>
          </div>
        </Card>
      )}

      {/* Panel de etapas aprobadas — toggle desde link en botones de aprobación */}

      <div className="flex flex-col gap-2">
        {awaitingApproval && editingMessageIndex === null && !showManualEditor && (
          <Button onClick={function () { handleApprove(); }} disabled={sending}>
            {allPhasesDone ? t('approveFinalButton') : t('approveButton', { phase: currentPhase })}
          </Button>
        )}

        {awaitingApproval && showManualEditor && (
          <Card className="p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">Escribe tu propia conclusion para la Fase {currentPhase}:</p>
            <textarea
              value={manualContent}
              onChange={function (e) { setManualContent(e.target.value); }}
              rows={10}
              placeholder="Describe aqui tu analisis para esta fase..."
              className="w-full resize-y rounded border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <Button onClick={function () { setShowManualEditor(false); setManualContent(''); }} variant="outline" size="sm">
                Cancelar
              </Button>
              <Button onClick={function () { manualApprovePhase(currentPhase, manualContent); }} disabled={sending || !manualContent.trim()} size="sm">
                {sending ? 'Guardando...' : 'Guardar y aprobar Fase ' + String(currentPhase)}
              </Button>
            </div>
          </Card>
        )}

        {awaitingApproval && editingMessageIndex !== null && (
          <div className="flex gap-2">
            <Button onClick={handleCancelEdit} disabled={sending} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={function () { handleApprove(editContent); }} disabled={sending} className="flex-[2]">
              Guardar y aprobar
            </Button>
          </div>
        )}

        {allPhasesDone && !awaitingApproval && (
          <Button onClick={handleCompile} disabled={compiling} variant="outline" className="w-full">
            {compiling ? 'Actualizando...' : 'Actualizar plan compilado'}
          </Button>
        )}

        <form
          onSubmit={function (e) {
            e.preventDefault();
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
            onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={function (e) {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            placeholder={t('placeholder')}
            disabled={sending || (awaitingApproval && editingMessageIndex === null && !showManualEditor)}
            rows={3}
            className="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
          />
          <Button type="submit" disabled={sending || (awaitingApproval && editingMessageIndex === null && !showManualEditor) || !input.trim()} className="mb-0 h-10">
            {t('send')}
          </Button>
        </form>
      </div>
    </div>
  );
}
