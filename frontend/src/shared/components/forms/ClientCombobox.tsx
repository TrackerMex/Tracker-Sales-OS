import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useClients } from "@/modules/clients/application/hooks/useClients"
import type { Client } from "@/modules/clients/domain/clients.types"

export interface ClientComboboxProps {
  value: string
  onSelect: (client: Client | null) => void
  onResolve?: (client: Client) => void
  initialLabel?: string | null
  placeholder?: string
  disabled?: boolean
  error?: boolean
  id?: string
}

export function ClientCombobox({
  value,
  onSelect,
  onResolve,
  initialLabel,
  placeholder = "Buscar cliente...",
  disabled,
  error,
  id,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initialLabel ?? null)

  // Reset the label when the parent clears `value` from outside (e.g. form reset).
  // Adjusted during render (not in an effect) per React's "you might not need an effect" guidance.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!value) setSelectedLabel(null)
  }

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const { data, isLoading } = useClients({
    q: debouncedSearch || undefined,
    limit: 20,
  })
  const results = data?.data ?? []

  // Silent hydration: when mounted (or when value/initialLabel go from empty to set) with a
  // known id + label but no resolved Client object yet, run a one-off lookup query and call
  // `onResolve` once. This does not touch selectedLabel/open state, only the parent's state via
  // onResolve — a legitimate network-derived side effect, not a same-component render-state sync.
  const resolvedForValueRef = useRef<string | null>(null)
  const { data: resolveData } = useClients(
    { q: initialLabel ?? undefined, limit: 5 },
    { enabled: Boolean(onResolve && value && initialLabel) },
  )

  useEffect(() => {
    if (!onResolve || !value || !initialLabel || !resolveData) return
    if (resolvedForValueRef.current === value) return
    const match = resolveData.data.find((c) => c.id === value)
    if (match) {
      resolvedForValueRef.current = value
      onResolve(match)
    }
  }, [onResolve, value, initialLabel, resolveData])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={error}
          disabled={disabled}
          className={cn(
            "input flex items-center justify-between gap-2 text-left",
            error && "input-error",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel ?? placeholder}
          </span>
          <HugeiconsIcon
            icon={UnfoldMoreIcon}
            strokeWidth={2}
            className="pointer-events-none size-4 shrink-0 text-muted-foreground"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar por nombre..."
          />
          <CommandList>
            <CommandItem
              value="__none__"
              onSelect={() => {
                onSelect(null)
                setSelectedLabel(null)
                setOpen(false)
                setSearch("")
              }}
            >
              Sin cliente
              {!value && (
                <HugeiconsIcon icon={Tick02Icon} className="ml-auto size-4" strokeWidth={2} />
              )}
            </CommandItem>
            {isLoading ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>Sin resultados.</CommandEmpty>
            ) : (
              results.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onSelect(c)
                    setSelectedLabel(c.name)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  {c.name}
                  {c.id === value && (
                    <HugeiconsIcon icon={Tick02Icon} className="ml-auto size-4" strokeWidth={2} />
                  )}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
