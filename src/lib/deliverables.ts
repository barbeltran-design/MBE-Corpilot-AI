// Fase 4 — Entregable descargable del plan compilado.
// Genera un PDF en el navegador de la persona y lo descarga directamente a
// su computadora (como al descargar un archivo de Google Drive). No se sube
// a ningun servicio en la nube: no requiere Firebase Storage, no tiene costo,
// y no necesita configuracion adicional.
import { jsPDF } from 'jspdf';

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
