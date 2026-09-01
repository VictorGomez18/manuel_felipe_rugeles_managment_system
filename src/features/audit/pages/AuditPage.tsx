import { useState } from 'react'
import { FileSearch, Search } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useAuditLogs } from '../hooks/useAuditLogs'

const formatDate = (value: string) => new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value))

const renderJson = (value: Record<string, unknown> | null | undefined) => {
  if (!value) return 'Sin datos'
  return Object.entries(value).map(([key, item]) => `${key}: ${String(item)}`).join(' · ')
}

export const AuditPage = () => {
  const { logs, total, totalPages, page, setPage, search, setSearch, isLoading, error } = useAuditLogs()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedLog = logs.find((log) => log.id === selectedId) ?? logs[0] ?? null

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader eyebrow="Sistema" title="Auditoria" description="Seguimiento de acciones financieras y administrativas sensibles registradas por el sistema." />

      {error ? <Card><p className="text-sm text-neutral-500">{error}</p></Card> : null}

      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Input placeholder="Buscar por accion, entidad o nota..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} leftIcon={<Search className="h-4 w-4" />} className="xl:max-w-md xl:pl-10" />
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-neutral-200 bg-neutral-25 px-3.5 py-2 text-sm text-neutral-500">{total} registros</div>
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</Button>
            <div className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-600">Pagina {page} de {totalPages}</div>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card padding="none" className="overflow-hidden">
          {isLoading ? (
            <div className="space-y-4 p-5"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={<FileSearch className="h-12 w-12" />} title="No hay registros de auditoria" description="Los movimientos importantes del sistema apareceran aqui." />
          ) : (
            <div className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <button key={log.id} type="button" onClick={() => setSelectedId(log.id)} className={`w-full px-5 py-4 text-left transition-colors duration-150 sm:px-6 ${selectedLog?.id === log.id ? 'bg-primary-lighter/30' : 'hover:bg-neutral-25'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{log.action} · {log.entity}</p>
                      <p className="mt-1 text-sm text-neutral-500">{log.userName}</p>
                    </div>
                    <div className="text-right text-sm text-neutral-500">{formatDate(log.createdAt)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {selectedLog ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-900">Detalle del cambio</h3>
                <p className="mt-1 text-sm text-neutral-500">Registro auditado el {formatDate(selectedLog.createdAt)}.</p>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Usuario</p><p className="mt-1 font-medium text-neutral-900">{selectedLog.userName}</p></div>
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Accion</p><p className="mt-1 font-medium text-neutral-900">{selectedLog.action}</p></div>
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Entidad</p><p className="mt-1 font-medium text-neutral-900">{selectedLog.entity}</p></div>
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Registro</p><p className="mt-1 font-medium text-neutral-900">{selectedLog.entityId}</p></div>
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Valores anteriores</p><p className="mt-1 text-neutral-900">{renderJson(selectedLog.oldValues)}</p></div>
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Valores nuevos</p><p className="mt-1 text-neutral-900">{renderJson(selectedLog.newValues)}</p></div>
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3.5"><p className="text-neutral-400">Notas</p><p className="mt-1 text-neutral-900">{selectedLog.notes || 'Sin notas'}</p></div>
              </div>
            </div>
          ) : (
            <EmptyState icon={<FileSearch className="h-12 w-12" />} title="Selecciona un registro" description="El detalle del cambio aparecera aqui cuando exista un registro seleccionado." />
          )}
        </Card>
      </div>
    </div>
  )
}

