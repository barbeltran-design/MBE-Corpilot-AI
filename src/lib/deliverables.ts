import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// ============================================================
// PDF: Plan Compilado
// ============================================================

function renderTextToPdf(title: string, body: string): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  const titleLines = pdf.splitTextToSize(title, maxWidth);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 20 + 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);

  const paragraphs = body.split('\n');
  for (const paragraph of paragraphs) {
    const cleaned = paragraph
      .replace(/^#{1,6}\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^-{3,}$/, '');
    if (cleaned.trim() === '') {
      y += 10;
      continue;
    }
    const lines = pdf.splitTextToSize(cleaned, maxWidth);
    for (const line of lines) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 14;
    }
    y += 4;
  }

  return pdf;
}

export interface DownloadCompiledPlanParams {
  sessionTopic?: string;
  compiledText: string;
  language: 'es' | 'en';
}

export function downloadCompiledPlanPdf(params: DownloadCompiledPlanParams): void {
  const { sessionTopic, compiledText, language } = params;
  const title =
    language === 'en'
      ? 'Compiled Strategic Plan' + (sessionTopic ? ' — ' + sessionTopic : '')
      : 'Plan Estratégico Compilado' + (sessionTopic ? ' — ' + sessionTopic : '');
  const pdf = renderTextToPdf(title, compiledText);
  const fileName = language === 'en' ? 'strategic-plan.pdf' : 'plan-estrategico.pdf';
  pdf.save(fileName);
}

// ============================================================
// EXCEL: Objetivos Financieros
// ============================================================

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
  const cell = ws[addr] || { t: 'n', v: 0 };
  if (patch.f !== undefined) cell.f = patch.f;
  if (patch.z !== undefined) cell.z = patch.z;
  ws[addr] = cell;
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

export function computeFinancialGoals(input: FinancialGoalsInput): FinancialGoalsResult {
  const totalRevenue = input.channels.reduce(function (s, c) { return s + (c.monthly || 0); }, 0);
  const fixedCostTotal = input.fixedCosts.reduce(function (s, c) { return s + (c.amount || 0); }, 0);
  const variableCostAmount = totalRevenue * input.variableCostPct;
  const totalCost = variableCostAmount + fixedCostTotal + input.adSpend;
  const estimatedMonthlyProfit = totalRevenue - totalCost;
  const pctUtilidad = totalRevenue > 0 ? estimatedMonthlyProfit / totalRevenue : 0;
  const denom = 1 - input.variableCostPct;
  const breakEven = denom > 0 ? (fixedCostTotal + input.adSpend) / denom : 0;
  const breakEvenPct = totalRevenue > 0 ? breakEven / totalRevenue : 0;

  let growthRate = 0;
  if (totalRevenue > 0 && input.adSpend > 0) {
    const pct = input.adSpend / totalRevenue;
    if (pct <= 0.02) growthRate = 0.01;
    else if (pct <= 0.05) growthRate = 0.02;
    else if (pct <= 0.1) growthRate = 0.04;
    else if (pct <= 0.15) growthRate = 0.06;
    else growthRate = 0.08;
  }

  return {
    totalRevenue: totalRevenue,
    fixedCostTotal: fixedCostTotal,
    variableCostAmount: variableCostAmount,
    totalCost: totalCost,
    estimatedMonthlyProfit: estimatedMonthlyProfit,
    pctUtilidad: pctUtilidad,
    breakEven: breakEven,
    breakEvenPct: breakEvenPct,
    growthRate: growthRate,
  };
}

export function downloadFinancialGoalsExcel(input: FinancialGoalsInput): void {
  const lang = input.language;
  const result = computeFinancialGoals(input);

  const L = lang === 'en'
    ? {
        sheet1: 'Targets and Break-even',
        sheet2: '12-Month Projection',
        title1: 'Financial Targets',
        channel: 'Channel',
        monthlyTarget: 'Monthly Target',
        totalIncome: 'Total Revenue',
        variableCostPctLabel: '% Variable Costs',
        variableCosts: 'Variable Costs',
        fixedCostsRow: 'Fixed Costs',
        fixedCostsHeader: 'Fixed Costs',
        item: 'Item',
        amount: 'Amount',
        adSpendRow: 'Advertising',
        totalCost: 'Total Cost',
        monthlyProfit: 'Estimated Monthly Profit',
        pctProfit: '% Profit',
        breakEvenTitle: 'Break-even Point',
        breakEvenAmount: 'Break-even ($)',
        breakEvenPctLabel: '% of sales target',
        growthAssumption: 'Growth Assumption',
        growthLabel: 'Monthly growth % (editable)',
        growthNote: 'Change this cell to update the whole projection',
        concept: 'Item',
        month: 'Month',
        accumulatedProfit: 'Accumulated Profit',
      }
    : {
        sheet1: 'Metas y Punto de Equilibrio',
        sheet2: 'Proyeccion 12 Meses',
        title1: 'Metas Financieras',
        channel: 'Canal',
        monthlyTarget: 'Meta Mensual',
        totalIncome: 'Ingresos Totales',
        variableCostPctLabel: '% Costos Variables',
        variableCosts: 'Costos Variables',
        fixedCostsRow: 'Costos Fijos',
        fixedCostsHeader: 'Costos Fijos',
        item: 'Concepto',
        amount: 'Monto',
        adSpendRow: 'Publicidad',
        totalCost: 'Costo Total',
        monthlyProfit: 'Utilidad Estimada Mensual',
        pctProfit: '% Utilidad',
        breakEvenTitle: 'Punto de Equilibrio',
        breakEvenAmount: 'Punto de Equilibrio ($)',
        breakEvenPctLabel: '% de tu meta de ventas',
        growthAssumption: 'Supuesto de Crecimiento',
        growthLabel: '% crecimiento mensual (editable)',
        growthNote: 'Cambia esta celda para actualizar toda la proyección',
        concept: 'Concepto',
        month: 'Mes',
        accumulatedProfit: 'Utilidad Acumulada',
      };

  // -------------------- HOJA 1: Metas y Punto de Equilibrio --------------------
  const rows1: Row[] = [];
  function pushRow1(r: Row): number {
    rows1.push(r);
    return rows1.length;
  }

  pushRow1(row(L.title1));
  pushRow1([]);
  pushRow1(row(L.channel, L.monthlyTarget));
  const channelStartRow = rows1.length + 1;
  for (const ch of input.channels) {
    pushRow1(row(ch.name, ch.monthly));
  }
  const channelEndRow = rows1.length;
  const totalIncomeRowNum = pushRow1(row(L.totalIncome, 0));
  pushRow1([]);

  const variableCostPctRowNum = pushRow1(row(L.variableCostPctLabel, input.variableCostPct));
  const variableCostAmountRowNum = pushRow1(row(L.variableCosts, 0));
  pushRow1([]);

  pushRow1(row(L.fixedCostsHeader));
  pushRow1(row(L.item, L.amount));
  const fixedStartRow = rows1.length + 1;
  for (const fc of input.fixedCosts) {
    pushRow1(row(fc.name, fc.amount));
  }
  const fixedEndRow = rows1.length;
  const fixedTotalRowNum = pushRow1(row(L.fixedCostsRow, 0));
  pushRow1([]);

  const adSpendRowNum = pushRow1(row(L.adSpendRow, input.adSpend));
  const totalCostRowNum = pushRow1(row(L.totalCost, 0));
  const profitRowNum = pushRow1(row(L.monthlyProfit, 0));
  const pctProfitRowNum = pushRow1(row(L.pctProfit, 0));
  pushRow1([]);

  pushRow1(row(L.breakEvenTitle));
  const breakEvenAmountRowNum = pushRow1(row(L.breakEvenAmount, 0));
  const breakEvenPctRowNum = pushRow1(row(L.breakEvenPctLabel, 0));

  const ws1: any = XLSX.utils.aoa_to_sheet(rows1);

  patchCell(ws1, 'B' + totalIncomeRowNum, {
    f: channelEndRow >= channelStartRow ? 'SUM(B' + channelStartRow + ':B' + channelEndRow + ')' : '0',
  });
  patchCell(ws1, 'B' + variableCostAmountRowNum, {
    f: 'B' + totalIncomeRowNum + '*B' + variableCostPctRowNum,
    z: '#,##0.00',
  });
  patchCell(ws1, 'B' + variableCostPctRowNum, { z: '0.0%' });
  patchCell(ws1, 'B' + fixedTotalRowNum, {
    f: fixedEndRow >= fixedStartRow ? 'SUM(B' + fixedStartRow + ':B' + fixedEndRow + ')' : '0',
  });
  patchCell(ws1, 'B' + totalCostRowNum, {
    f: 'B' + variableCostAmountRowNum + '+B' + fixedTotalRowNum + '+B' + adSpendRowNum,
  });
  patchCell(ws1, 'B' + profitRowNum, {
    f: 'B' + totalIncomeRowNum + '-B' + totalCostRowNum,
  });
  patchCell(ws1, 'B' + pctProfitRowNum, {
    f: 'IF(B' + totalIncomeRowNum + '=0,0,B' + profitRowNum + '/B' + totalIncomeRowNum + ')',
    z: '0.0%',
  });
  patchCell(ws1, 'B' + breakEvenAmountRowNum, {
    f: '(B' + fixedTotalRowNum + '+B' + adSpendRowNum + ')/(1-B' + variableCostPctRowNum + ')',
  });
  patchCell(ws1, 'B' + breakEvenPctRowNum, {
    f: 'IF(B' + totalIncomeRowNum + '=0,0,B' + breakEvenAmountRowNum + '/B' + totalIncomeRowNum + ')',
    z: '0.0%',
  });

  for (let r = channelStartRow; r <= totalIncomeRowNum; r++) {
    patchCell(ws1, 'B' + r, { z: '#,##0.00' });
  }
  for (let r = fixedStartRow; r <= totalCostRowNum; r++) {
    patchCell(ws1, 'B' + r, { z: '#,##0.00' });
  }
  patchCell(ws1, 'B' + adSpendRowNum, { z: '#,##0.00' });
  patchCell(ws1, 'B' + profitRowNum, { z: '#,##0.00' });
  patchCell(ws1, 'B' + breakEvenAmountRowNum, { z: '#,##0.00' });

  ws1['!cols'] = [{ wch: 32 }, { wch: 18 }];

  // -------------------- HOJA 2: Proyeccion 12 Meses --------------------
  const monthCount = 12;
  const monthHeaders: string[] = [];
  for (let m = 1; m <= monthCount; m++) {
    monthHeaders.push(L.month + ' ' + String(m));
  }

  const revenueVals: number[] = [];
  const variableVals: number[] = [];
  const fixedVals: number[] = [];
  const adVals: number[] = [];
  const costVals: number[] = [];
  const profitVals: number[] = [];
  const accumVals: number[] = [];

  let prevRevenue = result.totalRevenue;
  let accum = 0;
  for (let m = 0; m < monthCount; m++) {
    const monthRevenue = m === 0 ? result.totalRevenue : prevRevenue * (1 + result.growthRate);
    const monthVariable = monthRevenue * input.variableCostPct;
    const monthFixed = result.fixedCostTotal;
    const monthAd = input.adSpend;
    const monthCost = monthVariable + monthFixed + monthAd;
    const monthProfit = monthRevenue - monthCost;
    accum += monthProfit;

    revenueVals.push(monthRevenue);
    variableVals.push(monthVariable);
    fixedVals.push(monthFixed);
    adVals.push(monthAd);
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
  const growthRateRowNum = pushRow2(row(L.growthLabel, result.growthRate));
  const variableCostPctRowNum2 = pushRow2(row(L.variableCostPctLabel, input.variableCostPct));
  pushRow2(row(L.growthNote));
  pushRow2([]);

  pushRow2(row(L.concept, ...monthHeaders));
  const revenueRowNum = pushRow2(row(L.totalIncome, ...revenueVals));
  const variableRowNum = pushRow2(row(L.variableCosts, ...variableVals));
  const fixedRowNum = pushRow2(row(L.fixedCostsRow, ...fixedVals));
  const adRowNum = pushRow2(row(L.adSpendRow, ...adVals));
  const costRowNum = pushRow2(row(L.totalCost, ...costVals));
  const profitRowNum2 = pushRow2(row(L.monthlyProfit, ...profitVals));
  const accumRowNum = pushRow2(row(L.accumulatedProfit, ...accumVals));

  const ws2: any = XLSX.utils.aoa_to_sheet(rows2);
  patchCell(ws2, 'B' + growthRateRowNum, { z: '0.0%' });
  patchCell(ws2, 'B' + variableCostPctRowNum2, { z: '0.0%' });

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
      f: col + revenueRowNum + '*$B$' + variableCostPctRowNum2,
      z: '#,##0.00',
    });
    patchCell(ws2, col + fixedRowNum, { z: '#,##0.00' });
    patchCell(ws2, col + adRowNum, { z: '#,##0.00' });
    patchCell(ws2, col + costRowNum, {
      f: col + variableRowNum + '+' + col + fixedRowNum + '+' + col + adRowNum,
      z: '#,##0.00',
    });
    patchCell(ws2, col + profitRowNum2, {
      f: col + revenueRowNum + '-' + col + costRowNum,
      z: '#,##0.00',
    });
    if (m === 1) {
      patchCell(ws2, col + accumRowNum, {
        f: col + profitRowNum2,
        z: '#,##0.00',
      });
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

  const fileName = lang === 'en' ? 'financial-goals.xlsx' : 'objetivos-financieros.xlsx';
  XLSX.writeFile(wb, fileName);
}
