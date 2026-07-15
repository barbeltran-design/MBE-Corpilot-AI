# Graph Report - .  (2026-07-12)

## Corpus Check
- Corpus is ~18,835 words - fits in a single context window. You may not need a graph.

## Summary
- 244 nodes · 422 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 57,863 output

## Community Hubs (Navigation)
- Maturity Assessment Engine
- Project Overview & Roadmap
- TypeScript Configuration
- Runtime Dependencies
- Auth & User Registration
- Dev Tooling & Linting
- Babel Session & Firebase Init
- UI Component Library
- i18n & Routing
- Babel Chat API
- Next.js Config
- Next.js Type Declarations
- PostCSS Config
- Tailwind Config

## God Nodes (most connected - your core abstractions)
1. `MBE AI Copilot` - 25 edges
2. `getFirebaseDb()` - 15 edges
3. `compilerOptions` - 15 edges
4. `getFirebaseAuth()` - 12 edges
5. `subscribeToPendingGoogleRedirect()` - 7 edges
6. `computeResults()` - 7 edges
7. `Language` - 7 edges
8. `react` - 6 edges
9. `DashboardPage()` - 6 edges
10. `OnboardingInner()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `BabelPage()` --references--> `react`  [EXTRACTED]
  src/app/[locale]/babel/page.tsx → package.json
- `DashboardPage()` --references--> `react`  [EXTRACTED]
  src/app/[locale]/dashboard/page.tsx → package.json
- `OnboardingInner()` --references--> `react`  [EXTRACTED]
  src/app/[locale]/onboarding/page.tsx → package.json
- `RegisterForm()` --references--> `react`  [EXTRACTED]
  src/components/landing/register-form.tsx → package.json
- `BabelPage()` --calls--> `getFirebaseAuth()`  [EXTRACTED]
  src/app/[locale]/babel/page.tsx → src/lib/firebase.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **MBE AI Copilot's Five Specialized Agents** — readme_mbe_ai_copilot, readme_babel, readme_karmetin, readme_fisnando, readme_normau, readme_atech [EXTRACTED 1.00]
- **MBE AI Copilot Project Phase Roadmap (Fase 1-6)** — readme_fase_1_fundacion, readme_fase_2_diagnostico_madurez, readme_fase_3_chat_gemini_rag, readme_fase_4_generacion_entregables, readme_fase_5_stripe_dashboard, readme_fase_6_agentes_especializados_calendar [EXTRACTED 1.00]
- **MBE AI Copilot Technology Stack** — readme_nextjs_14, readme_typescript, readme_tailwind_css, readme_firebase, readme_next_intl, readme_react_hook_form, readme_zod [EXTRACTED 1.00]

## Communities (15 total, 4 thin omitted)

### Community 0 - "Maturity Assessment Engine"
Cohesion: 0.14
Nodes (27): DashboardPage(), OnboardingInner(), getLatestAssessmentAnswers(), saveAssessment(), CONTENT, DIMENSION_IDS, DimensionId, DimensionText (+19 more)

### Community 1 - "Project Overview & Roadmap"
Cohesion: 0.08
Nodes (29): Atech (AI Agent), Babel (AI Agent), Build with Gemini XPRIZE (Hackathon), .env.example, .env.local, Fase 1 — Fundación, Fase 2 — Diagnóstico de madurez, Fase 3 — Chat con Gemini + RAG (+21 more)

### Community 2 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, ./src/*, **/*.ts (+19 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (27): class-variance-authority, clsx, firebase, @hookform/resolvers, lucide-react, next, next-intl, dependencies (+19 more)

### Community 4 - "Auth & User Registration"
Cohesion: 0.15
Nodes (24): Firestore Collections (users, companies, assessments, sessions, deliverables, phds), countries, FormValues, RegisterForm(), schema, createUserAndCompanyDocs(), defaultRegistrationInput(), mapAuthErrorToMessageKey() (+16 more)

### Community 5 - "Dev Tooling & Linting"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+17 more)

### Community 6 - "Babel Session & Firebase Init"
Cohesion: 0.19
Nodes (17): BabelPage(), BABEL_PHASE_TOPICS_EN, BABEL_PHASE_TOPICS_ES, babelApprovalMarker(), babelPhaseTopics(), approveBabelPhase(), babelSessionId(), compileApprovedPhases() (+9 more)

### Community 7 - "UI Component Library"
Cohesion: 0.17
Nodes (10): Button, ButtonProps, buttonVariants, Card, Input, InputProps, Label, Select (+2 more)

### Community 8 - "i18n & Routing"
Cohesion: 0.26
Nodes (7): metadata, LanguageSwitcher(), Locale, localeFlags, localeNames, locales, config

### Community 9 - "Babel Chat API"
Cohesion: 0.29
Nodes (6): BabelRequestBody, buildSystemPrompt(), IncomingMessage, POST(), PROMPTS_EN, PROMPTS_ES

## Knowledge Gaps
- **90 isolated node(s):** `withNextIntl`, `nextConfig`, `name`, `version`, `private` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Dev Tooling & Linting`?**
  _High betweenness centrality (0.278) - this node is a cross-community bridge._
- **Why does `react` connect `Runtime Dependencies` to `Maturity Assessment Engine`, `Auth & User Registration`, `Babel Session & Firebase Init`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Why does `MBE AI Copilot` connect `Project Overview & Roadmap` to `Maturity Assessment Engine`, `Auth & User Registration`, `UI Component Library`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `withNextIntl`, `nextConfig`, `name` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Maturity Assessment Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `Project Overview & Roadmap` be split into smaller, more focused modules?**
  _Cohesion score 0.07661290322580645 - nodes in this community are weakly interconnected._
- **Should `TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._