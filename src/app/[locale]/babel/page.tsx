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
import { downloadCompiledPlanPdf, downloadFinancialGoalsExcel, computeFinancialGoals } from '@/lib/deliverables';
import type { FinancialGoalsInput, FinancialGoalsResult } from '@/lib/deliverables';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { BabelPhaseRecord, ChatMessage, SessionDoc } from '@/types/firestore';
// Preguntas de la Fase 0 (una por una)
const PHASE_0_QUESTIONS = {
  es: [
    { key: 'giro', question: '### 1. Giro y nicho especifico\n\nQue vendes exactamente y a quien va dirigido?' },
    { key: 'ubicacion', question: '### 2. Ubicacion operativa\n\nEn que ciudad, estado y pais operara el negocio?' },
    { key: 'madurez', question: '### 3. Madurez actual\n\nEs una idea en papel, un producto o servicio ya validado, o un negocio en marcha buscando escalar?' },
    { key: 'recursos', question: '### 4. Recursos disponibles\n\nCon que recursos materiales, humanos, intelectuales (marca, procesos, patentes) y financieros cuentas actualmente?' },
    { key: 'ambicion', question: '### 5. Nivel de ambicion financiera\n\nBuscas crear un autoempleo sostenible o una estructura escalable para levantar capital de inversionistas?' },
    { key: 'mision_vision', question: '### 6. Proposito Comun, Mision y vision\n\nYa las tienes definidas o prefieres que las disenemos desde cero?' },
    { key: 'utilidad_deseada', question: '### 7. Utilidad mensual deseada\n\nCuanto dinero neto quisieras que sobrara de ganancias mensualmente para vivir? (en tu moneda local)' },
    { key: 'sueldo_founder', question: '### 8. Sueldo del fundador\n\nSi vas a operar el negocio, que sueldo te asignarias para cubrir hasta 3 roles, que seria el mismo que le pagarias a otra persona por hacer cada rol? (Administracion, Comercial, Operacion)' },
    { key: 'gastos_fijos', question: '### 9. Gastos fijos\n\nQue gastos fijos tienes que pagar aunque no vendas (renta, servicios, software)?' },
    { key: 'gastos_variables', question: '### 10. Gastos variables\n\nQue % de tus ingresos pagas de gastos variables paraa entregar tu producto o servicio (materia prima, comisiones, impuestos)?' }
  ],
  en: [
    { key: 'giro', question: '### 1. Business Type and Niche\n\nWhat exactly do you sell and who is it for?' },
    { key: 'ubicacion', question: '### 2. Operational Location\n\nIn which city, state and country will the business operate?' },
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
// Textos de interfaz que normalmente vienen de next-intl (t()), pero que
// necesitamos poder mostrar en el idioma que el usuario elija con el
// selector ES/EN, aunque no coincida con el idioma de la ruta (locale).
const UI_FALLBACK: Record<'es' | 'en', {
  title: string;
  subtitle: string;
  loading: string;
  send: string;
  approveFinalButton: string;
  approveButton: (phase: number) => string;
  downloadDeliverable: string;
  loadingReply: string;
  placeholder: string;
}> = {
  es: {
    title: 'Babel AI',
    subtitle: 'Tu Strategic Business Architect. Vamos a construir juntos tu Plan de Negocio Estratégico Socioambiental, fase por fase.',
    loading: 'Cargando...',
    send: 'Enviar',
    approveFinalButton: 'Aprobar y finalizar plan',
    approveButton: function (phase: number) { return 'Aprobar Fase ' + phase + ' y continuar'; },
    downloadDeliverable: 'Descargar entregable',
    loadingReply: 'Babel está escribiendo...',
    placeholder: 'Escribe tu mensaje...',
  },
  en: {
    title: 'Babel AI',
    subtitle: "Your Strategic Business Architect. Let's build your Socio-Environmental Strategic Business Plan together, phase by phase.",
    loading: 'Loading...',
    send: 'Send',
    approveFinalButton: 'Approve and finish plan',
    approveButton: function (phase: number) { return 'Approve Phase ' + phase + ' and continue'; },
    downloadDeliverable: 'Download deliverable',
    loadingReply: 'Babel is typing...',
    placeholder: 'Type your message...',
  },
};
const FASE0_ORDERED_KEYS = ['giro', 'ubicacion', 'madurez', 'recursos', 'ambicion', 'mision_vision', 'utilidad_deseada', 'sueldo_founder', 'gastos_fijos', 'gastos_variables'];
function fase0IntroText(lang: 'es' | 'en'): string {
  return lang === 'en'
    ? 'Hi! I\'m **Babel**, MBE Corp\'s Strategic Business Architect & Sustainability Lead.\n\nTo get started on the right foot, I\'ll ask you **10 key questions**, one at a time. Take your time.\n\n**Note:** Use Enter to add a new line. The message is only sent when you press the "Send" button.\n\n---\n\n'
    : 'Hola! Soy **Babel**, Strategic Business Architect & Sustainability Lead de MBE Corp.\n\nPara iniciar con el pie derecho, te hare **10 preguntas clave** una por una. Responde con calma.\n\n**Nota:** Usa la tecla Enter para bajar de renglon. El mensaje solo se envia cuando presionas el boton "Enviar".\n\n---\n\n';
}
function fase0LabelsFor(lang: 'es' | 'en'): Record<string, string> {
  return lang === 'en'
    ? { giro: 'Business Type', ubicacion: 'Location', madurez: 'Maturity', recursos: 'Resources', ambicion: 'Ambition', mision_vision: 'Mission & Vision', utilidad_deseada: 'Desired Monthly Profit', sueldo_founder: 'Founder Salary', gastos_fijos: 'Fixed Costs', gastos_variables: 'Variable Costs' }
    : { giro: 'Giro y nicho', ubicacion: 'Ubicación', madurez: 'Madurez', recursos: 'Recursos', ambicion: 'Ambición', mision_vision: 'Misión y Visión', utilidad_deseada: 'Utilidad mensual deseada', sueldo_founder: 'Sueldo del fundador', gastos_fijos: 'Gastos fijos', gastos_variables: 'Gastos variables' };
}
function buildFase0Summary(answers: Record<string, string>, lang: 'es' | 'en'): { userContent: string; assistantContent: string } {
  const labels = fase0LabelsFor(lang);
  const conclusionLines = FASE0_ORDERED_KEYS
    .filter(function (k) { return answers[k] !== undefined; })
    .map(function (k) { return '**' + (labels[k] ?? k) + ':** ' + answers[k]; });
  const summaryLabel = lang === 'en' ? 'Phase 0 completed:' : 'Fase 0 completada:';
  const conclusionHeader = lang === 'en' ? '### Phase 0 Summary — Initial Calibration' : '### Resumen de Fase 0 — Calibración Inicial';
  const conclusionQuestion = lang === 'en' ? 'Do you approve this Phase 0 summary to continue to Phase 1?' : '¿Apruebas este resumen de la Fase 0 para continuar a la Fase 1?';
  const userContent = summaryLabel + '\n\n' + conclusionLines.join('\n\n');
  const assistantContent = conclusionHeader + '\n\n' + conclusionLines.join('\n\n---\n\n') + '\n\n---\n\n*' + conclusionQuestion + '*';
  return { userContent: userContent, assistantContent: assistantContent };
}
function toAmountPct(value: number, mode: '$' | '%', unitPrice: number): number {
  if (mode === '%') return value / 100;
  return unitPrice > 0 ? value / unitPrice : 0;
}
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [phase0Answers, setPhase0Answers] = React.useState<Record<string, string>>({});
  const [isPhase0Complete, setIsPhase0Complete] = React.useState(false);
  const [dispLang, setDispLang] = React.useState<'es' | 'en'>(locale);
  // Cache de traducciones (por IA) del contenido REAL de los mensajes de
  // Babel, para cuando dispLang no coincide con el idioma en que se generaron.
  // Clave: indice del mensaje + '::' + idioma destino.
  const [translatedCache, setTranslatedCache] = React.useState<Record<string, string>>({});
  const [translatingSet, setTranslatingSet] = React.useState<Set<number>>(new Set());
  const [finActive, setFinActive] = React.useState(false);
  const [finStage, setFinStage] = React.useState(1);
  const [finReviewing, setFinReviewing] = React.useState(false);
  const [finSending, setFinSending] = React.useState(false);
  const [finError, setFinError] = React.useState<string | null>(null);
  const [finUnitPrice, setFinUnitPrice] = React.useState(0);
  const [finMaterialsValue, setFinMaterialsValue] = React.useState(0);
  const [finMaterialsMode, setFinMaterialsMode] = React.useState<'$' | '%'>('$');
  const [finLaborValue, setFinLaborValue] = React.useState(0);
  const [finLaborMode, setFinLaborMode] = React.useState<'$' | '%'>('$');
  const [finOtherValue, setFinOtherValue] = React.useState(0);
  const [finOtherMode, setFinOtherMode] = React.useState<'$' | '%'>('$');
  const [finFixedTotalInput, setFinFixedTotalInput] = React.useState(0);
  const [finDesiredProfit, setFinDesiredProfit] = React.useState(0);
  const [finFixedItems, setFinFixedItems] = React.useState<{ name: string; amount: number }[]>([]);
  const [finVarItems, setFinVarItems] = React.useState<{ name: string; value: number; mode: '$' | '%' }[]>([]);
  const [finChannels, setFinChannels] = React.useState<{ name: string; pct: number }[]>([]);
  const [finMarketingPct, setFinMarketingPct] = React.useState(0);
  const [finDone, setFinDone] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const questions = PHASE_0_QUESTIONS[dispLang];
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
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length]);
  React.useEffect(() => {
    if (!session || isPhase0Complete) return;
    if (session.messages.length === 0 && currentQuestionIndex === 0) {
      const firstQuestion = questions[0];
      const questionMsg: ChatMessage = {
        role: 'assistant',
        content: fase0IntroText(dispLang) + firstQuestion.question,
        timestamp: Timestamp.now(),
      };
      setSession(prev => prev ? { ...prev, messages: [questionMsg] } : prev);
    }
  }, [session, currentQuestionIndex, isPhase0Complete, questions, dispLang]);
  const currentPhase = session?.currentPhase ?? 0;
  const allPhasesDone = currentPhase >= BABEL_IMPLEMENTED_PHASES;
  const lastMessage = session?.messages[session.messages.length - 1];
  const awaitingApproval =
    !allPhasesDone &&
    !!lastMessage &&
    lastMessage.role === 'assistant' &&
    lastMessage.content.includes(babelApprovalMarker(locale));
  // Traduccion en vivo (por IA real, no Google Translate) del contenido que
  // Babel ya genero, para cuando el usuario ve la pagina en un idioma
  // distinto al de la ruta. Solo se traducen mensajes de Babel (no las
  // respuestas propias del usuario, ni el par de resumen de Fase 0, que ya
  // se reconstruye localmente sin IA).
  React.useEffect(() => {
    if (!session || dispLang === locale) return;
    session.messages.forEach(function (m, i) {
      if (m.role !== 'assistant') return;
      if (currentPhase === 0 && i <= 1) return;
      const cacheKey = i + '::' + dispLang;
      if (translatedCache[cacheKey] !== undefined) return;
      if (translatingSet.has(i)) return;
      setTranslatingSet(function (prev) { const next = new Set(prev); next.add(i); return next; });
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: m.content, targetLang: dispLang }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          const translated = data && typeof data.translation === 'string' ? data.translation : m.content;
          setTranslatedCache(function (prev) {
            const next = { ...prev };
            next[cacheKey] = translated;
            return next;
          });
        })
        .catch(function () {
          setTranslatedCache(function (prev) {
            const next = { ...prev };
            next[cacheKey] = m.content;
            return next;
          });
        })
        .finally(function () {
          setTranslatingSet(function (prev) {
            const next = new Set(prev);
            next.delete(i);
            return next;
          });
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispLang, session?.messages, locale, currentPhase]);
  const phaseTemplate = function (phase: number): string {
    if (phase <= 0) return '';
    const templates: Record<number, string> = {
      1: '### 1. Propuesta de Valor\n\n**Trabajos funcionales:** \n\n**Trabajos emocionales:** \n\n**Trabajos sociales:** \n\n---\n\n### 2. Modelo de Negocio\n\n**Segmento de clientes:** \n\n**Propuesta de valor:** \n\n**Canales:** \n\n**Fuentes de ingreso:** \n\n---\n\n### 3. Proposito (Golden Circle)\n\n**Why (Proposito):** \n\n**How (Diferenciacion):** \n\n**What (Que vendes):** \n\n---\n\n### 4. Segmentacion\n\n**Arquetipo 1:** \n\n**Oceano Azul:** \n\n**Impacto social:** \n\n---\n\n### 5. ODS y Fondos\n\n**ODS vinculados:** \n\n**Fondos sugeridos:**',
      2: '### 1. Analisis PESTEL\n\n**Politico:** \n\n**Economico:** \n\n**Social:** \n\n**Tecnologico:** \n\n**Ecologico:** \n\n**Legal:** \n\n---\n\n### 2. Fuerzas del Mercado\n\n**Competidores directos:** \n\n**Competidores indirectos:** \n\n**Nuevos entrantes:** \n\n---\n\n### 3. Tendencias Sectoriales\n\n\n---\n\n### 4. Prospectiva a 5 Anos\n\n**Escenario optimista:** \n\n**Escenario conservador:**',
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
  function renderLangToggle() {
    return (
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <span>{dispLang === 'en' ? 'Language:' : 'Idioma:'}</span>
        <button
          type="button"
          onClick={function () { setDispLang('es'); }}
          className={'rounded px-2 py-0.5 font-medium ' + (dispLang === 'es' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          ES
        </button>
        <button
          type="button"
