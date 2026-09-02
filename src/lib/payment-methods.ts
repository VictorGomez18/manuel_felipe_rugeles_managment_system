export const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mobile_payment: 'Pago mÃ³vil',
  zelle: 'Zelle',
  other: 'Otro',
}

export const formatPaymentMethod = (method?: string | null) => {
  if (!method) return 'No especificado'
  return paymentMethodLabels[method] ?? method
}


