import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookmarkedWord {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  chapter: string;
}

export const generatePDF = (data: BookmarkedWord[], fileName: string = 'vocabulary') => {
  // Create a new PDF document in A4 format
  const doc = new jsPDF();
  
  // Set page margins
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header styling
  doc.setFillColor(30, 41, 59); // Dark slate gray (#1e293b)
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Title - Use simple ASCII for header since Korean fonts not embedded
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Korean Vocabulary List", pageWidth / 2, 22, { align: 'center' });
  
  // Chapter subtitle
  if (data.length > 0 && data[0].chapter) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(data[0].chapter, pageWidth / 2, 30, { align: 'center' });
  }
  
  // Prepare table data - Korean text will be rendered as Unicode
  const tableData = data.map((row, index) => [
    (index + 1).toString(),
    row.word || '',
    row.phonetic || '',
    row.translation || ''
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
      font: "helvetica",
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      minCellHeight: 10,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 11,
      cellPadding: 8,
      lineColor: [226, 232, 240],
      lineWidth: 0.8
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 45, halign: 'left' },
      3: { cellWidth: 'auto', halign: 'left' }
    },
    alternateRowStyles: {
      fillColor: [253, 253, 254]
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.5,
    theme: 'grid',
    // Handle Korean text encoding
    didDrawCell: function(data) {
      // Add subtle left border accent for data rows
      if (data.section === 'body' && data.column.index === 0) {
        doc.setFillColor(99, 102, 241); // Indigo accent
        doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, 'F');
      }
    }
  });
  
  // Add footer with page numbers and word count
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 25,
      pageHeight - 12,
      { align: 'right' }
    );
    doc.text(
      `Total: ${data.length} words`,
      25,
      pageHeight - 12,
      { align: 'left' }
    );
  }
  
  // Save the PDF
  doc.save(`${fileName}.pdf`);
};
