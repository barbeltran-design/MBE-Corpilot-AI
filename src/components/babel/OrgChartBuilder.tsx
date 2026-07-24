'use client';
import React from 'react';
type OrgLang = 'es' | 'en';
type OrgStatus = 'green' | 'yellow' | 'orange' | 'red';
type ConsejeroTipo = 'permanente' | 'tema';
type EspecialidadNegocio =
  | 'finanzas'
  | 'comercial_ventas'
  | 'operaciones'
  | 'legal'
  | 'recursos_humanos'
  | 'mercadotecnia'
  | 'tecnologia'
  | 'sustentabilidad'
  | 'otra';
type ConsejeroEntry = {
  id: string;
  nombre: string;
  derechoVoto: boolean;
  tipo: ConsejeroTipo;
  temaEspecifico: string;
  especialidad: EspecialidadNegocio;
  especialidadOtra: string;
};
type BoardData = {
  presidente: string;
  secretario: string;
  consejeros: ConsejeroEntry[];
};
type OrgRoleDef = {
  key: string;
  parent: string | null;
  nameEs: string;
  nameEn: string;
  funcEs: string;
  funcEn: string;
  respEs: string[];
  respEn: string[];
};
type OrgAssignment = {
  person: string;
  status: OrgStatus | null;
};
const STORAGE_KEY = 'babel_orgchart_v1';
const BOARD_STORAGE_KEY = 'babel_orgchart_board_v1';
const ORG_ROLES: OrgRoleDef[] = [
  {
    key: 'consejo_administrativo',
    parent: null,
    nameEs: 'Consejo Administrativo',
    nameEn: 'Board of Directors',
    funcEs: 'Administrar la empresa',
    funcEn: 'Run the company',
    respEs: [
      'Planear y desarrollar estrategias a corto y largo plazo, asi como los objetivos para lograrlos.',
      'Definir la organizacion necesaria para alcanzar los objetivos.',
      'Dirigir a la compania hacia el rumbo establecido en la planeacion y generar la cultura necesaria para lograrlo.',
      'Controlar el desempeno financiero y operativo de la organizacion y presentarlo al Consejo de la empresa.',
    ],
    respEn: [
      'Plan and develop short- and long-term strategies and the goals to achieve them.',
      'Define the organization needed to reach those goals.',
      "Steer the company toward the direction set in the planning and build the culture needed to get there.",
      'Monitor the financial and operating performance of the organization and report it to the board.',
    ],
  },
  {
    key: 'planeacion_estrategica',
    parent: 'consejo_administrativo',
    nameEs: 'Planeacion Estrategica',
    nameEn: 'Strategic Planning',
    funcEs: 'Administrar el plan estrategico',
    funcEn: 'Manage the strategic plan',
    respEs: [
      'Analizar el entorno de la organizacion.',
      'Identificar los objetivos estrategicos y alinearlos a proyectos en la operacion.',
      'Establecer costos y metas de las actividades operativas.',
      'Medir la eficiencia de los proyectos estrategicos.',
    ],
    respEn: [
      "Analyze the organization's environment.",
      'Identify strategic objectives and align them to operational projects.',
      'Set costs and targets for operating activities.',
      'Measure the efficiency of strategic projects.',
    ],
  },
  {
    key: 'finanzas',
    parent: 'consejo_administrativo',
    nameEs: 'Finanzas',
    nameEn: 'Finance',
    funcEs: 'Administrar las entradas y salidas de dinero',
    funcEn: 'Manage money coming in and going out',
    respEs: [
      'Evaluar opciones de inversion dentro de la empresa y gestionarlas.',
      'Buscar fuentes de financiamiento.',
      'Controlar los resultados financieros de la empresa.',
      'Liberar pago a proveedores y personal.',
      'Identificar montos de cartera vencida.',
    ],
    respEn: [
      'Evaluate investment options within the company and manage them.',
      'Look for financing sources.',
      "Monitor the company's financial results.",
      'Release payments to vendors and staff.',
      'Identify overdue accounts receivable amounts.',
    ],
  },
  {
    key: 'cobranza',
    parent: 'finanzas',
    nameEs: 'Cobranza',
    nameEn: 'Collections',
    funcEs: 'Administrar la cartera vencida',
    funcEn: 'Manage overdue accounts',
    respEs: [
      'Recuperar la cartera vencida.',
      'Disminuir el riesgo de cartera vencida.',
      'Identificar el proceso de pagos de los clientes y adecuar a la empresa a ellos.',
    ],
    respEn: [
      'Recover overdue accounts.',
      'Reduce the risk of overdue accounts.',
      "Identify customers' payment processes and adapt the company to them.",
    ],
  },
  {
    key: 'facturacion',
    parent: 'finanzas',
    nameEs: 'Facturacion',
    nameEn: 'Invoicing',
    funcEs: 'Administrar la facturacion de la empresa',
    funcEn: 'Manage company invoicing',
    respEs: ['Controlar la emision oportuna y correcta de facturas.'],
    respEn: ['Control the timely and correct issuance of invoices.'],
  },
  {
    key: 'contabilidad',
    parent: 'finanzas',
    nameEs: 'Contabilidad',
    nameEn: 'Accounting',
    funcEs: 'Administrar operaciones y transacciones financieras',
    funcEn: 'Manage financial operations and transactions',
    respEs: [
      'Registrar las operaciones y transacciones financieras de la organizacion.',
      'Hacer el calculo de impuestos y las declaraciones ante hacienda correspondientes.',
      'Analizar los riesgos fiscales.',
      'Realizar una planeacion y estrategia fiscal.',
    ],
    respEn: [
      "Record the organization's financial operations and transactions.",
      'Calculate taxes and file the corresponding tax returns.',
      'Analyze tax risks.',
      'Carry out tax planning and strategy.',
    ],
  },
  {
    key: 'pago_proveedores',
    parent: 'finanzas',
    nameEs: 'Pago a Proveedores',
    nameEn: 'Vendor Payments',
    funcEs: 'Pagar a los proveedores',
    funcEn: 'Pay vendors',
    respEs: [
      'Gestion y control de los pagos a los proveedores.',
      'Verificacion de facturas y resolucion de cualquier discrepancia.',
      'Elaboracion de informes financieros de pagos realizados y pendientes.',
      'Definir las reglas de pago a proveedores.',
    ],
    respEn: [
      'Manage and control payments to vendors.',
      'Verify invoices and resolve any discrepancies.',
      'Prepare financial reports of payments made and pending.',
      'Define vendor payment rules.',
    ],
  },
  {
    key: 'administracion',
    parent: 'consejo_administrativo',
    nameEs: 'Administracion',
    nameEn: 'Administration',
    funcEs: 'Gestion de recursos',
    funcEn: 'Resource management',
    respEs: [
      'Control de los recursos humanos.',
      'Gestion de los recursos tecnologicos.',
      'Supervision de la infraestructura e intangibles.',
    ],
    respEn: [
      'Control of human resources.',
      'Management of technology resources.',
      'Oversight of infrastructure and intangible assets.',
    ],
  },
  {
    key: 'recursos_humanos',
    parent: 'administracion',
    nameEs: 'Recursos Humanos',
    nameEn: 'Human Resources',
    funcEs: 'Administrar al personal',
    funcEn: 'Manage staff',
    respEs: [
      'Reclutamiento y seleccion del personal.',
      'Formacion del personal.',
      'Retencion del personal.',
      'Definir planes de beneficios.',
      'Cumplir la ley de empleo.',
      'Resolver conflictos.',
      'Evaluar el clima laboral.',
    ],
    respEn: [
      'Recruit and select staff.',
      'Train staff.',
      'Retain staff.',
      'Define benefits plans.',
      'Comply with labor law.',
      'Resolve conflicts.',
      'Assess workplace climate.',
    ],
  },
  {
    key: 'legal',
    parent: 'administracion',
    nameEs: 'Legal',
    nameEn: 'Legal',
    funcEs: 'Prevenir riesgos legales',
    funcEn: 'Prevent legal risk',
    respEs: [
      'Realizar contratos de proveedores, clientes y colaboradores.',
      'Revisar normatividades que apliquen a la organizacion.',
      'Asegurar el cumplimiento normativo y evitar penalizaciones.',
      'Prevenir juicios entre las partes interesadas.',
    ],
    respEn: [
      'Draft contracts with vendors, customers, and staff.',
      'Review regulations that apply to the organization.',
      'Ensure regulatory compliance and avoid penalties.',
      'Prevent litigation between stakeholders.',
    ],
  },
  {
    key: 'comercial',
    parent: 'consejo_administrativo',
    nameEs: 'Comercial',
    nameEn: 'Commercial',
    funcEs: 'Administrar las ventas',
    funcEn: 'Manage sales',
    respEs: [
      'Establecer los pronosticos de ventas.',
      'Analizar la rentabilidad de cada proyecto.',
      'Desarrollar canales de venta adecuados a cada mercado.',
      'Controlar el desempeno de las ventas.',
      'Administrar la implementacion de proyectos.',
      'Renovar contratos con clientes existentes.',
    ],
    respEn: [
      'Set sales forecasts.',
      'Analyze the profitability of each project.',
      'Develop sales channels suited to each market.',
      'Monitor sales performance.',
      'Manage project implementation.',
      'Renew contracts with existing customers.',
    ],
  },
  {
    key: 'mercadotecnia',
    parent: 'comercial',
    nameEs: 'Mercadotecnia',
    nameEn: 'Marketing',
    funcEs: 'Administrar la marca y los productos de la empresa',
    funcEn: "Manage the company's brand and products",
    respEs: [
      'Investigar mercados.',
      'Hacer el plan de mercadotecnia por producto.',
      'Gestionar publicidad, promocion e imagen corporativa.',
      'Atraer prospectos.',
    ],
    respEn: [
      'Research markets.',
      'Build the marketing plan per product.',
      'Manage advertising, promotion, and corporate image.',
      'Attract prospects.',
    ],
  },
  {
    key: 'relaciones_publicas',
    parent: 'comercial',
    nameEs: 'Relaciones Publicas',
    nameEn: 'Public Relations',
    funcEs: 'Gestionar los eventos hacia los grupos de interes',
    funcEn: 'Manage outreach to stakeholder groups',
    respEs: [
      'Gestionar la comunicacion y la imagen de la empresa.',
      'Mantener relaciones con los medios de comunicacion.',
      'Organizar eventos y promociones.',
      'Manejar las crisis de reputacion.',
      'Mantener una buena relacion con los diferentes grupos de interes.',
    ],
    respEn: [
      "Manage the company's communication and image.",
      'Maintain relationships with media outlets.',
      'Organize events and promotions.',
      'Handle reputation crises.',
      'Maintain good relationships with different stakeholder groups.',
    ],
  },
  {
    key: 'servicio_clientes',
    parent: 'comercial',
    nameEs: 'Servicio a Clientes',
    nameEn: 'Customer Service',
    funcEs: 'Administrar a los clientes',
    funcEn: 'Manage customers',
    respEs: [
      'Evaluar la satisfaccion de los clientes.',
      'Administrar quejas y requerimientos, asi como su solucion oportuna y correcta.',
      'Proyectar riesgos de cancelacion o perdida de clientes.',
    ],
    respEn: [
      'Assess customer satisfaction.',
      'Manage complaints and requests, and resolve them promptly and correctly.',
      'Project risks of customer cancellation or loss.',
    ],
  },
  {
    key: 'ventas',
    parent: 'comercial',
    nameEs: 'Ventas',
    nameEn: 'Sales',
    funcEs: 'Ejecutar el proceso de ventas',
    funcEn: 'Execute the sales process',
    respEs: [
      'Dar seguimiento a los pronosticos de ventas.',
      'Controlar el desempeno de las ventas dia a dia.',
      'Renovar contratos con clientes existentes.',
    ],
    respEn: [
      'Track progress against sales forecasts.',
      'Monitor day-to-day sales performance.',
      'Renew contracts with existing customers.',
    ],
  },
  {
    key: 'operacion',
    parent: 'consejo_administrativo',
    nameEs: 'Operacion',
    nameEn: 'Operations',
    funcEs: 'Administrar la operacion',
    funcEn: 'Manage operations',
    respEs: [
      'Evaluar el desempeno de los operadores de servicios.',
      'Realizar el plan diario de servicios.',
      'Ejecutar mejora continua en los servicios.',
      'Asegurar el uso correcto de materiales y herramientas.',
      'Resolver conflictos con el personal y los clientes.',
      'Administrar altas, bajas, vacaciones y comidas del personal.',
    ],
    respEn: [
      'Assess the performance of service operators.',
      'Build the daily service plan.',
      'Drive continuous improvement in services.',
      'Ensure correct use of materials and tools.',
      'Resolve conflicts with staff and customers.',
      'Manage hires, terminations, vacations, and meal schedules for staff.',
    ],
  },
  {
    key: 'procesos',
    parent: 'operacion',
    nameEs: 'Procesos',
    nameEn: 'Processes',
    funcEs: 'Administrar los procesos y la mejora continua',
    funcEn: 'Manage processes and continuous improvement',
    respEs: [
      'Planear y desarrollar procesos de la empresa alineados a objetivos estrategicos.',
      'Controlar y analizar la ejecucion de los procesos.',
      'Gestionar las mejoras de los procesos de la empresa.',
    ],
    respEn: [
      'Plan and develop company processes aligned to strategic goals.',
      'Monitor and analyze process execution.',
      'Manage improvements to company processes.',
    ],
  },
  {
    key: 'sistemas',
    parent: 'operacion',
    nameEs: 'Sistemas',
    nameEn: 'Systems',
    funcEs: 'Administrar los sistemas de la empresa',
    funcEn: 'Manage company systems',
    respEs: [
      'Definir los sistemas y herramientas que la organizacion requiere para sus funciones.',
      'Evaluar el desempeno de los sistemas.',
    ],
    respEn: [
      'Define the systems and tools the organization needs for its functions.',
      'Assess system performance.',
    ],
  },
  {
    key: 'desarrollo_proveedores',
    parent: 'operacion',
    nameEs: 'Desarrollo de Proveedores',
    nameEn: 'Vendor Development',
    funcEs: 'Gestionar proveedores criticos',
    funcEn: 'Manage critical vendors',
    respEs: [
      'Evaluar proveedores potenciales y actuales.',
      'Generar alianzas estrategicas con proveedores.',
      'Comprar insumos que la empresa requiere.',
    ],
    respEn: [
      'Assess potential and current vendors.',
      'Build strategic partnerships with vendors.',
      'Purchase the supplies the company needs.',
    ],
  },
];
const STATUS_OPTIONS: {
  value: OrgStatus;
  labelEs: string;
  labelEn: string;
  bg: string;
  text: string;
  ring: string;
}[] = [
  { value: 'green', labelEs: 'Si lo hago', labelEn: 'I do it', bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-500' },
  { value: 'yellow', labelEs: 'Lo hago parcial', labelEn: 'I partially do it', bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-500' },
  { value: 'orange', labelEs: 'Lo hace un tercero', labelEn: 'A third party does it', bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-500' },
  { value: 'red', labelEs: 'Nadie lo hace', labelEn: 'Nobody does it', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-500' },
];
const ESPECIALIDAD_OPTIONS: { value: EspecialidadNegocio; labelEs: string; labelEn: string }[] = [
  { value: 'finanzas', labelEs: 'Finanzas', labelEn: 'Finance' },
  { value: 'comercial_ventas', labelEs: 'Comercial / Ventas', labelEn: 'Commercial / Sales' },
  { value: 'operaciones', labelEs: 'Operaciones', labelEn: 'Operations' },
  { value: 'legal', labelEs: 'Legal', labelEn: 'Legal' },
  { value: 'recursos_humanos', labelEs: 'Recursos Humanos', labelEn: 'Human Resources' },
  { value: 'mercadotecnia', labelEs: 'Mercadotecnia', labelEn: 'Marketing' },
  { value: 'tecnologia', labelEs: 'Tecnologia', labelEn: 'Technology' },
  { value: 'sustentabilidad', labelEs: 'Sustentabilidad / Impacto Social', labelEn: 'Sustainability / Social Impact' },
  { value: 'otra', labelEs: 'Otra', labelEn: 'Other' },
];
function onDemandNote(status: OrgStatus | null, lang: OrgLang): string | null {
  if (status === 'red') {
    return lang === 'en'
      ? 'Strong candidate for an on-demand specialist: nobody is handling this today.'
      : 'Candidato fuerte a especialista on-demand: hoy nadie lo esta atendiendo.';
  }
  if (status === 'orange') {
    return lang === 'en'
      ? 'Already handled by a third party, a good case to keep it on-demand instead of hiring full time.'
      : 'Ya lo atiende un tercero: es un buen caso para mantenerlo on-demand en lugar de contratar tiempo completo.';
  }
  if (status === 'yellow') {
    return lang === 'en'
      ? 'Partially covered, consider reinforcing with an on-demand specialist while you decide if it needs a full-time hire.'
      : 'Se atiende de forma parcial: considera reforzar con un especialista on-demand mientras decides si amerita una contratacion de tiempo completo.';
  }
  return null;
}
const T = {
  es: {
    title: 'Organigrama y Roles',
    subtitle:
      'Define quien asume cada rol de la empresa, que tan cubierto esta hoy y cuales podrias resolver contratando un especialista on-demand.',
    repeatNote:
      'No importa que la misma persona aparezca en varios roles. Es normal en etapas iniciales que una sola persona cubra varias funciones.',
    personLabel: 'Persona asignada',
    personPlaceholder: 'Nombre de quien hace este rol',
    statusLabel: 'Estatus',
    showResp: 'Ver responsabilidades',
    hideResp: 'Ocultar responsabilidades',
    summaryTitle: 'Roles candidatos a especialista on-demand',
    summaryEmpty: 'Aun no hay roles marcados como candidatos. Asigna un estatus a cada rol para ver sugerencias aqui.',
    counts: function (g: number, y: number, o: number, r: number) {
      return 'Cubiertos: ' + g + ' \u00b7 Parciales: ' + y + ' \u00b7 Tercero: ' + o + ' \u00b7 Sin cubrir: ' + r;
    },
    savedNote: 'Los cambios se guardan automaticamente en este navegador.',
    boardIntro:
      'Define quien preside, quien es secretario y quienes son los consejeros. Un consejero puede tener derecho a voto o no, puede ser permanente o convocarse solo para un tema especifico.',
    presidenteLabel: 'Presidente',
    presidentePlaceholder: 'Nombre del presidente',
    secretarioLabel: 'Secretario',
    secretarioPlaceholder: 'Nombre del secretario',
    consejerosTitle: 'Consejeros',
    consejerosEmpty: 'Aun no has agregado consejeros.',
    addConsejero: '+ Agregar consejero',
    removeConsejero: 'Quitar',
    nombreLabel: 'Nombre',
    nombrePlaceholder: 'Nombre del consejero',
    votoLabel: 'Derecho a voto',
    votoYes: 'Si',
    votoNo: 'No',
    tipoLabel: 'Tipo de participacion',
    tipoPermanente: 'Permanente',
    tipoTema: 'Para un tema especifico',
    temaPlaceholder: 'Para que tema participa',
    especialidadLabel: 'Area de especialidad de negocio',
    especialidadOtraPlaceholder: 'Especifica la especialidad',
  },
  en: {
    title: 'Org Chart and Roles',
    subtitle:
      'Define who takes on each role in the company, how covered it is today, and which ones you could solve by hiring an on-demand specialist.',
    repeatNote:
      'It is fine for the same person to appear in several roles. It is normal in early stages for one person to cover multiple functions.',
    personLabel: 'Assigned person',
    personPlaceholder: 'Name of who does this role',
    statusLabel: 'Status',
    showResp: 'Show responsibilities',
    hideResp: 'Hide responsibilities',
    summaryTitle: 'Roles that are candidates for an on-demand specialist',
    summaryEmpty: 'No roles are flagged yet. Set a status on each role to see suggestions here.',
    counts: function (g: number, y: number, o: number, r: number) {
      return 'Covered: ' + g + ' \u00b7 Partial: ' + y + ' \u00b7 Third party: ' + o + ' \u00b7 Uncovered: ' + r;
    },
    savedNote: 'Changes are saved automatically in this browser.',
    boardIntro:
      'Define who presides, who is secretary, and who the board members are. A board member may or may not have voting rights, and may be permanent or called in only for a specific topic.',
    presidenteLabel: 'Chair / President',
    presidentePlaceholder: "Chair's name",
    secretarioLabel: 'Secretary',
    secretarioPlaceholder: "Secretary's name",
    consejerosTitle: 'Board Members',
    consejerosEmpty: 'You have not added any board members yet.',
    addConsejero: '+ Add board member',
    removeConsejero: 'Remove',
    nombreLabel: 'Name',
    nombrePlaceholder: "Board member's name",
    votoLabel: 'Voting rights',
    votoYes: 'Yes',
    votoNo: 'No',
    tipoLabel: 'Type of participation',
    tipoPermanente: 'Permanent',
    tipoTema: 'For a specific topic',
    temaPlaceholder: 'Which topic do they participate on',
    especialidadLabel: 'Business area of expertise',
    especialidadOtraPlaceholder: 'Specify the area of expertise',
  },
} as const;
function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export default function OrgChartBuilder({ lang }: { lang: OrgLang }) {
  const t = T[lang];
  const [assignments, setAssignments] = React.useState<Record<string, OrgAssignment>>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = React.useState(false);
  const [boardData, setBoardData] = React.useState<BoardData>({ presidente: '', secretario: '', consejeros: [] });
  const [boardLoaded, setBoardLoaded] = React.useState(false);
  React.useEffect(function () {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setAssignments(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);
  React.useEffect(
    function () {
      if (!loaded) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
      } catch {
        // storage full or unavailable, ignore
      }
    },
    [assignments, loaded]
  );
  React.useEffect(function () {
    try {
      const raw = window.localStorage.getItem(BOARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setBoardData({
            presidente: typeof parsed.presidente === 'string' ? parsed.presidente : '',
            secretario: typeof parsed.secretario === 'string' ? parsed.secretario : '',
            consejeros: Array.isArray(parsed.consejeros) ? parsed.consejeros : [],
          });
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setBoardLoaded(true);
  }, []);
  React.useEffect(
    function () {
      if (!boardLoaded) return;
      try {
        window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardData));
      } catch {
        // storage full or unavailable, ignore
      }
    },
    [boardData, boardLoaded]
  );
  function updatePerson(key: string, person: string) {
    setAssignments(function (prev) {
      const next = { ...prev };
      next[key] = { person: person, status: prev[key] ? prev[key].status : null };
      return next;
    });
  }
  function updateStatus(key: string, status: OrgStatus) {
    setAssignments(function (prev) {
      const next = { ...prev };
      const current = prev[key] || { person: '', status: null };
      next[key] = { person: current.person, status: current.status === status ? null : status };
      return next;
    });
  }
  function toggleExpanded(key: string) {
    setExpanded(function (prev) {
      const next = { ...prev };
      next[key] = !prev[key];
      return next;
    });
  }
  function updatePresidente(value: string) {
    setBoardData(function (prev) {
      return { ...prev, presidente: value };
    });
  }
  function updateSecretario(value: string) {
    setBoardData(function (prev) {
      return { ...prev, secretario: value };
    });
  }
  function addConsejero() {
    setBoardData(function (prev) {
      const nuevo: ConsejeroEntry = {
        id: generateId(),
        nombre: '',
        derechoVoto: true,
        tipo: 'permanente',
        temaEspecifico: '',
        especialidad: 'finanzas',
        especialidadOtra: '',
      };
      return { ...prev, consejeros: [...prev.consejeros, nuevo] };
    });
  }
  function updateConsejero(id: string, patch: Partial<ConsejeroEntry>) {
    setBoardData(function (prev) {
      return {
        ...prev,
        consejeros: prev.consejeros.map(function (c) {
          return c.id === id ? { ...c, ...patch } : c;
        }),
      };
    });
  }
  function removeConsejero(id: string) {
    setBoardData(function (prev) {
      return {
        ...prev,
        consejeros: prev.consejeros.filter(function (c) {
          return c.id !== id;
        }),
      };
    });
  }
  const topLevel = ORG_ROLES.filter(function (r) {
    return r.parent === null;
  });
  function childrenOf(parentKey: string): OrgRoleDef[] {
    return ORG_ROLES.filter(function (r) {
      return r.parent === parentKey;
    });
  }
  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  ORG_ROLES.forEach(function (r) {
    if (r.key === 'consejo_administrativo') return;
    const st = assignments[r.key] ? assignments[r.key].status : null;
    if (st) counts[st] += 1;
  });
  const candidates = ORG_ROLES.filter(function (r) {
    if (r.key === 'consejo_administrativo') return false;
    const st = assignments[r.key] ? assignments[r.key].status : null;
    return st === 'red' || st === 'orange' || st === 'yellow';
  });
  function renderRoleCard(role: OrgRoleDef, depth: number) {
    const isBoard = role.key === 'consejo_administrativo';
    const a = assignments[role.key] || { person: '', status: null };
    const isExpanded = !!expanded[role.key];
    const note = isBoard ? null : onDemandNote(a.status, lang);
    const kids = childrenOf(role.key);
    return (
      <div key={role.key} style={{ marginLeft: depth * 20 }} className="mb-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-800">
                {lang === 'en' ? role.nameEn : role.nameEs}
              </h4>
              <p className="text-sm text-slate-500">{lang === 'en' ? role.funcEn : role.funcEs}</p>
            </div>
            <button
              type="button"
              onClick={function () {
                toggleExpanded(role.key);
              }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              {isExpanded ? t.hideResp : t.showResp}
            </button>
          </div>
          {isExpanded ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {(lang === 'en' ? role.respEn : role.respEs).map(function (line, i) {
                return <li key={i}>{line}</li>;
              })}
            </ul>
          ) : null}
          {isBoard ? (
            <div className="mt-3 space-y-4">
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{t.boardIntro}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t.presidenteLabel}</label>
                  <input
                    type="text"
                    value={boardData.presidente}
                    onChange={function (e) {
                      updatePresidente(e.target.value);
                    }}
                    placeholder={t.presidentePlaceholder}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t.secretarioLabel}</label>
                  <input
                    type="text"
                    value={boardData.secretario}
                    onChange={function (e) {
                      updateSecretario(e.target.value);
                    }}
                    placeholder={t.secretarioPlaceholder}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <h5 className="mb-2 text-sm font-semibold text-slate-700">{t.consejerosTitle}</h5>
                {boardData.consejeros.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.consejerosEmpty}</p>
                ) : (
                  <div className="space-y-3">
                    {boardData.consejeros.map(function (c) {
                      return (
                        <div key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="grid flex-1 gap-2 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">{t.nombreLabel}</label>
                                <input
                                  type="text"
                                  value={c.nombre}
                                  onChange={function (e) {
                                    updateConsejero(c.id, { nombre: e.target.value });
                                  }}
                                  placeholder={t.nombrePlaceholder}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">{t.especialidadLabel}</label>
                                <select
                                  value={c.especialidad}
                                  onChange={function (e) {
                                    updateConsejero(c.id, { especialidad: e.target.value as EspecialidadNegocio });
                                  }}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                >
                                  {ESPECIALIDAD_OPTIONS.map(function (opt) {
                                    return (
                                      <option key={opt.value} value={opt.value}>
                                        {lang === 'en' ? opt.labelEn : opt.labelEs}
                                      </option>
                                    );
                                  })}
                                </select>
                                {c.especialidad === 'otra' ? (
                                  <input
                                    type="text"
                                    value={c.especialidadOtra}
                                    onChange={function (e) {
                                      updateConsejero(c.id, { especialidadOtra: e.target.value });
                                    }}
                                    placeholder={t.especialidadOtraPlaceholder}
                                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                  />
                                ) : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={function () {
                                removeConsejero(c.id);
                              }}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              {t.removeConsejero}
                            </button>
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">{t.votoLabel}</label>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={function () {
                                    updateConsejero(c.id, { derechoVoto: true });
                                  }}
                                  className={
                                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                                    (c.derechoVoto ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-slate-100 text-slate-600')
                                  }
                                >
                                  {t.votoYes}
                                </button>
                                <button
                                  type="button"
                                  onClick={function () {
                                    updateConsejero(c.id, { derechoVoto: false });
                                  }}
                                  className={
                                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                                    (!c.derechoVoto ? 'bg-red-100 text-red-800 ring-2 ring-red-500' : 'bg-slate-100 text-slate-600')
                                  }
                                >
                                  {t.votoNo}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">{t.tipoLabel}</label>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={function () {
                                    updateConsejero(c.id, { tipo: 'permanente' });
                                  }}
                                  className={
                                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                                    (c.tipo === 'permanente' ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-600')
                                  }
                                >
                                  {t.tipoPermanente}
                                </button>
                                <button
                                  type="button"
                                  onClick={function () {
                                    updateConsejero(c.id, { tipo: 'tema' });
                                  }}
                                  className={
                                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                                    (c.tipo === 'tema' ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-600')
                                  }
                                >
                                  {t.tipoTema}
                                </button>
                              </div>
                              {c.tipo === 'tema' ? (
                                <input
                                  type="text"
                                  value={c.temaEspecifico}
                                  onChange={function (e) {
                                    updateConsejero(c.id, { temaEspecifico: e.target.value });
                                  }}
                                  placeholder={t.temaPlaceholder}
                                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={addConsejero}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  {t.addConsejero}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t.personLabel}</label>
                  <input
                    type="text"
                    value={a.person}
                    onChange={function (e) {
                      updatePerson(role.key, e.target.value);
                    }}
                    placeholder={t.personPlaceholder}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t.statusLabel}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(function (opt) {
                      const active = a.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={function () {
                            updateStatus(role.key, opt.value);
                          }}
                          className={
                            'rounded-full px-2.5 py-1 text-xs font-medium ' +
                            opt.bg +
                            ' ' +
                            opt.text +
                            (active ? ' ring-2 ' + opt.ring : ' opacity-60')
                          }
                        >
                          {lang === 'en' ? opt.labelEn : opt.labelEs}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {note ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{note}</p> : null}
            </>
          )}
        </div>
        {kids.length > 0
          ? kids.map(function (kid) {
              return renderRoleCard(kid, depth + 1);
            })
          : null}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-xl font-bold text-slate-800">{t.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{t.repeatNote}</p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-2 text-sm font-semibold text-slate-700">{t.summaryTitle}</h4>
        <p className="mb-2 text-xs text-slate-400">
          {t.counts(counts.green, counts.yellow, counts.orange, counts.red)}
        </p>
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-500">{t.summaryEmpty}</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-700">
            {candidates.map(function (role) {
              const st = assignments[role.key] ? assignments[role.key].status : null;
              return (
                <li key={role.key}>
                  <span className="font-medium">{lang === 'en' ? role.nameEn : role.nameEs}</span>
                  {' \u2014 '}
                  <span className="text-slate-500">{onDemandNote(st, lang)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-6">
        {topLevel.map(function (role) {
          return renderRoleCard(role, 0);
        })}
      </div>
      <p className="mt-4 text-xs text-slate-400">{t.savedNote}</p>
    </div>
  );
}
