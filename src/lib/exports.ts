import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import logo from '../assets/logo.jpeg'

type ExportRow = Array<string | number>

export const downloadExcel = (filename: string, sheetName: string, headers: string[], rows: ExportRow[]) => {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  worksheet['!cols'] = headers.map((header, index) => ({ wch: Math.min(36, Math.max(header.length + 3, ...rows.map((row) => String(row[index] ?? '').length + 2))) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

export const downloadReportPdf = (filename: string, title: string, period: string, sections: Array<{ title: string; headers: string[]; rows: ExportRow[] }>) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFillColor(17, 17, 132); doc.rect(0, 0, pageWidth, 104, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text('CEI Manuel Felipe Rugeles', 42, 44)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(title, 42, 63); doc.setFontSize(9); doc.text(period, 42, 82)
  let y = 132
  sections.forEach((section) => {
    doc.setTextColor(24, 35, 62); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(section.title, 42, y)
    autoTable(doc, { startY: y + 12, head: [section.headers], body: section.rows.map((row) => row.map(String)), theme: 'grid', headStyles: { fillColor: [17, 17, 132], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 8.5, cellPadding: 7, textColor: [40, 48, 65] }, alternateRowStyles: { fillColor: [246, 248, 252] }, margin: { left: 42, right: 42 } })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28
    if (y > 700) y = 72
  })
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) { doc.setPage(page); doc.setTextColor(120, 129, 145); doc.setFontSize(8); doc.text(`Generado el ${new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date())}  |  Página ${page} de ${pages}`, 42, 812) }
  doc.save(filename)
}

const loadImageAsDataUrl = async (source: string) => {
  const response = await fetch(source)
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo cargar el logo institucional.'))
    reader.readAsDataURL(blob)
  })
}
export interface ReceiptPdfData {
  receiptNumber: string
  paymentDate: string
  studentName: string
  guardianName: string
  conceptName: string
  paymentMethod: string
  referenceNumber?: string | null
  amount: string
  registeredBy?: string | null
  notes?: string | null
}

export const downloadReceiptPdf = async (filename: string, receipt: ReceiptPdfData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()
  const navy: [number, number, number] = [17, 17, 132]
  const ink: [number, number, number] = [21, 31, 54]
  const muted: [number, number, number] = [107, 119, 140]
  const logoData = await loadImageAsDataUrl(logo)

  doc.setFillColor(...navy); doc.rect(0, 0, width, 172, 'F')
  doc.setFillColor(255, 255, 255); doc.roundedRect(42, 43, 50, 50, 8, 8, 'F')
  doc.addImage(logoData, 'JPEG', 46, 47, 42, 42)
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('Manuel Felipe Rugeles', 110, 61)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('Centro de Educacion Inicial', 110, 79)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('RECIBO DE PAGO', width - 166, 54)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('NRO. DE RECIBO', width - 166, 76)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(receipt.receiptNumber, width - 166, 98)
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.6); doc.line(42, 125, width - 42, 125)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Fecha de emision: ${receipt.paymentDate}`, 42, 148)
  doc.text('Comprobante de pago institucional', width - 194, 148)

  doc.setFillColor(247, 249, 253); doc.roundedRect(42, 196, width - 84, 85, 12, 12, 'F')
  doc.setTextColor(...muted); doc.setFontSize(8); doc.text('RECIBIMOS DE', 61, 221); doc.text('ALUMNO(A)', 61, 257)
  doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(receipt.guardianName, 61, 241); doc.setFontSize(12); doc.text(receipt.studentName, 61, 276)
  doc.setTextColor(...muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('POR CONCEPTO DE', width / 2 + 8, 221)
  doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(receipt.conceptName, width / 2 + 8, 241, { maxWidth: width / 2 - 70 })

  autoTable(doc, { startY: 310, head: [['DESCRIPCION DEL PAGO', 'METODO', 'REFERENCIA', 'IMPORTE']], body: [[receipt.conceptName, receipt.paymentMethod, receipt.referenceNumber || 'No aplica', receipt.amount]], theme: 'plain', headStyles: { fillColor: navy, textColor: 255, fontSize: 8, fontStyle: 'bold', cellPadding: 10 }, bodyStyles: { textColor: ink, fontSize: 10, cellPadding: 13, fillColor: [255, 255, 255] }, columnStyles: { 0: { cellWidth: 210 }, 1: { cellWidth: 100 }, 2: { cellWidth: 110 }, 3: { cellWidth: 90, halign: 'right', fontStyle: 'bold' } }, margin: { left: 42, right: 42 }, didDrawCell: (data) => { if (data.section === 'body') { doc.setDrawColor(225, 230, 239); doc.line(42, data.cell.y + data.cell.height, width - 42, data.cell.y + data.cell.height) } } })

  const tableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFillColor(...navy); doc.roundedRect(width - 238, tableY + 26, 196, 82, 12, 12, 'F')
  doc.setTextColor(214, 220, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('TOTAL RECIBIDO', width - 216, tableY + 51)
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(23); doc.text(receipt.amount, width - 216, tableY + 83)

  const infoY = tableY + 145
  doc.setTextColor(...muted); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('REGISTRADO POR', 42, infoY); doc.text('OBSERVACIONES', width / 2 + 8, infoY)
  doc.setTextColor(...ink); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(receipt.registeredBy || 'Administración', 42, infoY + 19); doc.text(receipt.notes || 'Pago procesado correctamente.', width / 2 + 8, infoY + 19, { maxWidth: width / 2 - 50 })
  doc.setFillColor(247, 249, 253); doc.roundedRect(42, 730, width - 84, 46, 10, 10, 'F')
  doc.setTextColor(...muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('Este documento certifica la recepcion del pago indicado. Conserve este recibo para sus registros.', 60, 750)
  doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.text('CEI Manuel Felipe Rugeles · Sistema administrativo y financiero', 60, 766)
  doc.save(filename)
}




