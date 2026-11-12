import { z } from 'zod'

export const phoneError = 'Ingresa un teléfono venezolano completo, por ejemplo 04121234567 o +584121234567'

// Keep only presentation separators out of validation; reject letters and stray plus signs.
export const isVenezuelanPhone = (value: string) =>
  /^(?:0|\+58)[2-4][0-9]{9}$/.test(value.trim().replace(/[\s().-]/g, ''))

export const guardianPhoneSchema = z.string().trim().refine(isVenezuelanPhone, phoneError)
export const guardianEmailSchema = z.string().trim().refine(
  (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  'El correo no es válido',
)

export const guardianContactPayload = (values: { phone: string; email?: string }) => ({
  phone: guardianPhoneSchema.parse(values.phone),
  email: guardianEmailSchema.parse(values.email ?? '') || null,
})
