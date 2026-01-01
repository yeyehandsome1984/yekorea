import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookmarkedWord {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  chapter: string;
}

const KOREAN_FONT_FILE = 'NotoSansKR-Regular.ttf';
const KOREAN_FONT_FAMILY = 'NotoSansKR';
const KOREAN_FONT_URL = `/fonts/${KOREAN_FONT_FILE}`;

let cachedKoreanFontBase64: string | null = null;
let cachedKoreanFontPromise: Promise<string | null> | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x2000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
};

const loadKoreanFontBase64 = async (): Promise<string | null> => {
  if (cachedKoreanFontBase64) return cachedKoreanFontBase64;

  if (!cachedKoreanFontPromise) {
    cachedKoreanFontPromise = fetch(KOREAN_FONT_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load font: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(arrayBufferToBase64)
      .then((base64) => {
        cachedKoreanFontBase64 = base64;
        return base64;
      })
      .catch((err) => {
        console.warn('PDF export: failed to load Korean font; falling back to default fonts.', err);
        cachedKoreanFontBase64 = null;
        return null;
      });
  }

  return cachedKoreanFontPromise;
};

const ensureKoreanFont = async (doc: jsPDF): Promise<boolean> => {
  const base64 = await loadKoreanFontBase64();
  if (!base64) return false;

  try {
    doc.addFileToVFS(KOREAN_FONT_FILE, base64);
    doc.addFont(KOREAN_FONT_FILE, KOREAN_FONT_FAMILY, 'normal');
    return true;
  } catch (err) {
    console.warn('PDF export: failed to register Korean font; falling back to default fonts.', err);
    return false;
  }
};

export const generatePDF = async (data: BookmarkedWord[], fileName: string = 'vocabulary') => {
  // Create a new PDF document in A4 format
  const doc = new jsPDF();

  const hasKoreanFont = await ensureKoreanFont(doc);
  const tableFont = hasKoreanFont ? KOREAN_FONT_FAMILY : 'helvetica';

  // Set page margins
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header styling
  doc.setFillColor(30, 41, 59); // Dark slate gray (#1e293b)
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Korean Vocabulary List', pageWidth / 2, 22, { align: 'center' });

  // Chapter subtitle
  if (data.length > 0 && data[0].chapter) {
    doc.setFontSize(11);
    doc.setFont(hasKoreanFont ? KOREAN_FONT_FAMILY : 'helvetica', 'normal');
    doc.text(data[0].chapter, pageWidth / 2, 30, { align: 'center' });
  }

  // Prepare table data
  const tableData = data.map((row, index) => [
    (index + 1).toString(),
    row.word || '',
    row.phonetic || '',
    row.translation || '',
  ]);

  // Generate table with proper column structure
  autoTable(doc, {
    head: [['#', 'Korean Word', 'Pronunciation', 'Definition']],
    body: tableData,
    startY: 42,
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 10,
      cellPadding: 6,
      font: tableFont,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      minCellHeight: 10,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 11,
      cellPadding: 8,
      lineColor: [226, 232, 240],
      lineWidth: 0.8,
      font: tableFont,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 45, halign: 'left' },
      3: { cellWidth: 'auto', halign: 'left' },
    },
    alternateRowStyles: {
      fillColor: [253, 253, 254],
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.5,
    theme: 'grid',
    didDrawCell: function (data) {
      // Add subtle left border accent for data rows
      if (data.section === 'body' && data.column.index === 0) {
        doc.setFillColor(99, 102, 241); // Indigo accent
        doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, 'F');
      }
    },
  });

  // Add footer with page numbers and word count
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 12, { align: 'right' });
    doc.text(`Total: ${data.length} words`, 25, pageHeight - 12, { align: 'left' });
  }

  // Save the PDF
  doc.save(`${fileName}.pdf`);
};
