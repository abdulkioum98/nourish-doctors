// Shared PDF download for the calculator pages.
//
// window.print() does nothing inside the Android app (Capacitor WebView has
// no print dialog), so "Download PDF" / "Print / PDF" silently did nothing.
// This builds a real PDF file from the report text, then:
//  - in the app: saves it FIRST to the phone's Documents folder (Files
//    app > Documents — real local storage, so the file stays on the phone
//    and can be found later), and only after the save succeeds opens it
//    with the phone's PDF viewer ("Open with" app chooser — Drive PDF
//    Viewer, Chrome, etc.). No share sheet: the file is saved, then the
//    viewer opens it directly.
//  - in the browser: downloads it as a normal file.
//
// jsPDF's built-in fonts only cover Latin-1, so characters like ৳ or
// Bengali script are normalised to plain ASCII first (৳ -> "Tk ").
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';

function toPdfSafe(text: string): string {
  const map: Record<string, string> = {
    '৳': 'Tk ',
    '•': '-',
    '—': '-',
    '–': '-',
    '±': '+/-',
    '²': '2',
    '³': '3',
    '°': 'deg',
    '×': 'x',
    '÷': '/',
    '≈': '~',
    '’': "'",
    '‘': "'",
    '“': '"',
    '”': '"',
    '…': '...',
    '✓': 'v',
    '✔': 'v',
  };
  let out = '';
  for (const ch of text) {
    if (map[ch] !== undefined) out += map[ch];
    else if (ch.charCodeAt(0) < 128) out += ch;
    // anything else (e.g. Bengali script) cannot render in the PDF font
  }
  return out;
}

// Some report lines pack several "• item" entries on one line
// ("--- NUTRIENT REQUIREMENTS• DM ... • CP ..."). Split those into
// one line per item so the PDF stays readable.
function splitBullets(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split('\n')) {
    const parts = raw
      .split('•')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      lines.push('');
      continue;
    }
    if (raw.trimStart().startsWith('•')) {
      parts.forEach((p) => lines.push(`- ${p}`));
    } else {
      lines.push(parts[0]);
      parts.slice(1).forEach((p) => lines.push(`- ${p}`));
    }
  }
  return lines;
}

function buildPdf(text: string, title: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 15;
  const width = 210 - margin * 2;
  const lineHeight = 6;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(toPdfSafe(title), margin, y);
  y += 4;
  doc.setDrawColor(16, 122, 87);
  doc.setLineWidth(0.6);
  doc.line(margin, y, 210 - margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const rawLine of splitBullets(text)) {
    const line = toPdfSafe(rawLine);
    const wrapped = doc.splitTextToSize(line || ' ', width);
    for (const w of wrapped) {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      doc.text(w, margin, y);
      y += lineHeight;
    }
  }
  return doc;
}

/** Returns true when the PDF was created (and opened / downloaded). */
export async function downloadTextAsPdf(
  fileName: string,
  title: string,
  text: string,
): Promise<boolean> {
  try {
    const doc = buildPdf(text, title);
    return await saveAndOpenPdf(doc, fileName);
  } catch (e) {
    console.error('PDF download failed', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Short table PDFs (ration report): a title, a small info table, then one
// or more real tables with a header row, alternating row shading and a
// bold total row — instead of long plain-text lines.
// ---------------------------------------------------------------------------

export interface PdfTable {
  title?: string;
  headers: string[];
  rows: string[][];
  /** A bold closing row (e.g. totals), drawn with a top border. */
  totalRow?: string[];
  /** Row indexes (into rows) drawn bold with a section-header fill,
      e.g. the Concentrate / Fodder group rows in a ration table. */
  boldRows?: number[];
}

const PAGE_MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_BOTTOM = 280;
const TABLE_FONT = 10;

function pdfTableColumnWidths(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  totalRow?: string[],
): number[] {
  const usable = PAGE_WIDTH - PAGE_MARGIN * 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TABLE_FONT);
  const widths = headers.map((h) => doc.getTextWidth(toPdfSafe(h)) + 4);
  doc.setFont('helvetica', 'normal');
  const allRows = totalRow ? [...rows, totalRow] : rows;
  for (const row of allRows) {
    row.forEach((cell, i) => {
      if (i >= widths.length) return;
      widths[i] = Math.max(widths[i], doc.getTextWidth(toPdfSafe(cell)) + 4);
    });
  }
  const total = widths.reduce((a, b) => a + b, 0);
  if (total > usable) {
    // Shrink proportionally, but never below 18 mm a column.
    const min = 18;
    const excess = total - usable;
    const shrinkable = widths.reduce((a, w) => a + Math.max(0, w - min), 0);
    if (shrinkable > 0) {
      const scale = Math.max(0, (shrinkable - excess) / shrinkable);
      for (let i = 0; i < widths.length; i++) {
        widths[i] = min + Math.max(0, widths[i] - min) * scale;
      }
    }
  }
  return widths;
}

function buildTablePdf(
  title: string,
  info: Array<[string, string]>,
  tables: PdfTable[],
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const usable = PAGE_WIDTH - PAGE_MARGIN * 2;
  const rowH = 7;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(toPdfSafe(title), PAGE_MARGIN, y);
  y += 4;
  doc.setDrawColor(16, 122, 87);
  doc.setLineWidth(0.6);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 7;

  // Small info table: label (bold) | value, alternating row shading.
  if (info.length > 0) {
    const labelW = 48;
    const valueW = usable - labelW;
    doc.setFontSize(TABLE_FONT);
    info.forEach(([label, value], idx) => {
      const lines = doc.splitTextToSize(toPdfSafe(value) || ' ', valueW - 4);
      const h = Math.max(rowH, lines.length * 5 + 2);
      if (y + h > PAGE_BOTTOM) {
        doc.addPage();
        y = 18;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(243, 244, 246);
        doc.rect(PAGE_MARGIN, y, usable, h, 'F');
      }
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.rect(PAGE_MARGIN, y, usable, h);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(toPdfSafe(label), PAGE_MARGIN + 2, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, PAGE_MARGIN + labelW + 2, y + 5);
      y += h;
    });
    y += 4;
  }

  const drawHeader = (headers: string[], widths: number[]): void => {
    doc.setFillColor(16, 122, 87);
    doc.rect(PAGE_MARGIN, y, usable, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(TABLE_FONT);
    doc.setTextColor(255, 255, 255);
    let x = PAGE_MARGIN;
    headers.forEach((h, i) => {
      doc.text(toPdfSafe(h), x + 2, y + 5);
      x += widths[i];
    });
    doc.setTextColor(31, 41, 55);
    y += rowH;
  };

  for (const table of tables) {
    if (table.title) {
      if (y + rowH + 4 > PAGE_BOTTOM) {
        doc.addPage();
        y = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(6, 95, 70);
      doc.text(toPdfSafe(table.title), PAGE_MARGIN, y + 4);
      doc.setTextColor(31, 41, 55);
      y += 9;
    }
    const widths = pdfTableColumnWidths(doc, table.headers, table.rows, table.totalRow);
    const allRows: Array<{ cells: string[]; total: boolean; bold: boolean }> = [
      ...table.rows.map((cells, i) => ({
        cells,
        total: false,
        bold: (table.boldRows || []).includes(i),
      })),
      ...(table.totalRow ? [{ cells: table.totalRow, total: true, bold: true }] : []),
    ];
    drawHeader(table.headers, widths);
    allRows.forEach(({ cells, total, bold }, rowIdx) => {
      // Wrap long cells; the row is as tall as its tallest cell.
      doc.setFont('helvetica', total || bold ? 'bold' : 'normal');
      doc.setFontSize(TABLE_FONT);
      const wrapped = cells.map((cell, i) =>
        doc.splitTextToSize(toPdfSafe(cell) || ' ', Math.max(10, widths[i] - 4)),
      );
      const lines = Math.max(...wrapped.map((w) => w.length), 1);
      const h = Math.max(rowH, lines * 5 + 2);
      if (y + h > PAGE_BOTTOM) {
        doc.addPage();
        y = 18;
        drawHeader(table.headers, widths);
      }
      if (total) {
        doc.setFillColor(236, 253, 245);
        doc.rect(PAGE_MARGIN, y, usable, h, 'F');
        doc.setDrawColor(16, 122, 87);
        doc.setLineWidth(0.5);
        doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
      } else if (bold) {
        doc.setFillColor(254, 243, 199);
        doc.rect(PAGE_MARGIN, y, usable, h, 'F');
      } else if (rowIdx % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(PAGE_MARGIN, y, usable, h, 'F');
      }
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.rect(PAGE_MARGIN, y, usable, h);
      let x = PAGE_MARGIN;
      wrapped.forEach((cellLines, i) => {
        // Numbers right-aligned, text left-aligned.
        const isNumber = /^-?[\d,]+(\.\d+)?$/.test((cells[i] || '').trim());
        const textX = isNumber ? x + widths[i] - 2 : x + 2;
        doc.text(cellLines, textX, y + 5, { align: isNumber ? 'right' : 'left' });
        x += widths[i];
      });
      y += h;
    });
    y += 5;
  }
  return doc;
}

/** Save the PDF (Documents first, then open it) — shared by both PDF kinds. */
async function saveAndOpenPdf(doc: jsPDF, fileName: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1];
    // Save FIRST to the phone's Documents folder, so the PDF is really
    // in local storage before anything opens. Only after the save
    // succeeds does the viewer ("Open with") open.
    let saved: { uri: string };
    try {
      saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
      });
    } catch (documentsError) {
      // Some devices block the public Documents folder — fall back to
      // the app cache so the PDF still opens, and say so plainly.
      console.warn('Could not save PDF to Documents, using cache', documentsError);
      alert('Could not save the PDF to Documents. Opening a temporary copy instead.');
      saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
    }
    // Save is done; confirm it visibly, then open the PDF in a viewer
    // app (shows the "Open with" chooser with the phone's PDF apps).
    // If no PDF viewer is installed this throws and the caller shows
    // the "no viewer" message.
    alert(`PDF saved successfully to Documents: ${fileName}`);
    await FileOpener.open({
      filePath: saved.uri,
      contentType: 'application/pdf',
    });
    return true;
  }
  doc.save(fileName);
  alert(`PDF downloaded successfully: ${fileName}`);
  return true;
}

/** Short table PDF: title + info table + one or more real tables. */
export async function downloadTablePdf(
  fileName: string,
  title: string,
  info: Array<[string, string]>,
  tables: PdfTable[],
): Promise<boolean> {
  try {
    const doc = buildTablePdf(title, info, tables);
    return await saveAndOpenPdf(doc, fileName);
  } catch (e) {
    console.error('PDF download failed', e);
    return false;
  }
}
