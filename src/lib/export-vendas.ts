import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

interface VendaExport {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  total: number;
  canal: string;
  data: string;
}

export async function exportVendasXlsx(vendas: VendaExport[], periodoLabel: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gourmel Pet';
  wb.created = new Date();

  const ws = wb.addWorksheet('Vendas', {
    properties: { defaultColWidth: 18 },
  });

  // Title row
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `Relatório de Vendas — ${periodoLabel}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF4A7C59' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  // Subtitle
  ws.mergeCells('A2:F2');
  const subCell = ws.getCell('A2');
  subCell.value = `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF888888' } };
  subCell.alignment = { horizontal: 'center' };

  // Header row
  const headers = ['Produto', 'Qtd', 'Valor Unit. (R$)', 'Total (R$)', 'Canal', 'Data'];
  const headerRow = ws.addRow(headers);
  headerRow.number; // row 3
  ws.getRow(3).height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A7C59' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF3A6349' } },
    };
  });

  // Data rows
  vendas.forEach((v, i) => {
    const row = ws.addRow([v.produto, v.quantidade, v.valorUnitario, v.total, v.canal, v.data]);
    const fill = i % 2 === 0
      ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF5F0EB' } }
      : { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } };

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.fill = fill;
      cell.alignment = { vertical: 'middle', horizontal: colNumber <= 1 || colNumber === 5 || colNumber === 6 ? 'left' : 'center' };
      if (colNumber === 3 || colNumber === 4) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
  });

  // Totals row
  const lastDataRow = 3 + vendas.length;
  const totalsRow = ws.addRow([
    'TOTAL',
    { formula: `SUM(B4:B${lastDataRow})` },
    '',
    { formula: `SUM(D4:D${lastDataRow})` },
    '',
    '',
  ]);

  totalsRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF4A7C59' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8DFD5' } };
    cell.border = { top: { style: 'double', color: { argb: 'FF4A7C59' } } };
  });

  // Column widths
  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 8;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 12;

  // Export
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `vendas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
