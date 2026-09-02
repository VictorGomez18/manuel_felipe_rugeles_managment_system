import { useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Skeleton } from '../../../components/ui/Skeleton'
import { downloadExcel, downloadReportPdf } from '../../../lib/exports'
import { formatCurrency, formatDate } from '../../../lib/format'
import { useReports } from '../hooks/useReports'

const chartColors = ['#111184', '#ffA500', '#2f9e6d', '#4c6fff', '#e66a5a', '#8367c7']

export const ReportsPage = () => {
  const [filters, setFilters] = useState({ startDate: '2026-08-01', endDate: '2026-08-31' })
  const { summary, collectionsByMethod, expensesByCategory, topDebtors, payrollByEmployee, receivablesByClassroom, isLoading, error } = useReports(filters)
  const period = `${formatDate(filters.startDate)} al ${formatDate(filters.endDate)}`
  const sections = [
    { title: 'Cobranzas por método', headers: ['Método', 'Movimientos', 'Total'], rows: collectionsByMethod.map((row) => [row.method, row.count, formatCurrency(row.total)]) },
    { title: 'Gastos por categoría', headers: ['Categoría', 'Movimientos', 'Total'], rows: expensesByCategory.map((row) => [row.category, row.count, formatCurrency(row.total)]) },
    { title: 'Cuentas por cobrar', headers: ['Alumno', 'Representante', 'Salón', 'Vencimiento', 'Saldo'], rows: topDebtors.map((row) => [row.student, row.guardian, row.classroom, formatDate(row.dueDate), formatCurrency(row.balance)]) },
  ]
  const exportExcel = () => downloadExcel(`reporte-financiero-${filters.startDate}-${filters.endDate}.xlsx`, 'Reporte financiero', ['Seccion', 'Detalle', 'Cantidad', 'Total'], [
    ...collectionsByMethod.map((row) => ['Cobranzas', row.method, row.count, row.total]),
    ...expensesByCategory.map((row) => ['Gastos', row.category, row.count, row.total]),
    ...topDebtors.map((row) => ['CxC', `${row.student} · ${row.classroom}`, 1, row.balance]),
  ])

  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="Analisis" title="Reportes" description="Indicadores financieros, cobranzas y compromisos del periodo seleccionado." actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel}>Excel</Button><Button variant="secondary" leftIcon={<FileText className="h-4 w-4" />} onClick={() => downloadReportPdf(`reporte-financiero-${filters.startDate}-${filters.endDate}.pdf`, 'Reporte financiero', period, sections)}>PDF</Button><Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => window.print()}>Imprimir</Button></div>} />
    <Card><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><Input type="date" value={filters.startDate} onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))} /><Input type="date" value={filters.endDate} onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))} /><div className="flex items-center rounded-2xl bg-primary-lighter/45 px-4 text-sm font-medium text-primary md:col-span-2">Periodo: {period}</div></div></Card>
    {error ? <Card><p className="text-sm text-danger">{error}</p></Card> : null}
    {isLoading ? <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-80 w-full" /></div> : <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"><Card><p className="text-sm text-neutral-500">Ingresos cobrados</p><p className="kpi-value mt-3">{formatCurrency(summary.incomeTotal)}</p></Card><Card><p className="text-sm text-neutral-500">Gastos operativos</p><p className="kpi-value mt-3">{formatCurrency(summary.expenseTotal)}</p></Card><Card className={summary.netTotal >= 0 ? 'border-success/20 bg-success-lighter/35' : 'border-danger/20 bg-danger-lighter/35'}><p className="text-sm text-neutral-500">Balance neto</p><p className="kpi-value mt-3">{formatCurrency(summary.netTotal)}</p></Card><Card><p className="text-sm text-neutral-500">Nómina causada</p><p className="kpi-value mt-3">{formatCurrency(summary.payrollAccrued)}</p></Card><Card><p className="text-sm text-neutral-500">Saldo por cobrar</p><p className="kpi-value mt-3">{formatCurrency(summary.receivableBalance)}</p></Card><Card><p className="text-sm text-neutral-500">Tasa de cobranza</p><p className="kpi-value mt-3">{summary.collectionRate}%</p></Card></div>
      <div className="grid gap-4 xl:grid-cols-2"><Card><div className="mb-5"><h3 className="text-base font-semibold text-neutral-900">Cobranzas por método</h3><p className="mt-1 text-sm text-neutral-500">Distribucion de los ingresos registrados.</p></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={collectionsByMethod} margin={{ top: 8, right: 6, bottom: 4, left: 4 }}><XAxis dataKey="method" tick={{ fill: '#738096', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#738096', fontSize: 11 }} axisLine={false} tickLine={false} width={50} /><Tooltip cursor={{ fill: '#f6f8fc' }} /><Bar dataKey="total" name="Cobrado" radius={[8, 8, 2, 2]} fill="#111184" /></BarChart></ResponsiveContainer></div></Card><Card><div className="mb-5"><h3 className="text-base font-semibold text-neutral-900">Gastos por categoría</h3><p className="mt-1 text-sm text-neutral-500">Peso de cada categoría en el periodo.</p></div><div className="flex h-72 items-center"><ResponsiveContainer width="58%" height="100%"><PieChart><Pie data={expensesByCategory} dataKey="total" nameKey="category" innerRadius={55} outerRadius={86} paddingAngle={4}>{expensesByCategory.map((row, index) => <Cell key={row.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="min-w-0 flex-1 space-y-3">{expensesByCategory.slice(0, 5).map((row, index) => <div key={row.category} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate text-neutral-600">{row.category}</span><span className="ml-auto font-medium text-neutral-800">{formatCurrency(row.total)}</span></div>)}</div></div></Card></div>
      <div className="grid gap-4 xl:grid-cols-2"><DataTable title="Alumnos con mayor saldo" headers={['Alumno', 'Salón', 'Vencimiento', 'Saldo']} rows={topDebtors.map((row) => [row.student, row.classroom, formatDate(row.dueDate), formatCurrency(row.balance)])} empty="No hay cuentas vencidas o pendientes en el rango seleccionado." /><DataTable title="CxC por salón" headers={['Salón', 'Alumnos', 'Saldo']} rows={receivablesByClassroom.map((row) => [row.classroom, row.students, formatCurrency(row.balance)])} empty="No hay saldos pendientes por salón." /></div>
      <DataTable title="Nómina por empleado" headers={['Empleado', 'Causado', 'Pagado', 'Pendiente']} rows={payrollByEmployee.map((row) => [row.employee, formatCurrency(row.accrued), formatCurrency(row.paid), formatCurrency(row.pending)])} empty="No hay datos de nómina en el rango seleccionado." />
    </>}
  </div>
}

const DataTable = ({ title, headers, rows, empty }: { title: string; headers: string[]; rows: Array<Array<string | number>>; empty: string }) => <Card padding="none" className="overflow-hidden"><div className="border-b border-neutral-200 px-6 py-4"><h3 className="text-base font-semibold text-neutral-900">{title}</h3></div><div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-[540px] text-sm"><thead className="bg-neutral-25 text-left"><tr className="border-b border-neutral-200">{headers.map((header) => <th key={header} className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{header}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={headers.length} className="px-6 py-8 text-center text-neutral-500">{empty}</td></tr> : rows.map((row, index) => <tr key={`${title}-${index}`} className="border-b border-neutral-100/90">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-6 py-4 ${cellIndex === 0 ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}>{cell}</td>)}</tr>)}</tbody></table></div></Card>






