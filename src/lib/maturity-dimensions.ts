// Transcrito literalmente de la hoja "Diagnóstico Inicial" del archivo
// "Evaluación de Madurez Final" (español) y traducido profesionalmente al
// inglés (requerido por las bases del hackatón Build with Gemini XPRIZE).
// Cada tema tiene 6 preguntas (una por nivel de madurez), con su descripción
// (qué hace la empresa en ese nivel) y el entregable esperado como evidencia.
// Los 11 IDs coinciden con las llaves de AssessmentDoc.dimensions en
// src/types/firestore.ts.
//
// getMaturityDimensions(locale) es la única forma de leer este contenido —
// devuelve la lista de 11 temas ya en el idioma pedido. Las etiquetas de
// nivel (Ejecución/Execution, etc.) NO viven aquí: se toman de
// common.maturityLevel en messages/{es,en}.json vía next-intl, para no
// duplicar esas traducciones en dos lugares.
import type { Language, MaturityLevel } from '@/types/firestore';

export type DimensionId =
  | 'strategic'
  | 'finance'
  | 'hr'
  | 'sales'
  | 'operations'
  | 'esg'
  | 'compliance'
  | 'knowledge'
  | 'alliances'
  | 'customerService'
  | 'culture';

export const DIMENSION_IDS: DimensionId[] = [
  'strategic',
  'finance',
  'hr',
  'sales',
  'operations',
  'esg',
  'compliance',
  'knowledge',
  'alliances',
  'customerService',
  'culture',
];

export interface MaturityLevelDef {
  key: MaturityLevel;
  maxPoints: number;
  description: string;
  deliverable: string;
}

export interface MaturityDimensionDef {
  id: DimensionId;
  tema: string;
  explicacion: string;
  levels: MaturityLevelDef[];
}

const LEVEL_META: { key: MaturityLevel; maxPoints: number }[] = [
  { key: 'execution', maxPoints: 10 },
  { key: 'standard', maxPoints: 20 },
  { key: 'control', maxPoints: 20 },
  { key: 'optimization', maxPoints: 20 },
  { key: 'excellence', maxPoints: 20 },
  { key: 'influencer', maxPoints: 30 },
];

interface DimensionText {
  tema: string;
  explicacion: string;
  levels: [string, string][]; // [description, deliverable] x 6, in LEVEL_META order
}

const CONTENT: Record<Language, Record<DimensionId, DimensionText>> = {
  es: {
    strategic: {
      tema: 'Rumbo Estratégico',
      explicacion: 'Hacia dónde vamos',
      levels: [
        ['Trabajar resolviendo los pendientes del día a día según vayan saliendo', 'Lista de pendientes o notas con las tareas del mes anotadas'],
        ['Dejar por escrito qué hace el negocio, a quién le vende y cuál es su meta ideal', 'Guía escrita con la Misión, Visión y Valores de la empresa'],
        ['Tomar decisiones reuniéndose formalmente a revisar los números del negocio', 'Minutas de Consejo y Tablero de Control'],
        ['Cambiar los planes rápido si los clientes, la competencia o el país cambian', 'Plan de juego por escrito con las metas de los próximos meses que indique hacia dónde vas y cómo lo vas a lograr'],
        ['Gobernanza sólida con consejeros externos y visión global.', 'Reporte escrito con las recomendaciones hechas por tus asesores externos'],
        ['Tu empresa es el ejemplo que todos siguen y cambia las reglas de tu sector', 'Reglas o manuales creados por ti que otras empresas de la industria copian'],
      ],
    },
    finance: {
      tema: 'Finanzas',
      explicacion: 'Manejo del Dinero',
      levels: [
        ['Llevar las cuentas anotando lo que entra y sale en un archivo', 'Registro de la lista de entradas y salidas de dinero'],
        ['Separar el dinero del dueño del dinero del negocio y hacer un presupuesto de gastos', 'Lista por escrito de los gastos fijos mensuales que el negocio tiene permitido hacer'],
        ['Conocer con exactitud la ganancia que te deja cada producto vendido y quien te debe', 'Calculadora automática donde pones tus costos y te da el precio correcto y reporte de cartera vencida'],
        ['Saber la ganancia de cada proyecto o cliente vendido para tomar decisiones de ajustes oportunamente en caso de cambio de costos en el mercado', 'Evaluación financiera por cliente o proyecto tomando en cuenta costos relacionados, precios de mercado e infraestructura utilizada'],
        ['Hacer cálculos para predecir cuánto dinero y ganancias tendrá el negocio en 3 años diversificando los productos y servicios', 'Simulación financiera a futuro del dinero que entrará y saldrá de la empresa'],
        ['Tener tanto dinero guardado que puedes comprar otros negocios o invertir en fondos grandes', 'Portafolio de Inversión Corporativa'],
      ],
    },
    hr: {
      tema: 'Capital Humano',
      explicacion: 'Personal y Contratación',
      levels: [
        ['Contratar conocidos o familiares porque confío en ellos', 'Directorio básico con los nombres y teléfonos del personal actual'],
        ['Tener un esquema del equipo (quién manda a quién) y una lista de las tareas de cada puesto', 'Organigrama y Perfiles de Puesto.'],
        ['Medición de la productividad individual y clima laboral.', 'Evaluación de rendimiento individuales firmadas por el empleado y el jefe y Encuesta de Clima.'],
        ['Planes de carrera y capacitación basados en brechas de competencias', 'Plan de carrera y capacitación por persona'],
        ['Atracción de talento de alto nivel con compensación emocional y variable', 'Tabla de comisiones o bonos económicos amarrados a las metas de la empresa'],
        ['Tu empresa es una escuela de líderes; la gente más talentosa te busca para trabajar gratis contigo. El liderazgo alinea la operación con la estrategia, desarrollando a su gente con base en sus brechas competitivas', 'Lista de espera de candidatos con perfiles muy altos buscando entrar a tu negocio'],
      ],
    },
    sales: {
      tema: 'Ventas y Marketing',
      explicacion: 'Motor Comercial y Mercado',
      levels: [
        ['Las ventas llegan mayormente por recomendaciones de boca en boca', 'Lista de nombres de las personas que te han recomendado clientes'],
        ['Material de ventas profesional y canales de captación', 'Kit de Ventas, Lista de precios al público y el "guión de ventas" que usa todo tu equipo'],
        ['Trazabilidad del proceso de venta desde el contacto inicial', 'Registro de personas interesadas'],
        ['Manejo de objeciones y optimización de tasas de conversión', 'Registro de cuánto dinero gastas en anuncios contra cuántos clientes reales te compraron'],
        ['Automatización total de la captación y personalización masiva', 'Digitalización de la venta hasta la facturación y cobranza al cliente'],
        ['Tu negocio inventa una nueva forma de vender que cambia por completo el mercado de tu giro', 'Modelo de ventas exclusivo y registrado propiedad de tu empresa'],
      ],
    },
    operations: {
      tema: 'Operación y Entrega',
      explicacion: 'Entregar producto o servicio',
      levels: [
        ['Entrega de producto/servicio con diferente calidad y tiempos', 'Bitácora en cuaderno o pizarrón con los pedidos anotados del día'],
        ['Procesos escritos para que cualquier persona pueda operar', 'Manual paso a paso de cómo fabricar el producto o cómo atender al cliente'],
        ['Medir tiempos de entrega y rechazos', 'Gráfica mensual que muestra tus tiempos de entrega de pedidos y errores o retrabajos'],
        ['Prevención de errores antes de que lleguen al cliente', 'Plan de Mejora Continua y Mantenimiento'],
        ['Integración digital con el cliente y proveedores', 'Plataforma de Autogestión para Clientes y proveedores'],
        ['Tu forma de trabajar es tan limpia que no genera basura y es la más rápida del mercado', 'Certificado oficial de "Desperdicio Cero" o de velocidad operativa'],
      ],
    },
    esg: {
      tema: 'Responsabilidad Socio Ambiental Congruente',
      explicacion: 'Sostenibilidad Estratégica',
      levels: [
        ['Cumplimiento legal mínimo por temor a multas o clausuras', 'Bitácora de desecho de residuos obligatorios y recibos de donativos aislados.'],
        ['Declaración formal del compromiso ético de la empresa. Definición de lineamientos de conducta para empleados y proveedores.', 'Código de Ética Comercial y Política de No Discriminación firmada por el personal'],
        ['Medición del consumo de recursos clave (agua, luz, insumos) y de las condiciones de salud y seguridad del equipo.', 'Tablero de Eco-eficiencia (Consumo/Mermas) y Reporte de incidencias del personal'],
        ['Implementación de economía circular (reuso de mermas). Programas permanentes de apoyo o desarrollo para la comunidad local o proveedores clave.', 'Plan de Gestión Ambiental de Procesos y Distintivo ESR (Empresa Socialmente Responsable) o equivalente.'],
        ['La sostenibilidad está integrada en el diseño del producto o servicio. Cero residuos críticos. Transparencia total en gobierno corporativo.', 'Reporte de Sostenibilidad bajo estándar internacional auditado externamente.'],
        ['La empresa transforma su industria. Desarrolla activamente a sus proveedores más pequeños para que también sean sostenibles. Genera impacto social neto positivo.', 'Medición del Retorno de Inversión Social de cada programa sociambiental cuantificado en dinero'],
      ],
    },
    compliance: {
      tema: 'Cumplimiento Normativo',
      explicacion: 'Blindaje Legal y Fiscal',
      levels: [
        ['Estar registrado ante el gobierno (SAT) solo para poder facturar', 'Constancia de Situación Fiscal (RFC) activa y con datos correctos'],
        ['Crear una empresa oficial ante notario y usar contratos escritos con el personal y clientes. Identificación de qué NOMs federales le aplican al local u operación.', 'Acta Constitutiva, Contrato marco y Carpeta de Diagnóstico Inicial de NOMs (ej. NOM-035, NOM-019).'],
        ['Blindaje de activos intangibles (marcas). Revisión y mejora de contratos con cláusulas de penalización y confidencialidad personalizadas.', 'Título de Registro de Marca ante el IMPI, Contratos de Confidencialidad (NDA) firmados y Matriz de Riesgos Legales y Fiscales.'],
        ['Monitoreo mensual de la situación fiscal y legal. Auditorías laborales y fiscales preventivas. Actualización de libros corporativos. Las comisiones internas exigidas por la ley laboral están activas y sesionando.', 'Opinión de Cumplimiento SAT en "Positiva" (32D), Libro de Actas de Asamblea Anual al día y Actas de la Comisión de Seguridad e Higiene (NOM-019/NOM-030).'],
        ['Estructura de Cumplimiento corporativo fiscal, legal y normativo. Auditorías externas sin observaciones.', 'Manual de Cumplimiento Legal Corporativo, Dictamen Fiscal de Auditor Externo y Certificado de Cumplimiento total de NOMs aplicables'],
        ['La empresa se vuelve el referente regulatorio. Participa en cámaras para redactar o modificar las NOMs de su sector. Exige cumplimiento estricto a sus proveedores para dejarlos operar.', 'Código de Cumplimiento Regulatorio para Proveedores y constancia de participación en Comités Técnicos de Normalización de la Secretaría de Economía.'],
      ],
    },
    knowledge: {
      tema: 'Conocimiento',
      explicacion: 'Toma de decisiones con inteligencia de negocio',
      levels: [
        ['Decisiones basadas en la experiencia del director y/o dueño', 'Solicitudes de cambios o acciones registrados en correos o chats'],
        ['Registro mensual de la historia del negocio. Se definen plantillas para capturar ventas, costos y datos de clientes', 'Base de Datos maestra unificada por mes con campos estandarizados.'],
        ['El negocio cuenta con reportes que se actualizan periódicamente para evaluar la salud financiera, operativa y comercial de forma visual.', 'Tablero de Control con gráficas y datos clave del negocio'],
        ['Se cruza información de varias fuentes para entender la causa raíz de los problemas (P.ej. por qué caen las ventas, qué producto tiene menor margen, qué vendedor es más eficiente).', 'Modelo de Análisis de Variaciones y Correlaciones de Rentabilidad por Cliente, Producto y Canal.'],
        ['Se hacen análisis que permiten predecir qué decisiones tomar con respecto a mis clientes, productos y servicios, personal, materiales, proveedores e infraestructura', 'Reportes predictivos que alertan para modificar acciones de forma oportuna en la parte administrativa, comercial y operativa'],
        ['La empresa utiliza Inteligencia Artificial para su toma de decisiones y vende reportes de tendencias agregadas o influye en su sector con sus analíticos de mercado', 'Plataforma de Inteligencia de Mercado y/o Sistema Autónomo de Decisiones Operativas.'],
      ],
    },
    alliances: {
      tema: 'Alianzas comerciales',
      explicacion: 'Estrategia de Ecosistemas',
      levels: [
        ['De repente el dueño asiste a una reunión de negocios de una cámara o grupo', 'Directorio informal de contactos de la industria o folletos de cámaras sectoriales.'],
        ['La empresa está afiliada legalmente a la cámara o asociación de su rubro. Tiene identificados formalmente a sus competidores directos y a los posibles complementadores de su servicio.', 'Mapeo de Cámaras, Competidores y Complementadores y Comprobante de Afiliación Vigente a una cámara'],
        ['Alianzas comerciales activas. Existen acuerdos formales con "complementadores" (negocios que venden algo diferente al mismo cliente, ej: una constructora aliada con una inmobiliaria) y se mide cuántos clientes se envían mutuamente.', 'Convenio de Alianza Comercial firmado y Reporte Mensual de Clientes Referidos'],
        ['La empresa se integra a un clúster formal (grupo de empresas de la misma región y sector) para optimizar esfuerzos. Lanza paquetes unificados de productos/servicios con sus complementadores.', 'Oferta de Solución Conjunta y Minutas de Participación en Comités del Clúster.'],
        ['"Coopetición" y Sinergias de Costos. Alianzas de alto nivel incluso con competidores directos para generar economías de escala', 'Acuerdo de Compras Consolidadas Inter-Empresas o Convenio de Compartición de Infraestructura Logística'],
        ['La empresa se convierte en la empresa que conecta a otras empresas dentro de la industria. Funda el clúster regional, preside la cámara de su rubro o crea la plataforma tecnológica que los competidores y complementadores están obligados a usar.', 'Acta Constitutiva de la Asociación/Clúster liderado por la empresa o Manual de Integración a la Plataforma Propietaria.'],
      ],
    },
    customerService: {
      tema: 'Atención al Cliente',
      explicacion: 'Satisfacción del cliente',
      levels: [
        ['Se resuelven los problemas de los clientes cuando hay quejas', 'Registro informal de los reclamos recibidos'],
        ['Dar un teléfono o correo oficial para quejas y una guía de amabilidad para el personal', 'Manual con los pasos para calmar y atender a un cliente enojado'],
        ['Calificar si el cliente terminó feliz o triste usando encuestas rápidas después de comprar', 'Reporte mensual con las calificaciones de tus clientes'],
        ['Estudiar las quejas que más se repiten para cambiar el producto y que no vuelva a fallar', 'Lista de cambios hechos a tu servicio basados en lo que no le gustó a los clientes'],
        ['Predicción de la satisfacción del cliente basado en los eventos e interacciones con la empresa', 'Monitoreo automatizado de la satisfacción del cliente y disparo de acciones con base en ellas'],
        ['La empresa define el estándar de éxito del mercado. Sus resultados son la meta que la competencia intenta alcanzar e imitar.', 'Reporte Público de Liderazgo Industrial y Auditoría'],
      ],
    },
    culture: {
      tema: 'Cultura Organizacional',
      explicacion: 'El ambiente dentro del negocio',
      levels: [
        ['El ambiente laboral es definido por la misma gente que labora en la empresa', 'Registro de quejas del personal'],
        ['Reglamento de la oficina con las conductas prohibidas y los valores del negocio', 'Reglamento de Trabajo firmado por todos y manifiesto con los valores de la empresa'],
        ['Medir si el equipo trabaja muy estresado y si están alineados a los valores de la empresa', 'Encuesta Anual de Clima Laboral y Buzón de Transparencia (Denuncia Anónima).'],
        ['Se implementa la retroalimentación constante. Los líderes de área corrigen desviaciones culturales y fomentan la colaboración entre departamentos de forma activa', 'Plan de Rituales Corporativos (Juntas semanales de alineación) y Evaluaciones 360°.'],
        ['La cultura es el principal filtro de contratación. El equipo es auto-gestionado y se premia el mérito y el cumplimiento de metas alineadas a los valores', 'Manual de Cultura y Matriz de Talento (Desempeño vs. Valores).'],
        ['La cultura trasciende la empresa. Los exempleados se vuelven embajadores de la marca en el mercado. El modelo cultural es referente en foros de negocios y atrae talento internacional orgánicamente.', 'Publicación del Código de Cultura Abierto e Índice de Recomendación de Empleados (eNPS) superior al 80%.'],
      ],
    },
  },
  en: {
    strategic: {
      tema: 'Strategic Direction',
      explicacion: 'Where we are headed',
      levels: [
        ['Working by handling day-to-day pending items as they come up', 'To-do list or notes with the month’s tasks written down'],
        ['Writing down what the business does, who it sells to, and what its ideal goal is', 'Written guide with the company’s Mission, Vision, and Values'],
        ['Making decisions by formally meeting to review the business numbers', 'Board minutes and a Control Dashboard'],
        ['Changing plans quickly if customers, competitors, or the country change', 'Written game plan with the goals for the coming months, showing where you are headed and how you will get there'],
        ['Solid governance with external board members and a global outlook.', 'Written report with recommendations made by your external advisors'],
        ['Your company is the example everyone follows and it changes the rules of your industry', 'Rules or manuals you created that other companies in the industry copy'],
      ],
    },
    finance: {
      tema: 'Finance',
      explicacion: 'Managing the Money',
      levels: [
        ['Keeping accounts by writing down what comes in and goes out in a file', 'Log of money coming in and going out'],
        ['Separating the owner’s money from the business’s money and setting an expense budget', 'Written list of the fixed monthly expenses the business is allowed to make'],
        ['Knowing exactly the profit each product sold leaves you and who owes you', 'Automatic calculator where you enter your costs and it gives you the right price, plus an overdue accounts report'],
        ['Knowing the profit from each project or client sold to make timely adjustment decisions in case of market cost changes', 'Financial evaluation per client or project, factoring in related costs, market prices, and infrastructure used'],
        ['Running calculations to predict how much money and profit the business will have in 3 years while diversifying products and services', 'Future financial simulation of the money that will flow in and out of the company'],
        ['Having so much money saved that you can buy other businesses or invest in large funds', 'Corporate Investment Portfolio'],
      ],
    },
    hr: {
      tema: 'Human Capital',
      explicacion: 'Staff and Hiring',
      levels: [
        ['Hiring acquaintances or family members because you trust them', 'Basic directory with the names and phone numbers of current staff'],
        ['Having a team chart (who reports to whom) and a list of duties for each position', 'Org chart and Job Profiles.'],
        ['Measuring individual productivity and workplace climate.', 'Individual performance reviews signed by the employee and manager, and a Climate Survey.'],
        ['Career and training plans based on skill gaps', 'Career and training plan per person'],
        ['Attracting high-level talent with emotional and variable compensation', 'Commission or bonus table tied to the company’s goals'],
        ['Your company is a school for leaders; the most talented people seek you out to work for free with you. Leadership aligns operations with strategy, developing its people based on their competitive gaps', 'Waitlist of high-caliber candidates trying to join your business'],
      ],
    },
    sales: {
      tema: 'Sales and Marketing',
      explicacion: 'Commercial Engine and Market',
      levels: [
        ['Sales come mostly from word-of-mouth referrals', 'List of names of people who have referred you customers'],
        ['Professional sales materials and acquisition channels', 'Sales Kit, public price list, and the "sales script" your whole team uses'],
        ['Traceability of the sales process from initial contact', 'Log of interested prospects'],
        ['Objection handling and conversion rate optimization', 'Record of how much money you spend on ads versus how many real customers actually bought'],
        ['Full automation of lead capture and mass personalization', 'Digitization of the sale through to invoicing and collections'],
        ['Your business invents a new way of selling that completely changes your industry’s market', 'Exclusive sales model registered as your company’s property'],
      ],
    },
    operations: {
      tema: 'Operations and Delivery',
      explicacion: 'Delivering the product or service',
      levels: [
        ['Delivering the product/service with inconsistent quality and timing', 'Notebook or whiteboard log with the day’s orders written down'],
        ['Written processes so anyone can operate', 'Step-by-step manual for how to make the product or how to serve the customer'],
        ['Measuring delivery times and rejections', 'Monthly chart showing your order delivery times and errors or rework'],
        ['Preventing errors before they reach the customer', 'Continuous Improvement and Maintenance Plan'],
        ['Digital integration with the customer and suppliers', 'Self-service Platform for customers and suppliers'],
        ['Your way of working is so clean it generates no waste and is the fastest in the market', 'Official "Zero Waste" certificate or operational speed certification'],
      ],
    },
    esg: {
      tema: 'Consistent Social and Environmental Responsibility',
      explicacion: 'Strategic Sustainability',
      levels: [
        ['Minimum legal compliance out of fear of fines or shutdowns', 'Log of mandatory waste disposal and receipts from occasional donations.'],
        ['Formal declaration of the company’s ethical commitment. Definition of conduct guidelines for employees and suppliers.', 'Business Code of Ethics and Non-Discrimination Policy signed by staff'],
        ['Measuring consumption of key resources (water, electricity, supplies) and the team’s health and safety conditions.', 'Eco-efficiency Dashboard (Consumption/Waste) and staff incident report'],
        ['Implementing circular economy practices (reusing waste). Ongoing support or development programs for the local community or key suppliers.', 'Environmental Process Management Plan and ESR (Socially Responsible Company) seal or equivalent.'],
        ['Sustainability is built into the design of the product or service. Zero critical waste. Full transparency in corporate governance.', 'Sustainability Report under an internationally audited standard.'],
        ['The company transforms its industry. It actively develops its smaller suppliers so they can also become sustainable. It generates a net positive social impact.', 'Social Return on Investment measurement for each socio-environmental program, quantified in monetary terms'],
      ],
    },
    compliance: {
      tema: 'Regulatory Compliance',
      explicacion: 'Legal and Tax Shielding',
      levels: [
        ['Being registered with the tax authority only to be able to invoice', 'Active Tax Status Certificate with correct data'],
        ['Setting up an official company before a notary and using written contracts with staff and customers. Identifying which federal safety standards apply to the site or operation.', 'Articles of Incorporation, a framework contract, and an Initial Compliance Diagnostic folder for applicable safety standards'],
        ['Shielding intangible assets (trademarks). Reviewing and improving contracts with customized penalty and confidentiality clauses.', 'Trademark Registration Certificate, signed Non-Disclosure Agreements (NDAs), and a Legal and Tax Risk Matrix.'],
        ['Monthly monitoring of tax and legal status. Preventive labor and tax audits. Updating corporate books. Internal committees required by labor law are active and meeting.', 'Positive Tax Compliance Opinion, an up-to-date Annual Shareholders’ Meeting Minutes Book, and Health and Safety Committee minutes.'],
        ['Corporate tax, legal, and regulatory compliance structure. External audits with no findings.', 'Corporate Legal Compliance Manual, an External Auditor’s Tax Opinion, and a full Compliance Certificate for applicable standards'],
        ['The company becomes the regulatory benchmark. It participates in trade associations to draft or amend industry standards. It requires strict compliance from its suppliers to let them operate.', 'Regulatory Compliance Code for Suppliers and proof of participation in Technical Standardization Committees.'],
      ],
    },
    knowledge: {
      tema: 'Knowledge',
      explicacion: 'Decision-making with business intelligence',
      levels: [
        ['Decisions based on the director’s and/or owner’s experience', 'Change or action requests logged in emails or chats'],
        ['Monthly log of the business’s history. Templates defined to capture sales, costs, and customer data', 'Unified master database by month with standardized fields.'],
        ['The business has reports updated periodically to visually assess financial, operational, and commercial health.', 'Control Dashboard with charts and key business data'],
        ['Cross-referencing information from several sources to understand the root cause of problems (e.g. why sales are dropping, which product has the lowest margin, which salesperson is most efficient).', 'Variance and Correlation Analysis Model for Profitability by Customer, Product, and Channel.'],
        ['Running analyses that predict which decisions to make regarding customers, products and services, staff, materials, suppliers, and infrastructure', 'Predictive reports that flag timely actions across administrative, commercial, and operational areas'],
        ['The company uses Artificial Intelligence for its decision-making and sells aggregated trend reports or influences its industry with its market analytics', 'Market Intelligence Platform and/or Autonomous Operational Decision System.'],
      ],
    },
    alliances: {
      tema: 'Business Alliances',
      explicacion: 'Ecosystem Strategy',
      levels: [
        ['The owner occasionally attends a business meeting of a chamber or group', 'Informal directory of industry contacts or sector chamber brochures.'],
        ['The company is legally affiliated with its sector’s chamber or association. It has formally identified its direct competitors and possible complementors for its service.', 'Mapping of Chambers, Competitors, and Complementors, and current proof of chamber membership'],
        ['Active business alliances. Formal agreements exist with "complementors" (businesses that sell something different to the same customer, e.g. a construction company partnered with a real estate agency), and mutual customer referrals are measured.', 'Signed Business Alliance Agreement and Monthly Referred Customers Report'],
        ['The company joins a formal cluster (group of companies in the same region and sector) to optimize efforts. It launches joint product/service packages with its complementors.', 'Joint Solution Offer and Cluster Committee Participation Minutes.'],
        ['"Co-opetition" and cost synergies. High-level alliances even with direct competitors to generate economies of scale', 'Inter-Company Consolidated Purchasing Agreement or Logistics Infrastructure Sharing Agreement'],
        ['The company becomes the one that connects other companies within the industry. It founds the regional cluster, chairs its sector’s chamber, or creates the technology platform that competitors and complementors are required to use.', 'Articles of Incorporation of the Association/Cluster led by the company, or Proprietary Platform Onboarding Manual.'],
      ],
    },
    customerService: {
      tema: 'Customer Service',
      explicacion: 'Customer satisfaction',
      levels: [
        ['Customer problems are resolved when complaints come in', 'Informal log of complaints received'],
        ['Providing an official phone number or email for complaints and a courtesy guide for staff', 'Manual with steps to calm down and assist an upset customer'],
        ['Rating whether the customer ended up happy or unhappy using quick surveys after a purchase', 'Monthly report with your customers’ ratings'],
        ['Studying the most recurring complaints to change the product so the issue does not happen again', 'List of changes made to your service based on what customers disliked'],
        ['Predicting customer satisfaction based on events and interactions with the company', 'Automated customer satisfaction monitoring that triggers actions based on it'],
        ['The company defines the market’s standard of success. Its results are the target competitors try to reach and imitate.', 'Public Industry Leadership Report and Audit'],
      ],
    },
    culture: {
      tema: 'Organizational Culture',
      explicacion: 'The environment within the business',
      levels: [
        ['The workplace atmosphere is defined by the same people who work at the company', 'Log of staff complaints'],
        ['Office policy with prohibited conduct and the business’s values', 'Signed Workplace Regulations and a statement with the company’s values'],
        ['Measuring whether the team is working under heavy stress and whether they are aligned with the company’s values', 'Annual Workplace Climate Survey and a Transparency (Anonymous Reporting) Box.'],
        ['Constant feedback is implemented. Area leaders correct cultural deviations and actively foster collaboration between departments', 'Corporate Ritual Plan (weekly alignment meetings) and 360-degree Evaluations.'],
        ['Culture is the main hiring filter. The team is self-managed and merit and goal achievement aligned with values are rewarded', 'Culture Manual and Talent Matrix (Performance vs. Values).'],
        ['Culture transcends the company. Former employees become brand ambassadors in the market. The cultural model is a benchmark at business forums and organically attracts international talent.', 'Publication of the Open Culture Code and an Employee Net Promoter Score (eNPS) above 80%.'],
      ],
    },
  },
};

export function getMaturityDimensions(locale: Language): MaturityDimensionDef[] {
  const content = CONTENT[locale] ?? CONTENT.es;
  return DIMENSION_IDS.map((id) => {
    const text = content[id];
    return {
      id,
      tema: text.tema,
      explicacion: text.explicacion,
      levels: LEVEL_META.map((meta, i) => ({
        key: meta.key,
        maxPoints: meta.maxPoints,
        description: text.levels[i][0],
        deliverable: text.levels[i][1],
      })),
    };
  });
}
