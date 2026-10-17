import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportAmortizationPDF(data: any) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(18, 46, 40); // Dark Emerald #122E28
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NAVESTA — Financial Takeover Report', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Amortization Schedule: ${data.lenderName || 'Loan Account'} (${data.loanType || 'Personal'} Loan)`, 14, 26);

  // Summary Metrics Table
  doc.setTextColor(45, 22, 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Overview Summary', 14, 42);

  const summaryRows = [
    ['Principal Amount', `INR ${data.principalRupees.toLocaleString('en-IN')}`],
    ['Annual Interest Rate', `${data.annualRatePercent}% p.a.`],
    ['Monthly EMI', `INR ${data.emiRupees.toLocaleString('en-IN')}`],
    ['Tenure', `${data.tenureMonths} Months`],
    ['Total Interest Payable', `INR ${data.totalInterestRupees.toLocaleString('en-IN')}`],
    ['Total Payment Amount', `INR ${data.totalPaymentRupees.toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    startY: 46,
    head: [['Parameter', 'Details']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [240, 144, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 4 },
  });

  // Schedule Table
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Month-by-Month Repayment Schedule', 14, finalY + 12);

  const tableBody = data.schedule.map((row: any) => [
    `Month ${row.month}`,
    `INR ${row.openingBalanceRupees.toLocaleString('en-IN')}`,
    `INR ${row.emiRupees.toLocaleString('en-IN')}`,
    `INR ${row.interestComponentRupees.toLocaleString('en-IN')}`,
    `INR ${row.principalComponentRupees.toLocaleString('en-IN')}`,
    `INR ${row.closingBalanceRupees.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: finalY + 16,
    head: [['Month', 'Opening Balance', 'EMI', 'Interest', 'Principal', 'Closing Balance']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [18, 46, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Navesta Financial Platform · Generated on ${new Date().toLocaleDateString('en-IN')} · Page ${i} of ${pageCount}`, 14, 285);
  }

  doc.save(`Navesta_Amortization_${(data.lenderName || 'Loan').replace(/\s+/g, '_')}.pdf`);
}
