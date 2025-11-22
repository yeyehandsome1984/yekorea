import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookmarkedWord {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  chapter: string;
}

export const generatePDF = (data: BookmarkedWord[], fileName: string = 'blackbook-vocabulary') => {
  // Create a new PDF document in A4 format
  const doc = new jsPDF();
  
  // Set page margins
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header styling
  doc.setFillColor(30, 41, 59); // Dark slate gray (#1e293b)
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Blackbook English Vocabulary", pageWidth / 2, 25, { align: 'center' });
  
  // Prepare table data
  const tableData = data.map((row, index) => [
    (index + 1).toString(), // SN
    `Definition or usage of ${row.word}`, // Phrases (placeholder - you can modify this)
    `${row.word} (#${Math.floor(Math.random() * 10) + 1})`, // One Word (#R) - random repeat count
    getPartOfSpeech(row.word), // PoS (placeholder function)
    row.translation // Hindi
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [['SN', 'Phrases', 'One Word (#R)', 'PoS', 'Hindi']],
    body: tableData,
    startY: 45,
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 9,
      cellPadding: 8,
      font: "helvetica",
      textColor: [51, 65, 85], // Slate gray text
      lineColor: [226, 232, 240], // Light gray borders
      lineWidth: 0.5,
      minCellHeight: 12
    },
    headStyles: {
      fillColor: [248, 250, 252], // Light gray background (#f8fafc)
      textColor: [51, 65, 85], // Dark text (#334155)
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 10,
      lineColor: [226, 232, 240],
      lineWidth: 0.8
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // SN
      1: { cellWidth: 85 }, // Phrases
      2: { cellWidth: 40, halign: 'center' }, // One Word
      3: { cellWidth: 25, halign: 'center' }, // PoS
      4: { cellWidth: 35 } // Hindi
    },
    alternateRowStyles: {
      fillColor: [253, 253, 254] // Very light gray for odd rows (#fdfdfe)
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.5,
    theme: 'grid',
    didParseCell: function(data) {
      // Add hover effect simulation with slightly different colors
      if (data.row.index % 4 === 0) {
        data.cell.styles.fillColor = [240, 249, 255]; // Light blue tint
      }
    }
  });
  
  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 30,
      pageHeight - 15,
      { align: 'right' }
    );
  }
  
  // Save the PDF
  doc.save(`${fileName}.pdf`);
};

// Helper function to determine part of speech (placeholder implementation)
function getPartOfSpeech(word: string): string {
  // This is a simple placeholder - you can enhance this with actual POS detection
  const commonNouns = ['man', 'woman', 'house', 'book', 'water', 'dog', 'cat'];
  const commonVerbs = ['run', 'walk', 'eat', 'sleep', 'read', 'write', 'think'];
  const commonAdjectives = ['good', 'bad', 'big', 'small', 'happy', 'sad', 'beautiful'];
  
  const lowerWord = word.toLowerCase();
  
  if (commonNouns.includes(lowerWord)) return '(N.)';
  if (commonVerbs.includes(lowerWord)) return '(V.)';
  if (commonAdjectives.includes(lowerWord)) return '(Adj.)';
  
  // Default fallback
  return '(N.)';
}