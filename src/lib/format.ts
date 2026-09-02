export const appCurrentDate = new Date('2026-08-29T12:00:00-04:00')

export const formatCurrency = (value: number, currency: 'USD' | 'VES' = 'USD') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(`${value}T00:00:00`) : value)

export const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value)

export const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}


