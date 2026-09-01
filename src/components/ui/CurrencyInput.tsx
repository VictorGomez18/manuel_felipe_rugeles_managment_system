import { DollarSign } from 'lucide-react'
import { Input } from './Input'

interface CurrencyInputProps {
  value?: number
  onChange?: (value: number) => void
  placeholder?: string
  error?: boolean
  id?: string
  name?: string
}

export const CurrencyInput = ({ value, onChange, placeholder = '0.00', error, id, name }: CurrencyInputProps) => {
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type="number"
        step="0.01"
        min="0"
        value={value ?? ''}
        onChange={(event) => onChange?.(Number(event.target.value))}
        error={error}
        placeholder={placeholder}
        leftIcon={<DollarSign className="h-4 w-4" />}
        className="pl-10"
      />
    </div>
  )
}
