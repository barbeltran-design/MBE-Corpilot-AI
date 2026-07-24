'use client';
import React from 'react';

type PlanLang = 'es' | 'en';
type Perspectiva = 'financiera' | 'clientes' | 'procesos_internos' | 'aprendizaje_crecimiento';
type EntornoTipo = 'amenaza' | 'oportunidad';
type FDTipo = 'fortaleza' | 'debilidad';
type Factibilidad = 'alta' | 'media' | 'baja' | 'nula';
type Impacto = 'alto' | 'medio' | 'bajo' | 'nulo';
type Estatus = 'pendiente' | 'en_proceso' | 'terminado';

type RoleOption = { key: string; nameEs: string; nameEn: string };

type Accion = {
  id: string;
  descripcion: string;
  responsableRoleKey: string;
  responsableNombre: string;
  crossRoleKeys: string[];
  entregable: string;
  inversion: string;
  factibilidad: Factibilidad;
  impacto: Impacto;
  fecha: string;
  estatus: Estatus;
  validado: boolean;
};

type Proyecto = {
  id: string;
  nombre: string;
  responsableRoleKey: string;
  responsableNombre: string;
  validado: boolean;
  acciones: Accion[];
};

type FortalezaDebilidad = {
  id: string;
  tipo: FDTipo;
  descripcion: string;
  validado: boolean;
  proyecto: Proyecto | null;
};

type AmenazaOportunidad = {
  id: string;
  tipo: EntornoTipo;
  descripcion: string;
  validado: boolean;
  fd: FortalezaDebilidad[];
};

type Objetivo = {
  id: string;
  perspectiva: Perspectiva;
  texto: string;
  validado: boolean;
  entorno: AmenazaOportunidad[];
};

type Contacto = {
  id: string;
  nombre: string;
  celular: string;
};

const STORAGE_KEY = 'babel_plan_accion_v1';
const CONTACTS_KEY = 'babel_plan_accion_contactos_v1';
const ORG_KEY = 'babel_orgchart_v1';
const BOARD_KEY = 'babel_orgchart_board_v1';

const ROLE_OPTIONS: RoleOption[] = [
  { key: 'consejo_administrativo', nameEs: 'Consejo Administrativo', nameEn: 'Board of Directors' },
  { key: 'planeacion_estrategica', nameEs: 'Planeacion Estrategica', nameEn: 'Strategic Planning' },
  { key: 'finanzas', nameEs: 'Finanzas', nameEn: 'Finance' },
  { key: 'cobranza', nameEs: 'Cobranza', nameEn: 'Collections' },
  { key: 'facturacion', nameEs: 'Facturacion', nameEn: 'Invoicing' },
  { key: 'contabilidad', nameEs: 'Contabilidad', nameEn: 'Accounting' },
  { key: 'pago_proveedores', nameEs: 'Pago a Proveedores', nameEn: 'Vendor Payments' },
  { key: 'administracion', nameEs: 'Administracion', nameEn: 'Administration' },
  { key: 'recursos_humanos', nameEs: 'Recursos Humanos', nameEn: 'Human Resources' },
  { key: 'legal', nameEs: 'Legal', nameEn: 'Legal' },
  { key: 'comercial', nameEs: 'Comercial', nameEn: 'Commercial' },
  { key: 'mercadotecnia', nameEs: 'Mercadotecnia', nameEn: 'Marketing' },
  { key: 'relaciones_publicas', nameEs: 'Relaciones Publicas', nameEn: 'Public Relations' },
  { key: 'servicio_clientes', nameEs: 'Servicio a Clientes', nameEn: 'Customer Service' },
  { key: 'ventas', nameEs: 'Ventas', nameEn: 'Sales' },
  { key: 'operacion', nameEs: 'Operacion', nameEn: 'Operations' },
  { key: 'procesos', nameEs: 'Procesos', nameEn: 'Processes' },
  { key: 'sistemas', nameEs: 'Sistemas', nameEn: 'Systems' },
  { key: 'desarrollo_proveedores', nameEs: 'Desarrollo de Proveedores', nameEn: 'Vendor Development' },
];

const PERSPECTIVA_OPTIONS: { value: Perspectiva; labelEs: string; labelEn: string }[] = [
  { value: 'financiera', labelEs: 'Financiera', labelEn: 'Financial' },
  { value: 'clientes', labelEs: 'Clientes', labelEn: 'Customer' },
  { value: 'procesos_internos', labelEs: 'Procesos Internos', labelEn: 'Internal Processes' },
  { value: 'aprendizaje_crecimiento', labelEs: 'Aprendizaje y Crecimiento', labelEn: 'Learning and Growth' },
];

const FACTIBILIDAD_OPTIONS: { value: Factibilidad; labelEs: string; labelEn: string }[] = [
  { value: 'alta', labelEs: 'Alta', labelEn: 'High' },
  { value: 'media', labelEs: 'Media', labelEn: 'Medium' },
  { value: 'baja', labelEs: 'Baja', labelEn: 'Low' },
  { value: 'nula', labelEs: 'Nula', labelEn: 'None' },
];

const IMPACTO_OPTIONS: { value: Impacto; labelEs: string; labelEn: string }[] = [
  { value: 'alto', labelEs: 'Alto', labelEn: 'High' },
  { value: 'medio', labelEs: 'Medio', labelEn: 'Medium' },
  { value: 'bajo', labelEs: 'Bajo', labelEn: 'Low' },
  { value: 'nulo', labelEs: 'Nulo', labelEn: 'None' },
];

const ESTATUS_OPTIONS: { value: Estatus; labelEs: string; labelEn: string }[] = [
  { value: 'pendiente', labelEs: 'Pendiente', labelEn: 'Pending' },
  { value: 'en_proceso', labelEs: 'En proceso', labelEn: 'In progress' },
  { value: 'terminado', labelEs: 'Terminado', labelEn: 'Done' },
];

// Tabla de prioridad aprobada y corregida: de mas (1) a menos (16) prioritaria.
const PRIORITY_ORDER: [Factibilidad, Impacto][] = [
  ['alta', 'alto'],
  ['media', 'alto'],
  ['alta', 'medio'],
  ['media', 'medio'],
  ['baja', 'alto'],
  ['alta', 'bajo'],
  ['baja', 'medio'],
  ['media', 'bajo'],
  ['baja', 'bajo'],
  ['nula', 'alto'],
  ['nula', 'medio'],
  ['nula', 'bajo'],
  ['alta', 'nulo'],
  ['media', 'nulo'],
  ['baja', 'nulo'],
  ['nula', 'nulo'],
];

function priorityRank(factibilidad: Factibilidad, impacto: Impacto): number {
  const idx = PRIORITY_ORDER.findIndex(function (pair) {
    return pair[0] === factibilidad && pair[1] === impacto;
  });
  return idx === -1 ? 16 : idx + 1;
}

function priorityTier(rank: number, lang: PlanLang): { label: string; classes: string } {
  if (rank <= 3) return { label: lang === 'en' ? 'Very high priority' : 'Prioridad muy alta', classes: 'bg-purple-100 text-purple-800' };
  if (rank <= 6) return { label: lang === 'en' ? 'High priority' : 'Prioridad alta', classes: 'bg-blue-100 text-blue-800' };
  if (rank <= 9) return { label: lang === 'en' ? 'Medium priority' : 'Prioridad media', classes: 'bg-yellow-100 text-yellow-800' };
  if (rank <= 12) return { label: lang === 'en' ? 'Low priority' : 'Prioridad baja', classes: 'bg-orange-100 text-orange-800' };
  return { label: lang === 'en' ? 'Not worth pursuing' : 'Prioridad nula', classes: 'bg-slate-100 text-slate-500' };
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function suggestedDate(rank: number): string {
  const today = new Date();
  if (rank <= 3) return addDays(today, 14);
  if (rank <= 6) return addDays(today, 30);
  if (rank <= 9) return addDays(today, 60);
  if (rank <= 12) return addDays(today, 90);
  return addDays(today, 180);
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function roleLabel(roleKey: string, lang: PlanLang): string {
  const r = ROLE_OPTIONS.find(function (opt) {
    return opt.key === roleKey;
  });
  if (!r) return '';
  return lang === 'en' ? r.nameEn : r.nameEs;
}

function whatsappLink(celular: string, mensaje: string): string {
  const clean = celular.replace(/[^0-9]/g, '');
  return 'https://api.whatsapp.com/send?phone=' + clean + '&text=' + encodeURIComponent(mensaje);
}

function daysUntil(fecha: string): number {
  if (!fecha) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(fecha + 'T00:00:00');
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

const T = {
  es: {
    title: 'Plan de Accion Estrategico',
    subtitle:
      'Por cada objetivo de negocio, registra las amenazas u oportunidades del entorno, tus fortalezas o debilidades frente a ellas, el proyecto que las atiende y las acciones concretas para lograrlo.',
    contactsTitle: 'Directorio de Contactos',
    contactsSubtitle: 'Nombre y celular de cada responsable, para poder enviar recordatorios por WhatsApp.',
    addContact: '+ Agregar contacto',
    contactName: 'Nombre',
    contactPhone: 'Celular (con codigo de pais, ej. 52...)',
    summaryTitle: 'Resumen',
    summaryObjetivos: 'Objetivos',
    summaryAcciones: 'Acciones totales',
    summaryVencidas: 'Acciones vencidas',
    summaryPorVencer: 'Por vencer en 7 dias',
    summaryValidar: 'Elementos pendientes de validar',
    addObjetivo: '+ Agregar objetivo de negocio',
    perspectivaLabel: 'Perspectiva (Balanced Scorecard)',
    objetivoLabel: 'Objetivo de negocio',
    objetivoPlaceholder: 'Ej. Incrementar utilidad a 10% anual',
    validar: 'Validar',
    validado: 'Validado',
    pendienteValidar: 'Pendiente de validar',
    eliminar: 'Eliminar',
    addEntorno: '+ Agregar amenaza u oportunidad',
    entornoTipo: 'Tipo',
    amenaza: 'Amenaza',
    oportunidad: 'Oportunidad',
    entornoDesc: 'Descripcion (que detectamos en el entorno)',
    entornoPlaceholder: 'Ej. Inflacion en insumos importados',
    addFD: '+ Agregar fortaleza o debilidad',
    fortaleza: 'Fortaleza',
    debilidad: 'Debilidad',
    fdDesc: 'Descripcion',
    fdPlaceholder: 'Ej. Maquinaria propia con capacidad instalada',
    definirProyecto: '+ Definir proyecto',
    proyectoLabel: 'Nombre del proyecto',
    proyectoPlaceholder: 'Ej. Automatizar inteligencia de negocio (ERP)',
    responsableLabel: 'Responsable (rol del organigrama)',
    responsableNombreLabel: 'Nombre del responsable',
    addAccion: '+ Agregar accion',
    accionDesc: 'Descripcion de la accion',
    accionPlaceholder: 'Ej. Cotizar 3 proveedores de ERP',
    crossLabel: 'Areas de apoyo (crossfuncional)',
    entregableLabel: 'Entregable (evidencia de que se hizo)',
    entregablePlaceholder: 'Ej. Lista de asistencia, cotizacion firmada...',
    inversionLabel: 'Inversion requerida',
    inversionPlaceholder: 'Ej. $15,000 MXN o Sin costo',
    factibilidadLabel: 'Factibilidad',
    impactoLabel: 'Impacto economico',
    prioridadLabel: 'Prioridad calculada',
    fechaLabel: 'Fecha de implementacion',
    estatusLabel: 'Estatus',
    sendReminder: 'Enviar recordatorio por WhatsApp',
    noPhone: 'Agrega el celular de esta persona en el Directorio de Contactos para poder enviar el recordatorio.',
    reminderMsg: function (nombre: string, tarea: string, proyecto: string, fecha: string, entregable: string) {
      return (
        'Hola ' +
        nombre +
        ', tu tarea "' +
        tarea +
        '" del proyecto "' +
        proyecto +
        '" tiene fecha compromiso ' +
        fecha +
        '. Entregable esperado: ' +
        (entregable || 'sin definir') +
        '. Pf confirma como vas.'
      );
    },
    savedNote: 'Los cambios se guardan automaticamente en este navegador.',
    dueSoon: 'Vence pronto',
    overdue: 'Vencida',
  },
  en: {
    title: 'Strategic Action Plan',
    subtitle:
      'For each business objective, log the threats or opportunities in the environment, your strengths or weaknesses facing them, the project that addresses them, and the concrete actions to get it done.',
    contactsTitle: 'Contact Directory',
    contactsSubtitle: 'Name and phone number for each owner, so reminders can be sent over WhatsApp.',
    addContact: '+ Add contact',
    contactName: 'Name',
    contactPhone: 'Phone (with country code, e.g. 52...)',
    summaryTitle: 'Summary',
    summaryObjetivos: 'Objectives',
    summaryAcciones: 'Total actions',
    summaryVencidas: 'Overdue actions',
    summaryPorVencer: 'Due within 7 days',
    summaryValidar: 'Items pending validation',
    addObjetivo: '+ Add business objective',
    perspectivaLabel: 'Perspective (Balanced Scorecard)',
    objetivoLabel: 'Business objective',
    objetivoPlaceholder: 'E.g. Increase profit to 10% annually',
    validar: 'Validate',
    validado: 'Validated',
    pendienteValidar: 'Pending validation',
    eliminar: 'Remove',
    addEntorno: '+ Add threat or opportunity',
    entornoTipo: 'Type',
    amenaza: 'Threat',
    oportunidad: 'Opportunity',
    entornoDesc: 'Description (what we detected in the environment)',
    entornoPlaceholder: 'E.g. Inflation on imported supplies',
    addFD: '+ Add strength or weakness',
    fortaleza: 'Strength',
    debilidad: 'Weakness',
    fdDesc: 'Description',
    fdPlaceholder: 'E.g. Own machinery with installed capacity',
    definirProyecto: '+ Define project',
    proyectoLabel: 'Project name',
    proyectoPlaceholder: 'E.g. Automate business intelligence (ERP)',
    responsableLabel: 'Owner (org chart role)',
    responsableNombreLabel: "Owner's name",
    addAccion: '+ Add action',
    accionDesc: 'Action description',
    accionPlaceholder: 'E.g. Get quotes from 3 ERP vendors',
    crossLabel: 'Supporting areas (cross-functional)',
    entregableLabel: 'Deliverable (evidence the action happened)',
    entregablePlaceholder: 'E.g. Attendance list, signed quote...',
    inversionLabel: 'Investment required',
    inversionPlaceholder: 'E.g. $15,000 MXN or No cost',
    factibilidadLabel: 'Feasibility',
    impactoLabel: 'Economic impact',
    prioridadLabel: 'Calculated priority',
    fechaLabel: 'Implementation date',
    estatusLabel: 'Status',
    sendReminder: 'Send WhatsApp reminder',
    noPhone: "Add this person's phone number in the Contact Directory to send the reminder.",
    reminderMsg: function (nombre: string, tarea: string, proyecto: string, fecha: string, entregable: string) {
      return (
        'Hi ' +
        nombre +
        ', your task "' +
        tarea +
        '" for project "' +
        proyecto +
        '" is due ' +
        fecha +
        '. Expected deliverable: ' +
        (entregable || 'not set') +
        '. Please confirm your progress.'
      );
    },
    savedNote: 'Changes are saved automatically in this browser.',
    dueSoon: 'Due soon',
    overdue: 'Overdue',
  },
} as const;

function newAccion(rank: number): Accion {
  return {
    id: generateId(),
    descripcion: '',
    responsableRoleKey: '',
    responsableNombre: '',
    crossRoleKeys: [],
    entregable: '',
    inversion: '',
    factibilidad: 'media',
    impacto: 'medio',
    fecha: suggestedDate(rank),
    estatus: 'pendiente',
    validado: false,
  };
}

function newProyecto(): Proyecto {
  return {
    id: generateId(),
    nombre: '',
    responsableRoleKey: '',
    responsableNombre: '',
    validado: false,
    acciones: [],
  };
}

function newFD(tipo: FDTipo): FortalezaDebilidad {
  return { id: generateId(), tipo: tipo, descripcion: '', validado: false, proyecto: null };
}

function newEntorno(tipo: EntornoTipo): AmenazaOportunidad {
  return { id: generateId(), tipo: tipo, descripcion: '', validado: false, fd: [] };
}

function newObjetivo(): Objetivo {
  return { id: generateId(), perspectiva: 'financiera', texto: '', validado: false, entorno: [] };
}

export default function PlanAccionBuilder({ lang }: { lang: PlanLang }) {
  const t = T[lang];
  const [objetivos, setObjetivos] = React.useState<Objetivo[]>([]);
  const [contactos, setContactos] = React.useState<Contacto[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = React.useState(false);
  const [orgAssignments, setOrgAssignments] = React.useState<Record<string, { person: string }>>({});
  const [boardPresidente, setBoardPresidente] = React.useState('');

  React.useEffect(function () {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setObjetivos(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    try {
      const rawC = window.localStorage.getItem(CONTACTS_KEY);
      if (rawC) {
        const parsedC = JSON.parse(rawC);
        if (Array.isArray(parsedC)) setContactos(parsedC);
      }
    } catch {
      // ignore corrupt storage
    }
    try {
      const rawOrg = window.localStorage.getItem(ORG_KEY);
      if (rawOrg) {
        const parsedOrg = JSON.parse(rawOrg);
        if (parsedOrg && typeof parsedOrg === 'object') setOrgAssignments(parsedOrg);
      }
    } catch {
      // ignore, org chart data is optional here
    }
    try {
      const rawBoard = window.localStorage.getItem(BOARD_KEY);
      if (rawBoard) {
        const parsedBoard = JSON.parse(rawBoard);
        if (parsedBoard && typeof parsedBoard.presidente === 'string') setBoardPresidente(parsedBoard.presidente);
      }
    } catch {
      // ignore, org chart data is optional here
    }
    setLoaded(true);
  }, []);

  React.useEffect(
    function () {
      if (!loaded) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(objetivos));
      } catch {
        // storage full or unavailable, ignore
      }
    },
    [objetivos, loaded]
  );

  React.useEffect(
    function () {
      if (!loaded) return;
      try {
        window.localStorage.setItem(CONTACTS_KEY, JSON.stringify(contactos));
      } catch {
        // storage full or unavailable, ignore
      }
    },
    [contactos, loaded]
  );

  function toggleExpanded(id: string) {
    setExpanded(function (prev) {
      const next = { ...prev };
      next[id] = !prev[id];
      return next;
    });
  }

  function resolvePersonForRole(roleKey: string): string {
    if (!roleKey) return '';
    if (roleKey === 'consejo_administrativo') return boardPresidente;
    const a = orgAssignments[roleKey];
    return a && a.person ? a.person : '';
  }

  function resolveCelular(nombre: string): string {
    if (!nombre) return '';
    const found = contactos.find(function (c) {
      return c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase();
    });
    return found ? found.celular : '';
  }

  // ---- Contactos ----
  function addContacto() {
    setContactos(function (prev) {
      return [...prev, { id: generateId(), nombre: '', celular: '' }];
    });
  }
  function updateContacto(id: string, patch: Partial<Contacto>) {
    setContactos(function (prev) {
      return prev.map(function (c) {
        return c.id === id ? { ...c, ...patch } : c;
      });
    });
  }
  function removeContacto(id: string) {
    setContactos(function (prev) {
      return prev.filter(function (c) {
        return c.id !== id;
      });
    });
  }

  // ---- Objetivos ----
  function addObjetivo() {
    setObjetivos(function (prev) {
      return [...prev, newObjetivo()];
    });
  }
  function updateObjetivo(id: string, patch: Partial<Objetivo>) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        return o.id === id ? { ...o, ...patch } : o;
      });
    });
  }
  function removeObjetivo(id: string) {
    setObjetivos(function (prev) {
      return prev.filter(function (o) {
        return o.id !== id;
      });
    });
  }

  // ---- Entorno (amenaza/oportunidad) ----
  function addEntorno(objetivoId: string, tipo: EntornoTipo) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return { ...o, entorno: [...o.entorno, newEntorno(tipo)] };
      });
    });
  }
  function updateEntorno(objetivoId: string, entornoId: string, patch: Partial<AmenazaOportunidad>) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            return e.id === entornoId ? { ...e, ...patch } : e;
          }),
        };
      });
    });
  }
  function removeEntorno(objetivoId: string, entornoId: string) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.filter(function (e) {
            return e.id !== entornoId;
          }),
        };
      });
    });
  }

  // ---- Fortaleza/Debilidad ----
  function addFD(objetivoId: string, entornoId: string, tipo: FDTipo) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return { ...e, fd: [...e.fd, newFD(tipo)] };
          }),
        };
      });
    });
  }
  function updateFD(objetivoId: string, entornoId: string, fdId: string, patch: Partial<FortalezaDebilidad>) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return {
              ...e,
              fd: e.fd.map(function (f) {
                return f.id === fdId ? { ...f, ...patch } : f;
              }),
            };
          }),
        };
      });
    });
  }
  function removeFD(objetivoId: string, entornoId: string, fdId: string) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return {
              ...e,
              fd: e.fd.filter(function (f) {
                return f.id !== fdId;
              }),
            };
          }),
        };
      });
    });
  }

  // ---- Proyecto ----
  function setProyecto(objetivoId: string, entornoId: string, fdId: string) {
    updateFD(objetivoId, entornoId, fdId, { proyecto: newProyecto() });
  }
  function updateProyecto(objetivoId: string, entornoId: string, fdId: string, patch: Partial<Proyecto>) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return {
              ...e,
              fd: e.fd.map(function (f) {
                if (f.id !== fdId || !f.proyecto) return f;
                return { ...f, proyecto: { ...f.proyecto, ...patch } };
              }),
            };
          }),
        };
      });
    });
  }
  function removeProyecto(objetivoId: string, entornoId: string, fdId: string) {
    updateFD(objetivoId, entornoId, fdId, { proyecto: null });
  }

  // ---- Acciones ----
  function addAccion(objetivoId: string, entornoId: string, fdId: string) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return {
              ...e,
              fd: e.fd.map(function (f) {
                if (f.id !== fdId || !f.proyecto) return f;
                const rank = priorityRank('media', 'medio');
                return { ...f, proyecto: { ...f.proyecto, acciones: [...f.proyecto.acciones, newAccion(rank)] } };
              }),
            };
          }),
        };
      });
    });
  }
  function updateAccion(objetivoId: string, entornoId: string, fdId: string, accionId: string, patch: Partial<Accion>) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return {
              ...e,
              fd: e.fd.map(function (f) {
                if (f.id !== fdId || !f.proyecto) return f;
                return {
                  ...f,
                  proyecto: {
                    ...f.proyecto,
                    acciones: f.proyecto.acciones.map(function (a) {
                      if (a.id !== accionId) return a;
                      const merged = { ...a, ...patch };
                      // Si cambia factibilidad o impacto y la fecha seguia siendo la sugerida anterior, la actualizamos.
                      if ((patch.factibilidad || patch.impacto) && (!a.fecha || a.fecha === suggestedDate(priorityRank(a.factibilidad, a.impacto)))) {
                        merged.fecha = suggestedDate(priorityRank(merged.factibilidad, merged.impacto));
                      }
                      return merged;
                    }),
                  },
                };
              }),
            };
          }),
        };
      });
    });
  }
  function removeAccion(objetivoId: string, entornoId: string, fdId: string, accionId: string) {
    setObjetivos(function (prev) {
      return prev.map(function (o) {
        if (o.id !== objetivoId) return o;
        return {
          ...o,
          entorno: o.entorno.map(function (e) {
            if (e.id !== entornoId) return e;
            return {
              ...e,
              fd: e.fd.map(function (f) {
                if (f.id !== fdId || !f.proyecto) return f;
                return {
                  ...f,
                  proyecto: {
                    ...f.proyecto,
                    acciones: f.proyecto.acciones.filter(function (a) {
                      return a.id !== accionId;
                    }),
                  },
                };
              }),
            };
          }),
        };
      });
    });
  }

  // ---- Resumen ----
  const todasAcciones: Accion[] = [];
  objetivos.forEach(function (o) {
    o.entorno.forEach(function (e) {
      e.fd.forEach(function (f) {
        if (f.proyecto) {
          f.proyecto.acciones.forEach(function (a) {
            todasAcciones.push(a);
          });
        }
      });
    });
  });
  const vencidas = todasAcciones.filter(function (a) {
    return a.estatus !== 'terminado' && daysUntil(a.fecha) < 0;
  });
  const porVencer = todasAcciones.filter(function (a) {
    const d = daysUntil(a.fecha);
    return a.estatus !== 'terminado' && d >= 0 && d <= 7;
  });
  let pendientesValidar = 0;
  objetivos.forEach(function (o) {
    if (!o.validado) pendientesValidar++;
    o.entorno.forEach(function (e) {
      if (!e.validado) pendientesValidar++;
      e.fd.forEach(function (f) {
        if (!f.validado) pendientesValidar++;
        if (f.proyecto) {
          if (!f.proyecto.validado) pendientesValidar++;
          f.proyecto.acciones.forEach(function (a) {
            if (!a.validado) pendientesValidar++;
          });
        }
      });
    });
  });

  function ValidateBadge({ validado, onToggle }: { validado: boolean; onToggle: () => void }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={
          'rounded-full px-2.5 py-1 text-xs font-medium ' +
          (validado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800')
        }
      >
        {validado ? '\u2713 ' + t.validado : t.pendienteValidar}
      </button>
    );
  }

  function renderAccion(objetivoId: string, entornoId: string, fdId: string, proyectoNombre: string, a: Accion) {
    const rank = priorityRank(a.factibilidad, a.impacto);
    const tier = priorityTier(rank, lang);
    const celular = resolveCelular(a.responsableNombre);
    const d = daysUntil(a.fecha);
    const showDue = a.estatus !== 'terminado' && d <= 7;
    return (
      <div key={a.id} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.accionDesc}</label>
              <input
                type="text"
                value={a.descripcion}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { descripcion: e.target.value });
                }}
                placeholder={t.accionPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.responsableLabel}</label>
              <select
                value={a.responsableRoleKey}
                onChange={function (e) {
                  const roleKey = e.target.value;
                  const person = resolvePersonForRole(roleKey);
                  updateAccion(objetivoId, entornoId, fdId, a.id, {
                    responsableRoleKey: roleKey,
                    responsableNombre: person || a.responsableNombre,
                  });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">{'-- ' + t.responsableLabel + ' --'}</option>
                {ROLE_OPTIONS.map(function (opt) {
                  const person = resolvePersonForRole(opt.key);
                  const label = roleLabel(opt.key, lang) + (person ? ' \u2014 ' + person : '');
                  return (
                    <option key={opt.key} value={opt.key}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <input
                type="text"
                value={a.responsableNombre}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { responsableNombre: e.target.value });
                }}
                placeholder={t.responsableNombreLabel}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.crossLabel}</label>
              <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto rounded-lg border border-slate-200 p-1.5">
                {ROLE_OPTIONS.map(function (opt) {
                  const active = a.crossRoleKeys.indexOf(opt.key) !== -1;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={function () {
                        const next = active
                          ? a.crossRoleKeys.filter(function (k) {
                              return k !== opt.key;
                            })
                          : [...a.crossRoleKeys, opt.key];
                        updateAccion(objetivoId, entornoId, fdId, a.id, { crossRoleKeys: next });
                      }}
                      className={
                        'rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                        (active ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400' : 'bg-slate-100 text-slate-600')
                      }
                    >
                      {roleLabel(opt.key, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.entregableLabel}</label>
              <input
                type="text"
                value={a.entregable}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { entregable: e.target.value });
                }}
                placeholder={t.entregablePlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.inversionLabel}</label>
              <input
                type="text"
                value={a.inversion}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { inversion: e.target.value });
                }}
                placeholder={t.inversionPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.factibilidadLabel}</label>
              <select
                value={a.factibilidad}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { factibilidad: e.target.value as Factibilidad });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                {FACTIBILIDAD_OPTIONS.map(function (opt) {
                  return (
                    <option key={opt.value} value={opt.value}>
                      {lang === 'en' ? opt.labelEn : opt.labelEs}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.impactoLabel}</label>
              <select
                value={a.impacto}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { impacto: e.target.value as Impacto });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                {IMPACTO_OPTIONS.map(function (opt) {
                  return (
                    <option key={opt.value} value={opt.value}>
                      {lang === 'en' ? opt.labelEn : opt.labelEs}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.prioridadLabel}</label>
              <span className={'inline-block rounded-full px-2.5 py-1 text-xs font-medium ' + tier.classes}>
                #{rank} \u2014 {tier.label}
              </span>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.fechaLabel}</label>
              <input
                type="date"
                value={a.fecha}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { fecha: e.target.value });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              {showDue ? (
                <span className={'mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ' + (d < 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}>
                  {d < 0 ? t.overdue : t.dueSoon}
                </span>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.estatusLabel}</label>
              <select
                value={a.estatus}
                onChange={function (e) {
                  updateAccion(objetivoId, entornoId, fdId, a.id, { estatus: e.target.value as Estatus });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                {ESTATUS_OPTIONS.map(function (opt) {
                  return (
                    <option key={opt.value} value={opt.value}>
                      {lang === 'en' ? opt.labelEn : opt.labelEs}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ValidateBadge
              validado={a.validado}
              onToggle={function () {
                updateAccion(objetivoId, entornoId, fdId, a.id, { validado: !a.validado });
              }}
            />
            <button
              type="button"
              onClick={function () {
                removeAccion(objetivoId, entornoId, fdId, a.id);
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {t.eliminar}
            </button>
          </div>
        </div>
        <div className="mt-2">
          {celular ? (
            
              href={whatsappLink(celular, t.reminderMsg(a.responsableNombre, a.descripcion, proyectoNombre, a.fecha, a.entregable))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              {t.sendReminder}
            </a>
          ) : (
            <p className="text-xs text-slate-400">{t.noPhone}</p>
          )}
        </div>
      </div>
    );
  }

  function renderProyecto(objetivoId: string, entornoId: string, fdId: string, p: Proyecto) {
    const isExpanded = !!expanded[p.id];
    return (
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">{t.proyectoLabel}</label>
            <input
              type="text"
              value={p.nombre}
              onChange={function (e) {
                updateProyecto(objetivoId, entornoId, fdId, { nombre: e.target.value });
              }}
              placeholder={t.proyectoPlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">{t.responsableLabel}</label>
            <select
              value={p.responsableRoleKey}
              onChange={function (e) {
                const roleKey = e.target.value;
                const person = resolvePersonForRole(roleKey);
                updateProyecto(objetivoId, entornoId, fdId, {
                  responsableRoleKey: roleKey,
                  responsableNombre: person || p.responsableNombre,
                });
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">{'-- ' + t.responsableLabel + ' --'}</option>
              {ROLE_OPTIONS.map(function (opt) {
                const person = resolvePersonForRole(opt.key);
                const label = roleLabel(opt.key, lang) + (person ? ' \u2014 ' + person : '');
                return (
                  <option key={opt.key} value={opt.key}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={function () {
              toggleExpanded(p.id);
            }}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {isExpanded ? '\u25b2' : '\u25bc'} {t.addAccion.replace('+ ', '')} ({p.acciones.length})
          </button>
          <div className="flex items-center gap-2">
            <ValidateBadge
              validado={p.validado}
              onToggle={function () {
                updateProyecto(objetivoId, entornoId, fdId, { validado: !p.validado });
              }}
            />
            <button
              type="button"
              onClick={function () {
                removeProyecto(objetivoId, entornoId, fdId);
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {t.eliminar}
            </button>
          </div>
        </div>
        {isExpanded ? (
          <div className="mt-3">
            {p.acciones.map(function (a) {
              return renderAccion(objetivoId, entornoId, fdId, p.nombre, a);
            })}
            <button
              type="button"
              onClick={function () {
                addAccion(objetivoId, entornoId, fdId);
              }}
              className="mt-1 text-xs font-medium text-blue-600 hover:underline"
            >
              {t.addAccion}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderFD(objetivoId: string, entornoId: string, f: FortalezaDebilidad) {
    const isExpanded = !!expanded[f.id];
    return (
      <div key={f.id} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.entornoTipo}</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={function () {
                    updateFD(objetivoId, entornoId, f.id, { tipo: 'fortaleza' });
                  }}
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (f.tipo === 'fortaleza' ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-slate-100 text-slate-600')
                  }
                >
                  {t.fortaleza}
                </button>
                <button
                  type="button"
                  onClick={function () {
                    updateFD(objetivoId, entornoId, f.id, { tipo: 'debilidad' });
                  }}
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (f.tipo === 'debilidad' ? 'bg-red-100 text-red-800 ring-2 ring-red-500' : 'bg-slate-100 text-slate-600')
                  }
                >
                  {t.debilidad}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.fdDesc}</label>
              <input
                type="text"
                value={f.descripcion}
                onChange={function (e) {
                  updateFD(objetivoId, entornoId, f.id, { descripcion: e.target.value });
                }}
                placeholder={t.fdPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ValidateBadge
              validado={f.validado}
              onToggle={function () {
                updateFD(objetivoId, entornoId, f.id, { validado: !f.validado });
              }}
            />
            <button
              type="button"
              onClick={function () {
                removeFD(objetivoId, entornoId, f.id);
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {t.eliminar}
            </button>
          </div>
        </div>
        {f.proyecto ? (
          renderProyecto(objetivoId, entornoId, f.id, f.proyecto)
        ) : (
          <button
            type="button"
            onClick={function () {
              setProyecto(objetivoId, entornoId, f.id);
            }}
            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
          >
            {t.definirProyecto}
          </button>
        )}
      </div>
    );
  }

  function renderEntorno(objetivoId: string, e: AmenazaOportunidad) {
    const isExpanded = !!expanded[e.id];
    return (
      <div key={e.id} className="mb-3 rounded-lg border border-slate-300 bg-slate-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.entornoTipo}</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={function () {
                    updateEntorno(objetivoId, e.id, { tipo: 'amenaza' });
                  }}
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (e.tipo === 'amenaza' ? 'bg-red-100 text-red-800 ring-2 ring-red-500' : 'bg-slate-100 text-slate-600')
                  }
                >
                  {t.amenaza}
                </button>
                <button
                  type="button"
                  onClick={function () {
                    updateEntorno(objetivoId, e.id, { tipo: 'oportunidad' });
                  }}
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (e.tipo === 'oportunidad' ? 'bg-green-100 text-green-800 ring-2 ring-green-500' : 'bg-slate-100 text-slate-600')
                  }
                >
                  {t.oportunidad}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.entornoDesc}</label>
              <input
                type="text"
                value={e.descripcion}
                onChange={function (ev) {
                  updateEntorno(objetivoId, e.id, { descripcion: ev.target.value });
                }}
                placeholder={t.entornoPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ValidateBadge
              validado={e.validado}
              onToggle={function () {
                updateEntorno(objetivoId, e.id, { validado: !e.validado });
              }}
            />
            <button
              type="button"
              onClick={function () {
                removeEntorno(objetivoId, e.id);
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {t.eliminar}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={function () {
            toggleExpanded(e.id);
          }}
          className="mt-2 text-xs font-medium text-blue-600 hover:underline"
        >
          {isExpanded ? '\u25b2' : '\u25bc'} {t.fortaleza}/{t.debilidad} ({e.fd.length})
        </button>
        {isExpanded ? (
          <div className="mt-3">
            {e.fd.map(function (f) {
              return renderFD(objetivoId, e.id, f);
            })}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={function () {
                  addFD(objetivoId, e.id, 'fortaleza');
                }}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {t.addFD} ({t.fortaleza})
              </button>
              <button
                type="button"
                onClick={function () {
                  addFD(objetivoId, e.id, 'debilidad');
                }}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {t.addFD} ({t.debilidad})
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderObjetivo(o: Objetivo) {
    const isExpanded = !!expanded[o.id];
    return (
      <div key={o.id} className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.perspectivaLabel}</label>
              <select
                value={o.perspectiva}
                onChange={function (e) {
                  updateObjetivo(o.id, { perspectiva: e.target.value as Perspectiva });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                {PERSPECTIVA_OPTIONS.map(function (opt) {
                  return (
                    <option key={opt.value} value={opt.value}>
                      {lang === 'en' ? opt.labelEn : opt.labelEs}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.objetivoLabel}</label>
              <input
                type="text"
                value={o.texto}
                onChange={function (e) {
                  updateObjetivo(o.id, { texto: e.target.value });
                }}
                placeholder={t.objetivoPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ValidateBadge
              validado={o.validado}
              onToggle={function () {
                updateObjetivo(o.id, { validado: !o.validado });
              }}
            />
            <button
              type="button"
              onClick={function () {
                removeObjetivo(o.id);
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {t.eliminar}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={function () {
            toggleExpanded(o.id);
          }}
          className="mt-3 text-xs font-medium text-blue-600 hover:underline"
        >
          {isExpanded ? '\u25b2' : '\u25bc'} {t.amenaza}/{t.oportunidad} ({o.entorno.length})
        </button>
        {isExpanded ? (
          <div className="mt-3">
            {o.entorno.map(function (e) {
              return renderEntorno(o.id, e);
            })}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={function () {
                  addEntorno(o.id, 'amenaza');
                }}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {t.addEntorno} ({t.amenaza})
              </button>
              <button
                type="button"
                onClick={function () {
                  addEntorno(o.id, 'oportunidad');
                }}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {t.addEntorno} ({t.oportunidad})
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h3 className="text-xl font-bold text-slate-800">{t.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-1 text-sm font-semibold text-slate-700">{t.contactsTitle}</h4>
        <p className="mb-2 text-xs text-slate-400">{t.contactsSubtitle}</p>
        {contactos.map(function (c) {
          return (
            <div key={c.id} className="mb-2 flex items-center gap-2">
              <input
                type="text"
                value={c.nombre}
                onChange={function (e) {
                  updateContacto(c.id, { nombre: e.target.value });
                }}
                placeholder={t.contactName}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                value={c.celular}
                onChange={function (e) {
                  updateContacto(c.id, { celular: e.target.value });
                }}
                placeholder={t.contactPhone}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={function () {
                  removeContacto(c.id);
                }}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                {t.eliminar}
              </button>
            </div>
          );
        })}
        <button type="button" onClick={addContacto} className="text-xs font-medium text-blue-600 hover:underline">
          {t.addContact}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <div className="text-lg font-bold text-slate-800">{objetivos.length}</div>
          <div className="text-xs text-slate-500">{t.summaryObjetivos}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <div className="text-lg font-bold text-slate-800">{todasAcciones.length}</div>
          <div className="text-xs text-slate-500">{t.summaryAcciones}</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <div className="text-lg font-bold text-red-700">{vencidas.length}</div>
          <div className="text-xs text-red-600">{t.summaryVencidas}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <div className="text-lg font-bold text-amber-700">{porVencer.length}</div>
          <div className="text-xs text-amber-600">{t.summaryPorVencer}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <div className="text-lg font-bold text-slate-800">{pendientesValidar}</div>
          <div className="text-xs text-slate-500">{t.summaryValidar}</div>
        </div>
      </div>

      <div className="mt-6">
        {objetivos.map(function (o) {
          return renderObjetivo(o);
        })}
        <button type="button" onClick={addObjetivo} className="mt-2 text-sm font-medium text-blue-600 hover:underline">
          {t.addObjetivo}
        </button>
      </div>

      <p className="mt-4 text-xs text-slate-400">{t.savedNote}</p>
    </div>
  );
}
