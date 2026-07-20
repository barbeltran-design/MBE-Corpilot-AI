// Fase 4 — Entregables descargables: PDF del plan compilado y Excel de
// objetivos financieros (punto de equilibrio + proyección a 12 meses).
//
// Ambos entregables se generan enteramente en el navegador de la persona y
// se descargan directamente a su computadora (como al descargar un archivo
// de Google Drive). No se sube nada a ningun servicio en la nube: no
// requiere Firebase Storage, no tiene costo, y no necesita configuracion
// adicional.
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// PDF del plan compilado (Fase 4)
// ---------------------------------------------------------------------------

function renderTextToPdf(title: string, body: string): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 56;
  const marginTop = 64;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  let y = marginTop;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  const titleLines: string[] = pdf.splitTextToSize(title, maxWidth);
  pdf.text(titleLines, marginX, y);
  y += titleLines.length * 20 + 16;

  const rawLines = body.split('\n');
  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    const isHeading = line.startsWith('#');
    const text = isHeading ? line.replace(/^#+\s*/, '') : rawLine;

    pdf.setFont('helvetica', isHeading ? 'bold' : 'normal');
    pdf.setFontSize(isHeading ? 13 : 10.5);

    const wrapped: string[] = pdf.splitTextToSize(text.length ? text : ' ', maxWidth);
    for (const wline of wrapped) {
      if (y > pageHeight - marginTop) {
        pdf.addPage();
        y = marginTop;
      }
      pdf.text(wline, marginX, y);
      y += isHeading ? 18 : 14;
    }
    if (isHeading) y += 4;
  }

  return pdf;
}

export function downloadCompiledPlanPdf(params: {
  sessionTopic: string;
  compiledText: string;
  language: 'es' | 'en';
}): { name: string } {
  const { compiledText, language } = params;
  const title =
    language === 'en'
      ? 'Socio-Environmental Strategic Business Plan'
      : 'Plan de Negocio Estrategico Socioambiental';
  const fileName =
    language === 'en' ? 'strategic-business-plan.pdf' : 'plan-estrategico-socioambiental.pdf';

  const pdf = renderTextToPdf(title, compiledText);
  pdf.save(fileName);

  return { name: fileName };
}

// ---------------------------------------------------------------------------
// Excel de objetivos financieros: punto de equilibrio + proyeccion a N meses
// ---------------------------------------------------------------------------

function colLetter(n: number): string {
  let s = '';
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

function patchCell(ws: XLSX.WorkSheet, addr: string, patch: { f?: string; z?: string }): void {
  const cell = (ws as Record<string, any>)[addr];
  if (cell) {
    if (patch.f !== undefined) cell.f = patch.f;
    if (patch.z !== undefined) cell.z = patch.z;
  }
}

export interface FinancialGoalsChannel {
  name: string;
  monthly: number;
}

export interface FinancialGoalsFixedCost {
  name: string;
  amount: number;
}

export interface FinancialGoalsInput {
  language: 'es' | 'en';
  channels: FinancialGoalsChannel[];
  variableCostPct: number;
  fixedCosts: FinancialGoalsFixedCost[];
  adSpend: number;
  months?: number;
}

export interface FinancialGoalsResult {
  totalRevenue: number;
  fixedCostTotal: number;
  variableCostAmount: number;
  totalCost: number;
  estimatedMonthlyProfit: number;
  pctUtilidad: number;
  breakEven: number;
  breakEvenPct: number;
  growthRate: number;
}

export function computeFinancialGoals(input: {
  channels: FinancialGoalsChannel[];
  variableCostPct: number;
  fixedCosts: FinancialGoalsFixedCost[];
  adSpend: number;
}): FinancialGoalsResult {
  const { channels, variableCostPct, fixedCosts, adSpend } = input;
  const totalRevenue = channels.reduce(function (s, c) { return s + (c.monthly || 0); }, 0);
  const fixedCostTotal = fixedCosts.reduce(function (s, c) { return s + (c.amount || 0); }, 0);
  const variableCostAmount = totalRevenue * variableCostPct;
  const totalCost = variableCostAmount + fixedCostTotal + adSpend;
  const estimatedMonthlyProfit = totalRevenue - totalCost;
  const pctUtilidad = totalRevenue > 0 ? estimatedMonthlyProfit / totalRevenue : 0;
  const denominator = 1 - variableCostPct;
  const breakEven = denominator > 0 ? (fixedCostTotal + adSpend) / denominator : 0;
  const breakEvenPct = totalRevenue > 0 ? breakEven / totalRevenue : 0;
  const growthRate = (function () {
    if (!totalRevenue || totalRevenue <= 0 || adSpend <= 0) return 0;
    const pct = adSpend / totalRevenue;
    if (pct <= 0.02) return 0.01;
    if (pct <= 0.05) return 0.02;
    if (pct <= 0.1) return 0.04;
    if (pct <= 0.15) return 0.06;
    return 0.08;
  })();

  return {
    totalRevenue,
    fixedCostTotal,
    variableCostAmount,
    totalCost,
    estimatedMonthlyProfit,
    pctUtilidad,
    breakEven,
    breakEvenPct,
    growthRate,
  };
}

export function downloadFinancialGoalsExcel(input: FinancialGoalsInput): { name: string } {
  const { language, channels, variableCostPct, fixedCosts, adSpend } = input;
  const months = input.months ?? 12;

  const calc = computeFinancialGoals({ channels, variableCostPct, fixedCosts, adSpend });
  const {
    totalRevenue,
    fixedCostTotal,
    variableCostAmount,
    totalCost,
    estimatedMonthlyProfit,
    pctUtilidad,
    breakEven,
    breakEvenPct,
    growthRate,
  } = calc;

  const L =
    language === 'en'
      ? {
          sheet1: 'Targets and Break-even',
          sheet2: '12-Month Projection',
          title1: 'Monthly Targets and Break-even Point',
          concept: 'Concept',
          monthly: 'Monthly amount',
          totalIncome: 'Total Income',
          variableCostPctLabel: '% Variable Costs',
          variableCostAmountLabel: '$ Variable Costs',
          fixedCosts: 'Fixed Costs',
          fixedCostsTotal: '$ Total Fixed Costs',
          adSpendLabel: 'Monthly Advertising Investment',
          totalCostLabel: 'Total Cost',
          profitLabel: 'Estimated Profit',
          profitPctLabel: '% Profit',
          breakEvenLabel: 'BREAK-EVEN POINT ($)',
          breakEvenPctLabel: 'Break-even as % of your sales target',
          title2: '12-Month Sales Projection',
          assumptionLabel: 'Editable assumption: estimated monthly sales growth %',
          assumptionNote:
            'This % is a rough estimate based on your advertising investment; edit it if your own experience suggests a different number. Changing it recalculates the whole projection automatically.',
          tierTitle:
            'Reference table (not a guarantee): Advertising investment as % of sales -> Estimated monthly growth',
          month: 'Month',
          variableCosts: 'Variable Costs ($)',
          fixedCostsRow: 'Fixed Costs ($)',
          adSpendRow: 'Advertising Investment ($)',
          totalCostRow: 'Total Cost ($)',
          profitRow: 'Profit ($)',
          profitPctRow: '% Profit',
          accumulatedProfit: 'Accumulated Profit ($)',
        }
      : {
          sheet1: 'Metas y Punto de Equilibrio',
          sheet2: 'Proyeccion 12 Meses',
          title1: 'Metas Mensuales y Punto de Equilibrio',
          concept: 'Concepto',
          monthly: 'Monto mensual',
          totalIncome: 'Ingreso Total',
          variableCostPctLabel: '% Costos Variables',
          variableCostAmountLabel: '$ Costos Variables',
          fixedCosts: 'Costos Fijos',
          fixedCostsTotal: '$ Costos Fijos Total',
          adSpendLabel: 'Inversion en Publicidad al Mes',
          totalCostLabel: 'Costo Total',
          profitLabel: 'Utilidad Estimada',
          profitPctLabel: '% Utilidad',
          breakEvenLabel: 'PUNTO DE EQUILIBRIO ($)',
          breakEvenPctLabel: 'Punto de equilibrio como % de tu meta de ventas',
          title2: 'Proyeccion de Ventas a 12 Meses',
          assumptionLabel: 'Supuesto editable: % de crecimiento mensual estimado en ventas',
          assumptionNote:
            'Este % es un estimado de referencia segun tu inversion en publicidad; editalo si tu experiencia indica otro numero. Al cambiarlo, toda la proyeccion se recalcula automaticamente.',
          tierTitle:
            'Tabla de referencia (no es garantia): Inversion en publicidad como % de tus ventas -> Crecimiento mensual estimado',
          month: 'Mes',
          variableCosts: 'Costos Variables ($)',
          fixedCostsRow: 'Costos Fijos ($)',
          adSpendRow: 'Inversion en Publicidad ($)',
          totalCostRow: 'Costo Total ($)',
          profitRow: 'Utilidad ($)',
          profitPctRow: '% Utilidad',
          accumulatedProfit: 'Utilidad Acumulada ($)',
        };

  const wb = XLSX.utils.book_new();

  // ---- Hoja 1: Metas y Punto de Equilibrio (valores estaticos) ----
  const rows1: (string | number)[][] = [];
  function pushRow1(cells: (string | number)[]): number {
    rows1.push(cells);
    return rows1.length;
  }

  pushRow1([L.title1]);
  pushRow1([]);
  pushRow1([L.concept, L.monthly]);
  for (const ch of channels) pushRow1([ch.name, ch.monthly]);
  pushRow1([L.totalIncome, totalRevenue]);
  pushRow1([]);
  const varPctRow = pushRow1([L.variableCostPctLabel, variableCostPct]);
  pushRow1([L.variableCostAmountLabel, variableCostAmount]);
  pushRow1([]);
  pushRow1([L.fixedCosts]);
  for (const fc of fixedCosts) pushRow1([fc.name, fc.amount]);
  pushRow1([L.fixedCostsTotal, fixedCostTotal]);
  pushRow1([]);
  pushRow1([L.adSpendLabel, adSpend]);
  pushRow1([]);
  pushRow1([L.totalCostLabel, totalCost]);
  pushRow1([L.profitLabel, estimatedMonthlyProfit]);
  const profitPctRow1 = pushRow1([L.profitPctLabel, pctUtilidad]);
  pushRow1([]);
  pushRow1([L.breakEvenLabel, breakEven]);
  const breakEvenPctRow = pushRow1([L.breakEvenPctLabel, breakEvenPct]);

  const ws1 = XLSX.utils.aoa_to_sheet(rows1);
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  ws1['!cols'] = [{ wch: 40 }, { wch: 20 }];

  for (let r = 1; r <= rows1.length; r++) {
    patchCell(ws1, 'B' + String(r), { z: '#,##0.00' });
  }
  patchCell(ws1, 'B' + String(varPctRow), { z: '0.0%' });
  patchCell(ws1, 'B' + String(profitPctRow1), { z: '0.0%' });
  patchCell(ws1, 'B' + String(breakEvenPctRow), { z: '0.0%' });

  XLSX.utils.book_append_sheet(wb, ws1, L.sheet1);

  // ---- Hoja 2: Proyeccion a N meses (valores calculados + formulas vivas) ----
  const monthHeaders: string[] = [];
  for (let m = 1; m <= months; m++) monthHeaders.push(L.month + ' ' + String(m));

  const revenueVals: number[] = [];
  for (let m = 1; m <= months; m++) {
    revenueVals.push(m === 1 ? totalRevenue : revenueVals[m - 2] * (1 + growthRate));
  }
  const variableVals = revenueVals.map(function (v) { return v * variableCostPct; });
  const fixedVals = revenueVals.map(function () { return fixedCostTotal; });
  const adVals = revenueVals.map(function () { return adSpend; });
  const totalCostVals = revenueVals.map(function (_v, i) { return variableVals[i] + fixedVals[i] + adVals[i]; });
  const profitVals = revenueVals.map(function (_v, i) { return revenueVals[i] - totalCostVals[i]; });
  const profitPctVals = revenueVals.map(function (_v, i) {
    return revenueVals[i] > 0 ? profitVals[i] / revenueVals[i] : 0;
  });
  const accumVals: number[] = [];
  for (let i = 0; i < months; i++) {
    accumVals.push(i === 0 ? profitVals[0] : accumVals[i - 1] + profitVals[i]);
  }

  const rows2: (string | number)[][] = [];
  function pushRow2(cells: (string | number)[]): number {
    rows2.push(cells);
    return rows2.length;
  }

  pushRow2([L.title2]);
  pushRow2([]);
  const assumptionRow = pushRow2([L.assumptionLabel, growthRate]);
  pushRow2([L.assumptionNote]);
  pushRow2([]);
  pushRow2([L.tierTitle]);
  const tierRows =
    language === 'en'
      ? [
          '0% (no investment) -> 0%',
          'Up to 2% -> 1%',
          '2% to 5% -> 2%',
          '5% to 10% -> 4%',
          '10% to 15% -> 6%',
          'More than 15% -> 8% (cap)',
        ]
      : [
          '0% (sin inversion) -> 0%',
          'Hasta 2% -> 1%',
          '2% a 5% -> 2%',
          '5% a 10% -> 4%',
          '10% a 15% -> 6%',
          'Mas de 15% -> 8% (tope)',
        ];
  for (const t of tierRows) pushRow2([t]);
  pushRow2([]);
  pushRow2([L.concept].concat(monthHeaders));
  const revenueRow = pushRow2([L.totalIncome].concat(revenueVals));
  const variableRow = pushRow2([L.variableCosts].concat(variableVals));
  const fixedRow = pushRow2([L.fixedCostsRow].concat(fixedVals));
  const adRow = pushRow2([L.adSpendRow].concat(adVals));
  const totalCostRow2 = pushRow2([L.totalCostRow].concat(totalCostVals));
  const profitRow = pushRow2([L.profitRow].concat(profitVals));
  const profitPctRow = pushRow2([L.profitPctRow].concat(profitPctVals));
  const accumRow = pushRow2([L.accumulatedProfit].concat(accumVals));

  const ws2 = XLSX.utils.aoa_to_sheet(rows2);
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: months } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: months } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: months } },
  ];
  ws2['!cols'] = [{ wch: 32 }].concat(
    Array.from({ length: months }, function () { return { wch: 14 }; })
  );

  patchCell(ws2, 'B' + String(assumptionRow), { z: '0.0%' });

  for (let m = 1; m <= months; m++) {
    const col = m + 1;
    const letter = colLetter(col);

    if (m > 1) {
      const prevLetter = colLetter(col - 1);
      patchCell(ws2, letter + String(revenueRow), {
        f: prevLetter + String(revenueRow) + '*(1+$B$' + String(assumptionRow) + ')',
      });
    }
    patchCell(ws2, letter + String(variableRow), {
      f: letter + String(revenueRow) + '*' + String(variableCostPct),
    });
    patchCell(ws2, letter + String(totalCostRow2), {
      f: letter + String(variableRow) + '+' + letter + String(fixedRow) + '+' + letter + String(adRow),
    });
    patchCell(ws2, letter + String(profitRow), {
      f: letter + String(revenueRow) + '-' + letter + String(totalCostRow2),
    });
    patchCell(ws2, letter + String(profitPctRow), {
      f: letter + String(profitRow) + '/' + letter + String(revenueRow),
      z: '0.0%',
    });
    if (m === 1) {
      patchCell(ws2, letter + String(accumRow), { f: letter + String(profitRow) });
    } else {
      const prevLetter = colLetter(col - 1);
      patchCell(ws2, letter + String(accumRow), {
        f: prevLetter + String(accumRow) + '+' + letter + String(profitRow),
      });
    }
    [revenueRow, variableRow, fixedRow, adRow, totalCostRow2, profitRow, accumRow].forEach(function (r) {
      patchCell(ws2, letter + String(r), { z: '#,##0.00' });
    });
  }

  XLSX.utils.book_append_sheet(wb, ws2, L.sheet2);

  const fileName =
    language === 'en' ? 'financial-goals-projection.xlsx' : 'objetivos-financieros-proyeccion.xlsx';
  XLSX.writeFile(wb, fileName);

  return { name: fileName };
}
