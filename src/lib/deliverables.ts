import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// ==========================================================================
// PDF DEL PLAN COMPILADO
// ==========================================================================

function renderTextToPdf(title: string, body: string): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 48;
  const marginTop = 56;
  const marginBottom = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginX * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, marginX, marginTop);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(body, usableWidth);
  let cursorY = marginTop + 28;
  const lineHeight = 15;

  for (const line of lines) {
    if (cursorY > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
    doc.text(line, marginX, cursorY);
    cursorY += lineHeight;
  }

  return doc;
}

export interface DownloadCompiledPlanParams {
  sessionTopic: string;
  compiledText: string;
  language: 'es' | 'en';
}

export function downloadCompiledPlanPdf(params: DownloadCompiledPlanParams): void {
  const title =
    params.language === 'en'
      ? 'Business Plan: ' + params.sessionTopic
      : 'Plan de Negocio: ' + params.sessionTopic;

  const doc = renderTextToPdf(title, params.compiledText);
  const fileName =
    params.language === 'en' ? 'business-plan.pdf' : 'plan-de-negocio.pdf';
  doc.save(fileName);
}

// ==========================================================================
// HELPERS COMPARTIDOS PARA EXCEL (SheetJS)
// ==========================================================================

type Row = (string | number)[];

function row(...items: Row): Row {
  return items;
}

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

function patchCell(ws: any, addr: string, patch: { f?: string; z?: string }): void {
  if (!ws[addr]) {
    ws[addr] = { t: 'n', v: 0 };
  }
  if (patch.f !== undefined) {
    ws[addr].f = patch.f;
  }
  if (patch.z !== undefined) {
    ws[addr].z = patch.z;
  }
}

// ==========================================================================
// OBJETIVOS FINANCIEROS: TABLA DE CRECIMIENTO SEGUN % DE MERCADOTECNIA
// ==========================================================================

const GROWTH_TIERS: { max: number; rate: number }[] = [
  { max: 0, rate: 0 },
  { max: 0.02, rate: 0.01 },
  { max: 0.05, rate: 0.02 },
  { max: 0.10, rate: 0.04 },
  { max: 0.15, rate: 0.06 },
  { max: Infinity, rate: 0.08 },
];

function growthRateForPct(pct: number): number {
  for (const tier of GROWTH_TIERS) {
    if (pct <= tier.max) return tier.rate;
  }
  return 0.08;
}

// ==========================================================================
// OBJETIVOS FINANCIEROS: TIPOS
// ==========================================================================

export interface FinancialGoalsFixedItem {
  name: string;
  amount: number;
}

export interface FinancialGoalsVarItem {
  name: string;
  pct: number;
}

export interface FinancialGoalsChannel {
  name: string;
  pct: number;
}

export interface FinancialGoalsInput {
  language: 'es' | 'en';
  unitPrice: number;
  materialsPct: number;
  laborPct: number;
  otherVarPct: number;
  fixedItems: FinancialGoalsFixedItem[];
  fixedTotalFallback: number;
  varItems: FinancialGoalsVarItem[];
  desiredProfit: number;
  channels: FinancialGoalsChannel[];
  marketingPct: number;
}

export interface FinancialGoalsResult {
  totalVariablePct: number;
  fixedTotal: number;
  breakEven: number;
  targetRevenue: number;
  totalVariablePctWithMarketing: number;
  breakEvenWithMarketing: number;
  targetRevenueWithMarketing: number;
  requiredGrowthRate: number;
  expectedGrowthRate: number;
  isSufficient: boolean;
  recommendedMarketingPct: number | null;
  recommendedMarketingAmount: number | null;
}

// ==========================================================================
// OBJETIVOS FINANCIEROS: CALCULO
// ==========================================================================

export function computeFinancialGoals(input: FinancialGoalsInput): FinancialGoalsResult {
  const varItemsPct = input.varItems.reduce(function (s, v) {
    return s + (v.pct || 0);
  }, 0);
  const totalVariablePct = input.materialsPct + input.laborPct + input.otherVarPct + varItemsPct;

  const fixedTotal =
    input.fixedItems.length > 0
      ? input.fixedItems.reduce(function (s, f) {
          return s + (f.amount || 0);
        }, 0)
      : input.fixedTotalFallback;

  const denomBase = 1 - totalVariablePct;
  const breakEven = denomBase > 0 ? fixedTotal / denomBase : 0;
  const targetRevenue = denomBase > 0 ? (fixedTotal + input.desiredProfit) / denomBase : 0;

  const totalVariablePctWithMarketing = totalVariablePct + input.marketingPct;
  const denomMkt = 1 - totalVariablePctWithMarketing;
  const breakEvenWithMarketing = denomMkt > 0 ? fixedTotal / denomMkt : 0;
  const targetRevenueWithMarketing = denomMkt > 0 ? (fixedTotal + input.desiredProfit) / denomMkt : 0;

  let requiredGrowthRate = 0;
  if (breakEvenWithMarketing > 0 && targetRevenueWithMarketing > breakEvenWithMarketing) {
    requiredGrowthRate = Math.pow(targetRevenueWithMarketing / breakEvenWithMarketing, 1 / 11) - 1;
  }

  const expectedGrowthRate = growthRateForPct(input.marketingPct);
  const isSufficient = expectedGrowthRate >= requiredGrowthRate;

  let recommendedMarketingPct: number | null = null;
  let recommendedMarketingAmount: number | null = null;

  if (!isSufficient) {
    const candidates = [0.02, 0.05, 0.10, 0.15, 0.20];
    let found = false;
    for (const candidatePct of candidates) {
      const candTotalVarPct = totalVariablePct + candidatePct;
      const candDenom = 1 - candTotalVarPct;
      if (candDenom <= 0) continue;
      const candBreakEven = fixedTotal / candDenom;
      const candTarget = (fixedTotal + input.desiredProfit) / candDenom;
      const candRequiredRate =
        candBreakEven > 0 && candTarget > candBreakEven
          ? Math.pow(candTarget / candBreakEven, 1 / 11) - 1
          : 0;
      const candExpectedRate = growthRateForPct(candidatePct);
      if (candExpectedRate >= candRequiredRate) {
        recommendedMarketingPct = candidatePct;
        recommendedMarketingAmount = candBreakEven * candidatePct;
        found = true;
        break;
      }
    }
    if (!found) {
      recommendedMarketingPct = null;
      recommendedMarketingAmount = null;
    }
  }

  return {
    totalVariablePct: totalVariablePct,
    fixedTotal: fixedTotal,
    breakEven: breakEven,
    targetRevenue: targetRevenue,
    totalVariablePctWithMarketing: totalVariablePctWithMarketing,
    breakEvenWithMarketing: breakEvenWithMarketing,
    targetRevenueWithMarketing: targetRevenueWithMarketing,
    requiredGrowthRate: requiredGrowthRate,
    expectedGrowthRate: expectedGrowthRate,
    isSufficient: isSufficient,
    recommendedMarketingPct: recommendedMarketingPct,
    recommendedMarketingAmount: recommendedMarketingAmount,
  };
}

// ==========================================================================
// OBJETIVOS FINANCIEROS: EXCEL DE 2 PESTAÑAS
// ==========================================================================

export function downloadFinancialGoalsExcel(input: FinancialGoalsInput): void {
  const lang = input.language;
  const result = computeFinancialGoals(input);

  const L =
    lang === 'en'
      ? {
          sheet1: 'Break-even Goals',
          sheet2: '12-Month Projection',
          title1: 'Break-even Goals',
          unitPrice: 'Unit Price',
          materialsPct: '% Materials',
          laborPct: '% Labor',
          otherPct: '% Other Variable Costs',
          totalVarPct: '% Total Variable Costs',
          fixedCostsHeader: 'Fixed Costs',
          item: 'Item',
          amount: 'Amount',
          fixedTotal: 'Total Fixed Costs',
          desiredProfit: 'Desired Monthly Profit',
          breakEven: 'Break-even Point ($)',
          targetRevenue: 'Revenue Needed for Your Goal ($)',
          channelsHeader: 'Revenue Channels',
          channel: 'Channel',
          channelPct: '% Share',
          atBreakEven: 'Amount at Break-even',
          atTarget: 'Amount at Goal',
          marketingHeader: 'Marketing',
          marketingPct: '% Invested in Marketing',
          expectedGrowth: 'Expected Monthly Growth',
          requiredGrowth: 'Required Monthly Growth',
          sufficient: 'Is it enough?',
          yes: 'Yes',
          no: 'No',
          recommendation: 'Recommendation',
          recommendationNone: 'Not achievable in 12 months even with high investment',
          month: 'Month',
          totalIncome: 'Total Revenue',
          variableCosts: 'Variable Costs',
          fixedCostsRow: 'Fixed Costs',
          marketingRow: 'Marketing',
          totalCost: 'Total Cost',
          monthlyProfit: 'Monthly Profit',
          accumulatedProfit: 'Accumulated Profit',
          growthAssumption: 'Growth Assumption',
          growthLabel: 'Monthly growth % (editable)',
          growthNote: 'Change this cell to update the whole projection',
          requiredNote: 'Reference: required rate to hit goal by month 12',
        }
      : {
          sheet1: 'Metas al Punto de Equilibrio',
          sheet2: 'Proyeccion 12 Meses',
          title1: 'Metas al Punto de Equilibrio',
          unitPrice: 'Precio Unitario',
          materialsPct: '% Materiales',
          laborPct: '% Personal',
          otherPct: '% Otros Costos Variables',
          totalVarPct: '% Costos Variables Totales',
          fixedCostsHeader: 'Gastos Fijos',
          item: 'Concepto',
          amount: 'Monto',
          fixedTotal: 'Total Gastos Fijos',
          desiredProfit: 'Utilidad Mensual Deseada',
          breakEven: 'Punto de Equilibrio ($)',
          targetRevenue: 'Ingreso Necesario para tu Meta ($)',
          channelsHeader: 'Canales de Ingreso',
          channel: 'Canal',
          channelPct: '% Participacion',
          atBreakEven: 'Monto en Equilibrio',
          atTarget: 'Monto en Meta',
          marketingHeader: 'Mercadotecnia',
          marketingPct: '% Invertido en Mercadotecnia',
          expectedGrowth: 'Crecimiento Mensual Esperado',
          requiredGrowth: 'Crecimiento Mensual Necesario',
          sufficient: 'Es suficiente?',
          yes: 'Si',
          no: 'No',
          recommendation: 'Recomendacion',
          recommendationNone: 'No se alcanza en 12 meses ni con una inversion alta',
          month: 'Mes',
          totalIncome: 'Ingresos Totales',
          variableCosts: 'Costos Variables',
          fixedCostsRow: 'Gastos Fijos',
          marketingRow: 'Publicidad',
          totalCost: 'Costo Total',
          monthlyProfit: 'Utilidad Mensual',
          accumulatedProfit: 'Utilidad Acumulada',
          growthAssumption: 'Supuesto de Crecimiento',
          growthLabel: '% crecimiento mensual (editable)',
          growthNote: 'Cambia esta celda para actualizar toda la proyeccion',
          requiredNote: 'Referencia: tasa necesaria para llegar a tu meta en el mes 12',
        };

  // -------------------- HOJA 1: Metas al Punto de Equilibrio --------------------
  const rows1: Row[] = [];
  function pushRow1(r: Row): number {
    rows1.push(r);
    return rows1.length;
  }

  pushRow1(row(L.title1));
  pushRow1([]);

  pushRow1(row(L.unitPrice, input.unitPrice));
  pushRow1(row(L.materialsPct, input.materialsPct));
  pushRow1(row(L.laborPct, input.laborPct));
  pushRow1(row(L.otherPct, input.otherVarPct));
  const totalVarPctRowNum = pushRow1(row(L.totalVarPct, result.totalVariablePctWithMarketing));
  pushRow1([]);

  pushRow1(row(L.fixedCostsHeader));
  let fixedStartRow = 0;
  let fixedEndRow = 0;
  if (input.fixedItems.length > 0) {
    pushRow1(row(L.item, L.amount));
    fixedStartRow = rows1.length + 1;
    for (const f of input.fixedItems) {
      pushRow1(row(f.name, f.amount));
    }
    fixedEndRow = rows1.length;
  }
  const fixedTotalRowNum = pushRow1(row(L.fixedTotal, result.fixedTotal));
  pushRow1([]);

  const desiredProfitRowNum = pushRow1(row(L.desiredProfit, input.desiredProfit));
  const breakEvenRowNum = pushRow1(row(L.breakEven, result.breakEvenWithMarketing));
  const targetRevenueRowNum = pushRow1(row(L.targetRevenue, result.targetRevenueWithMarketing));
  pushRow1([]);

  pushRow1(row(L.channelsHeader));
  pushRow1(row(L.channel, L.channelPct, L.atBreakEven, L.atTarget));
  const channelDataStartRow = rows1.length + 1;
  for (const ch of input.channels) {
    pushRow1(
      row(ch.name, ch.pct, result.breakEvenWithMarketing * ch.pct, result.targetRevenueWithMarketing * ch.pct)
    );
  }
  pushRow1([]);

  pushRow1(row(L.marketingHeader));
  const marketingPctRowNum = pushRow1(row(L.marketingPct, input.marketingPct));
  const expectedGrowthRowNum = pushRow1(row(L.expectedGrowth, result.expectedGrowthRate));
  const requiredGrowthRowNum = pushRow1(row(L.requiredGrowth, result.requiredGrowthRate));
  pushRow1(row(L.sufficient, result.isSufficient ? L.yes : L.no));
  if (!result.isSufficient) {
    const recoText =
      result.recommendedMarketingPct !== null
        ? (result.recommendedMarketingPct * 100).toFixed(0) + '%'
        : L.recommendationNone;
    pushRow1(row(L.recommendation, recoText));
  }

  const ws1: any = XLSX.utils.aoa_to_sheet(rows1);

  patchCell(ws1, 'B3', { z: '#,##0.00' });
  patchCell(ws1, 'B4', { z: '0.0%' });
  patchCell(ws1, 'B5', { z: '0.0%' });
  patchCell(ws1, 'B6', { z: '0.0%' });
  patchCell(ws1, 'B' + totalVarPctRowNum, { z: '0.0%' });

  if (fixedEndRow >= fixedStartRow && fixedStartRow > 0) {
    patchCell(ws1, 'B' + fixedTotalRowNum, {
      f: 'SUM(B' + fixedStartRow + ':B' + fixedEndRow + ')',
      z: '#,##0.00',
    });
    for (let r = fixedStartRow; r <= fixedEndRow; r++) {
      patchCell(ws1, 'B' + r, { z: '#,##0.00' });
    }
  } else {
    patchCell(ws1, 'B' + fixedTotalRowNum, { z: '#,##0.00' });
  }

  patchCell(ws1, 'B' + desiredProfitRowNum, { z: '#,##0.00' });
  patchCell(ws1, 'B' + breakEvenRowNum, {
    f: '(B' + fixedTotalRowNum + ')/(1-B' + totalVarPctRowNum + ')',
    z: '#,##0.00',
  });
  patchCell(ws1, 'B' + targetRevenueRowNum, {
    f: '(B' + fixedTotalRowNum + '+B' + desiredProfitRowNum + ')/(1-B' + totalVarPctRowNum + ')',
    z: '#,##0.00',
  });

  for (let i = 0; i < input.channels.length; i++) {
    const r = channelDataStartRow + i;
    patchCell(ws1, 'B' + r, { z: '0.0%' });
    patchCell(ws1, 'C' + r, { f: 'B' + breakEvenRowNum + '*B' + r, z: '#,##0.00' });
    patchCell(ws1, 'D' + r, { f: 'B' + targetRevenueRowNum + '*B' + r, z: '#,##0.00' });
  }

  patchCell(ws1, 'B' + marketingPctRowNum, { z: '0.0%' });
  patchCell(ws1, 'B' + expectedGrowthRowNum, { z: '0.0%' });
  patchCell(ws1, 'B' + requiredGrowthRowNum, { z: '0.0%' });

  ws1['!cols'] = [{ wch: 34 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

  // -------------------- HOJA 2: Proyeccion 12 Meses --------------------
  const monthCount = 12;
  const monthHeaders: string[] = [];
  for (let m = 1; m <= monthCount; m++) {
    monthHeaders.push(L.month + ' ' + String(m));
  }

  const revenueVals: number[] = [];
  const variableVals: number[] = [];
  const fixedVals: number[] = [];
  const marketingVals: number[] = [];
  const costVals: number[] = [];
  const profitVals: number[] = [];
  const accumVals: number[] = [];

  let prevRevenue = result.breakEvenWithMarketing;
  let accum = 0;
  for (let m = 0; m < monthCount; m++) {
    const monthRevenue = m === 0 ? result.breakEvenWithMarketing : prevRevenue * (1 + result.expectedGrowthRate);
    const monthVariable = monthRevenue * result.totalVariablePct;
    const monthMarketing = monthRevenue * input.marketingPct;
    const monthFixed = result.fixedTotal;
    const monthCost = monthVariable + monthMarketing + monthFixed;
    const monthProfit = monthRevenue - monthCost;
    accum += monthProfit;

    revenueVals.push(monthRevenue);
    variableVals.push(monthVariable);
    marketingVals.push(monthMarketing);
    fixedVals.push(monthFixed);
    costVals.push(monthCost);
    profitVals.push(monthProfit);
    accumVals.push(accum);

    prevRevenue = monthRevenue;
  }

  const rows2: Row[] = [];
  function pushRow2(r: Row): number {
    rows2.push(r);
    return rows2.length;
  }

  pushRow2(row(L.growthAssumption));
  const growthRateRowNum = pushRow2(row(L.growthLabel, result.expectedGrowthRate));
  const requiredNoteRowNum = pushRow2(row(L.requiredNote, result.requiredGrowthRate));
  const varPctRowNum2 = pushRow2(row(L.totalVarPct, result.totalVariablePct));
  const mktPctRowNum2 = pushRow2(row(L.marketingPct, input.marketingPct));
  pushRow2(row(L.growthNote));
  pushRow2([]);

  pushRow2(row(L.item, ...monthHeaders));
  const revenueRowNum = pushRow2(row(L.totalIncome, ...revenueVals));
  const variableRowNum = pushRow2(row(L.variableCosts, ...variableVals));
  const marketingRowNum = pushRow2(row(L.marketingRow, ...marketingVals));
  const fixedRowNum = pushRow2(row(L.fixedCostsRow, ...fixedVals));
  const costRowNum = pushRow2(row(L.totalCost, ...costVals));
  const profitRowNum2 = pushRow2(row(L.monthlyProfit, ...profitVals));
  const accumRowNum = pushRow2(row(L.accumulatedProfit, ...accumVals));

  const ws2: any = XLSX.utils.aoa_to_sheet(rows2);
  patchCell(ws2, 'B' + growthRateRowNum, { z: '0.0%' });
  patchCell(ws2, 'B' + requiredNoteRowNum, { z: '0.0%' });
  patchCell(ws2, 'B' + varPctRowNum2, { z: '0.0%' });
  patchCell(ws2, 'B' + mktPctRowNum2, { z: '0.0%' });

  for (let m = 1; m <= monthCount; m++) {
    const col = colLetter(m + 1);
    const prevCol = colLetter(m);

    if (m === 1) {
      patchCell(ws2, col + revenueRowNum, { z: '#,##0.00' });
    } else {
      patchCell(ws2, col + revenueRowNum, {
        f: prevCol + revenueRowNum + '*(1+$B$' + growthRateRowNum + ')',
        z: '#,##0.00',
      });
    }
    patchCell(ws2, col + variableRowNum, {
      f: col + revenueRowNum + '*$B$' + varPctRowNum2,
      z: '#,##0.00',
    });
    patchCell(ws2, col + marketingRowNum, {
      f: col + revenueRowNum + '*$B$' + mktPctRowNum2,
      z: '#,##0.00',
    });
    patchCell(ws2, col + fixedRowNum, { z: '#,##0.00' });
    patchCell(ws2, col + costRowNum, {
      f: col + variableRowNum + '+' + col + marketingRowNum + '+' + col + fixedRowNum,
      z: '#,##0.00',
    });
    patchCell(ws2, col + profitRowNum2, {
      f: col + revenueRowNum + '-' + col + costRowNum,
      z: '#,##0.00',
    });
    if (m === 1) {
      patchCell(ws2, col + accumRowNum, { f: col + profitRowNum2, z: '#,##0.00' });
    } else {
      patchCell(ws2, col + accumRowNum, {
        f: prevCol + accumRowNum + '+' + col + profitRowNum2,
        z: '#,##0.00',
      });
    }
  }

  const cols2: { wch: number }[] = [{ wch: 26 }];
  for (let m = 0; m < monthCount; m++) cols2.push({ wch: 13 });
  ws2['!cols'] = cols2;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, L.sheet1);
  XLSX.utils.book_append_sheet(wb, ws2, L.sheet2);

  const fileName = lang === 'en' ? 'break-even-goals.xlsx' : 'metas-punto-equilibrio.xlsx';
  XLSX.writeFile(wb, fileName);
}
