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
      // Save is done; open the PDF in a viewer app (shows the "Open with"
      // chooser with the phone's PDF apps). If no PDF viewer is installed
      // this throws and the caller shows the "no viewer" message.
      await FileOpener.open({
        filePath: saved.uri,
        contentType: 'application/pdf',
      });
      return true;
    }
    doc.save(fileName);
    return true;
  } catch (e) {
    console.error('PDF download failed', e);
    return false;
  }
}
