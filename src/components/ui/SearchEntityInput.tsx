import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from './Input'
import { cn } from '../../lib/utils'

interface SearchEntityOption {
  id: string
  title: string
  subtitle?: string
  meta?: string
}

interface SearchEntityInputProps {
  label: string
  placeholder: string
  query: string
  onQueryChange: (value: string) => void
  results: SearchEntityOption[]
  emptyState?: string
  selected?: SearchEntityOption | null
  onSelect: (option: SearchEntityOption) => void
  selectionSlot?: ReactNode
}

export const SearchEntityInput = ({ label, placeholder, query, onQueryChange, results, emptyState = 'No hay resultados.', selected, onSelect, selectionSlot }: SearchEntityInputProps) => {
  const showResults = query.trim().length > 0 && !selected

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
        <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} leftIcon={<Search className="h-4 w-4" />} className="pl-10" />
      </div>
      {showResults ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
          {results.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => onSelect(result)}
                  className="focus-ring flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors duration-150 hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{result.title}</p>
                    {result.subtitle ? <p className="mt-1 text-sm text-neutral-500">{result.subtitle}</p> : null}
                  </div>
                  {result.meta ? <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">{result.meta}</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className={cn('px-4 py-4 text-sm text-neutral-500')}>{emptyState}</div>
          )}
        </div>
      ) : null}
      {selectionSlot}
    </div>
  )
}
