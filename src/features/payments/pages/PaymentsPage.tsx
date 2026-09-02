import { useState } from 'react'
import { Download, Eye, FileText, Plus, Search } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Drawer } from '../../../components/ui/Drawer'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Select } from '../../../components/ui/Select'
import { Skeleton } from '../../../components/ui/Skeleton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Toast } from '../../../components/ui/Toast'
import logo from '../../../assets/logo.jpeg'
import { downloadReceiptPdf } from '../../../lib/exports'
import { formatCurrency, formatDate } from '../../../lib/format'
import { formatPaymentMethod } from '../../../lib/payment-methods'
import { useAuth } from '../../auth/auth-context'
import { PaymentForm } from '../components/PaymentForm'
import { usePaymentDetail, usePayments } from '../hooks/usePayments'

export const PaymentsPage = () => {
  const navigate = useNavigate()
  const { can } = useAuth()
  const { payments, totalPages, page, setPage, search, setSearch, filters, setFilters, catalog, summary, pendingSummary, setSelectedStudentId, isLoading, error, createPayment, isCreating, voidPayment, isVoiding } = usePayments()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<{ id: string; receipt: string } | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Finanzas"
        title="Pagos"
        description="Registro, seguimiento y anulación controlada de pagos procesados en el centro."
        actions={can('payments.create') ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDrawerOpen(true)}>Registrar pago</Button> : undefined}
      />

      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-neutral-500">Cobrado hoy</p><p className="kpi-value mt-3">{formatCurrency(summary.todayTotal)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Cobrado este mes</p><p className="kpi-value mt-3">{formatCurrency(summary.monthTotal)}</p></Card>
        <Card><p className="text-sm text-neutral-500">Cantidad de pagos</p><p className="kpi-value mt-3">{summary.count}</p></Card>
        <Card><p className="text-sm text-neutral-500">Ultimo recibo</p><p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-neutral-900">{summary.latestReceipt}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_160px_170px_170px_170px_140px]">
          <Input placeholder="Buscar por recibo o referencia..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} leftIcon={<Search className="h-4 w-4" />} className="pl-10" />
          <Input type="date" value={filters.date} onChange={(event) => { setFilters((prev) => ({ ...prev, date: event.target.value })); setPage(1) }} />
          <Select value={filters.student} onChange={(event) => { const studentId = event.target.value; setFilters((prev) => ({ ...prev, student: studentId })); setSelectedStudentId(studentId === 'all' ? '' : studentId); setPage(1) }}>
            <option value="all">Todos los alumnos</option>
            {catalog?.students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
          </Select>
          <Select value={filters.method} onChange={(event) => { setFilters((prev) => ({ ...prev, method: event.target.value })); setPage(1) }}>
            <option value="all">Todos los métodos</option>
            {catalog?.methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
          </Select>
          <Select value={filters.concept} onChange={(event) => { setFilters((prev) => ({ ...prev, concept: event.target.value })); setPage(1) }}>
            <option value="all">Todos los conceptos</option>
            {catalog?.concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.label}</option>)}
          </Select>
          <Select value={filters.status} onChange={(event) => { setFilters((prev) => ({ ...prev, status: event.target.value })); setPage(1) }}>
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="voided">Anulado</option>
          </Select>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {isLoading ? <div className="space-y-4 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-25"><tr className="border-b border-neutral-200 text-left"><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Recibo</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Alumno</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Representante</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Concepto</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Monto</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Método</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Fecha</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Estado</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Usuario</th><th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Acciones</th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-100/90">
                    <td className="px-6 py-4 font-medium text-neutral-900">{payment.receiptNumber}</td>
                    <td className="px-6 py-4"><p className="font-medium text-neutral-900">{payment.studentName}</p><p className="mt-1 text-sm text-neutral-500">{payment.referenceNumber || 'Sin referencia'}</p></td>
                    <td className="px-6 py-4 text-neutral-800">{payment.guardianName}</td>
                    <td className="px-6 py-4 text-neutral-700">{payment.conceptName}</td>
                    <td className="px-6 py-4 font-medium tabular-nums text-neutral-900">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="px-6 py-4 text-neutral-700">{formatPaymentMethod(payment.paymentMethod)}</td>
                    <td className="px-6 py-4 text-neutral-700">{formatDate(payment.paymentDate)}</td>
                    <td className="px-6 py-4"><StatusBadge status={payment.status === 'active' ? 'active' : 'cancelled'} label={payment.status === 'active' ? 'Activo' : 'Anulado'} /></td>
                    <td className="px-6 py-4 text-neutral-700">{payment.registeredBy || 'Sin usuario'}</td>
                    <td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => navigate(`/pagos/${payment.id}`)} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 hover:bg-neutral-50 hover:text-primary"><Eye className="h-4 w-4" /></button>{can('payments.void') && payment.status === 'active' ? <Button variant="outline-danger" size="sm" onClick={() => setVoidTarget({ id: payment.id, receipt: payment.receiptNumber })}>Anular</Button> : null}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
        <div className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-600">Página {page} de {totalPages}</div>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</Button>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Registrar pago"
        description="Registra el pago y actualiza las mensualidades pendientes del alumno."
        footer={<div className="flex items-center justify-end gap-3"><Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancelar</Button><Button type="submit" form="payment-form" isLoading={isCreating}>Registrar pago</Button></div>}
      >
        <PaymentForm
          students={catalog?.students ?? []}
          concepts={catalog?.concepts ?? []}
          methods={catalog?.methods ?? []}
          pendingDebt={pendingSummary.debt}
          onSubmit={async (values) => {
            try {
              setSelectedStudentId(values.studentId)
              const result = await createPayment(values)
              setDrawerOpen(false)
              showToast(result.unallocated > 0 ? 'warning' : 'success', result.unallocated > 0 ? `Pago registrado. Recibo ${result.receipt_number}. Quedo saldo no asignado por ${formatCurrency(Number(result.unallocated))}.` : `Pago registrado. Recibo ${result.receipt_number}.`)
            } catch (paymentError) {
              showToast('error', paymentError instanceof Error ? paymentError.message : 'No se pudo registrar el pago.')
            }
          }}
        />
      </Drawer>

      <ConfirmDialog
        open={Boolean(voidTarget)}
        onClose={() => { setVoidTarget(null); setVoidReason('') }}
        onConfirm={() => {
          if (!voidTarget || !voidReason.trim()) return
          void voidPayment({ paymentId: voidTarget.id, reason: voidReason.trim() })
            .then(() => showToast('success', `Pago ${voidTarget.receipt} anulado correctamente.`))
            .catch((voidError) => showToast('error', voidError instanceof Error ? voidError.message : 'No se pudo anular el pago.'))
            .finally(() => { setVoidTarget(null); setVoidReason('') })
        }}
        isLoading={isVoiding}
        tone="danger"
        title="Anular pago"
        description={voidTarget ? `Vas a anular el pago ${voidTarget.receipt}. Esta accion revierte sus asignaciónes financieras.` : ''}
        confirmLabel="Anular pago"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Motivo obligatorio</label>
          <Input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Describe el motivo de la anulación" />
        </div>
      </ConfirmDialog>

      {toast ? <Toast type={toast.type} message={toast.message} /> : null}
    </div>
  )
}

export const PaymentReceiptPage = () => {
  const { id } = useParams()
  const { data: payment, isLoading, error } = usePaymentDetail(id)

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-[620px] w-full" /></div>
  if (error || !payment) return <Card><div className="space-y-3"><h2 className="text-lg font-semibold text-neutral-900">Recibo no disponible</h2><p className="text-sm text-neutral-500">{error instanceof Error ? error.message : 'No se encontro el recibo solicitado.'}</p><Link to="/pagos"><Button>Volver a pagos</Button></Link></div></Card>

  const paymentMethod = formatPaymentMethod(payment.paymentMethod)
  const receiptData = {
    receiptNumber: payment.receiptNumber,
    paymentDate: formatDate(payment.paymentDate),
    studentName: payment.studentName,
    guardianName: payment.guardianName,
    conceptName: payment.conceptName,
    paymentMethod,
    referenceNumber: payment.referenceNumber,
    amount: formatCurrency(payment.amount, payment.currency),
    registeredBy: payment.registeredBy,
    notes: payment.notes,
  }

  return <div className="space-y-5 lg:space-y-6">
    <div className="print:hidden"><PageHeader eyebrow="Finanzas" title={`Recibo ${payment.receiptNumber}`} description="Comprobante institucional listo para descargar o imprimir." actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<FileText className="h-4 w-4" />} onClick={() => { void downloadReceiptPdf(`recibo-${payment.receiptNumber}.pdf`, receiptData) }}>Descargar PDF</Button><Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => window.print()}>Imprimir</Button><Link to="/pagos"><Button>Volver</Button></Link></div>} /></div>

    <article className="invoice-sheet mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-neutral-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.12)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <header className="invoice-branding relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#2639ae] px-6 py-7 text-white sm:px-10 sm:py-9">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/15 bg-white/5" />
        <div className="absolute -bottom-32 left-1/3 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white p-1 shadow-lg"><img src={logo} alt="Logo institucional" className="h-full w-full rounded-xl object-cover" /></div><div><p className="text-lg font-semibold tracking-[-0.03em]">CEI Manuel Felipe Rugeles</p><p className="mt-1 text-sm text-white/70">Centro de Educacion Inicial</p></div></div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-left backdrop-blur-sm sm:text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">Recibo de pago</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{payment.receiptNumber}</p><p className="mt-1 text-xs text-white/70">Emitido el {formatDate(payment.paymentDate)}</p></div>
        </div>
      </header>

      <div className="space-y-7 px-6 py-7 sm:px-10 sm:py-9">
        <section className="grid gap-4 rounded-3xl border border-neutral-200 bg-[#f8faff] p-5 sm:grid-cols-2 sm:p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/65">Recibimos de</p><p className="mt-2 text-lg font-semibold text-neutral-900">{payment.guardianName}</p><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/65">Alumno(a)</p><p className="mt-2 font-medium text-neutral-800">{payment.studentName}</p></div>
          <div className="border-t border-neutral-200 pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/65">Por concepto de</p><p className="mt-2 text-lg font-semibold text-neutral-900">{payment.conceptName}</p><div className="mt-5 flex items-center gap-2 text-sm text-neutral-500"><span className="h-2 w-2 rounded-full bg-success" />Pago procesado correctamente</div></div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-neutral-200"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-primary px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 sm:grid-cols-[minmax(0,1.4fr)_0.8fr_0.8fr_0.7fr]"><span>Descripción</span><span className="hidden sm:block">Método</span><span className="hidden sm:block">Referencia</span><span className="text-right">Importe</span></div><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1.4fr)_0.8fr_0.8fr_0.7fr]"><div><p className="font-semibold text-neutral-900">{payment.conceptName}</p><p className="mt-1 text-sm text-neutral-500">Pago registrado el {formatDate(payment.paymentDate)}</p></div><p className="hidden text-sm text-neutral-700 sm:block">{paymentMethod}</p><p className="hidden truncate text-sm text-neutral-700 sm:block">{payment.referenceNumber || 'No aplica'}</p><p className="text-right text-lg font-semibold tracking-[-0.03em] text-neutral-900">{formatCurrency(payment.amount, payment.currency)}</p></div></section>

        <section className="flex flex-col gap-6 border-t border-dashed border-neutral-300 pt-7 sm:flex-row sm:items-end sm:justify-between"><div className="grid gap-4 text-sm sm:grid-cols-2 sm:gap-x-10"><div><p className="text-xs text-neutral-500">Método de pago</p><p className="mt-1.5 font-medium text-neutral-900">{paymentMethod}</p></div><div><p className="text-xs text-neutral-500">Referencia</p><p className="mt-1.5 font-medium text-neutral-900">{payment.referenceNumber || 'No aplica'}</p></div><div><p className="text-xs text-neutral-500">Registrado por</p><p className="mt-1.5 font-medium text-neutral-900">{payment.registeredBy || 'Administración'}</p></div><div><p className="text-xs text-neutral-500">Observaciones</p><p className="mt-1.5 font-medium text-neutral-900">{payment.notes || 'Sin observaciones.'}</p></div></div><div className="min-w-[220px] rounded-3xl bg-primary px-6 py-5 text-white shadow-[0_15px_32px_rgba(17,17,132,0.2)]"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Total recibido</p><p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{formatCurrency(payment.amount, payment.currency)}</p></div></section>

        
      </div>
      <div className="border-t border-neutral-100 bg-neutral-25 px-6 py-4 text-center text-xs text-neutral-500 sm:px-10">Este comprobante certifica la recepcion del pago indicado. Conservelo para sus registros.</div>
    </article>
  </div>
}






