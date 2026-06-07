import { useState } from 'react'
import type { CreateTaskInput } from '../../domain/tasks.types'

interface CreateTaskFormProps {
  onSubmit: (input: CreateTaskInput) => void
  onCancel: () => void
  isLoading?: boolean
}

function defaultScheduledAt(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  // Format: YYYY-MM-DDTHH:MM (for datetime-local input)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
}

export function CreateTaskForm({ onSubmit, onCancel, isLoading = false }: CreateTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !scheduledAt) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          placeholder="Ej: Llamar a cliente para seguimiento"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49]/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Detalles adicionales..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49]/30 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Fecha y hora <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002B49]/30"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-medium text-white hover:bg-[#002B49]/90 disabled:opacity-60"
        >
          {isLoading ? 'Guardando...' : 'Crear tarea'}
        </button>
      </div>
    </form>
  )
}
