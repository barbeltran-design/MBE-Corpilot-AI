// Fase 4 — Entregables descargables.
// Genera un PDF a partir del plan compilado (/compilar), lo sube a Firebase
// Storage bajo deliverables/{uid}/{deliverableId}.pdf y guarda un registro en
// la colección deliverables/{deliverableId} (ver DeliverableDoc en
// src/types/firestore.ts). Devuelve un ChatDeliverableRef listo para
// adjuntarse al ChatMessage del asistente y renderizarse como link de
// descarga en la UI.
//
// OJO: esto requiere que las reglas de seguridad de Firebase Storage
// permitan `write` en deliverables/{uid}/** al usuario autenticado dueño de
// ese uid. La URL de descarga que genera getDownloadURL() incluye un token
// de acceso que funciona sin importar las reglas de `read` (el token ES la
// autorización), así que no hace falta abrir lectura pública — solo write.
import { jsPDF } from 'jspdf';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from '@/lib/firebase';
import type { AgentId, ChatDeliverableRef, DeliverableDoc } from '@/types/firestore';

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convierte texto con markdown ligero (líneas que empiezan con "#" se tratan
 * como encabezado en negrita) en un PDF multi-página con word-wrap. No es un
 * renderer de Markdown completo — solo lo suficiente para que el plan
 * compilado de Babel se vea legible como documento descargable.
 */
function renderTextToPdf(title: string, body: string): Blob {
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

  return pdf.output('blob');
}

function deliverableStoragePath(uid: string, deliverableId: string, extension: string): string {
  return `deliverables/${uid}/${deliverableId}.${extension}`;
}

export async function createCompiledPlanDeliverable(params: {
  uid: string;
  agentId: AgentId;
  sessionTopic: string;
  compiledText: string;
  language: 'es' | 'en';
}): Promise<ChatDeliverableRef> {
  const { uid, agentId, sessionTopic, compiledText, language } = params;
  const db = getFirebaseDb();
  const storage = getFirebaseStorage();

  const deliverableId = `${uid}_${Date.now()}`;
  const title =
    language === 'en'
      ? 'Socio-Environmental Strategic Business Plan'
      : 'Plan de Negocio Estratégico Socioambiental';
  const fileName =
    language === 'en' ? 'strategic-business-plan.pdf' : 'plan-estrategico-socioambiental.pdf';

  const blob = renderTextToPdf(title, compiledText);
  const now = Timestamp.now();
  let url: string;

  try {
    const storagePath = deliverableStoragePath(uid, deliverableId, 'pdf');
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
    url = await getDownloadURL(storageRef);
    const deliverableDoc: DeliverableDoc = {
      uid,
      deliverableId,
      name: fileName,
      type: 'pdf',
      category: 'business-plan',
      storageUrl: url,
      generatedAt: now,
      agentId,
      sessionTopic,
      phdReferences: [],
    };
    await setDoc(doc(db, 'deliverables', deliverableId), deliverableDoc);
  } catch (uploadErr) {
    console.warn('[deliverables] Firebase Storage no disponible, usando data URI:', String(uploadErr).slice(0, 100));
    url = await blobToDataUri(blob);
  }

  return { name: fileName, type: 'pdf', url, generatedAt: now };
}
