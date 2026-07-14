import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Task } from '../../domain/tasks.types'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  OfficeIcon,
  User02Icon,
  CheckListIcon,
  PencilEdit02Icon,
  CheckmarkCircle02Icon,
  ArrowReloadHorizontalIcon,
  Delete02Icon,
  MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons'
import { TYPE_TAG } from './task-card.constants'

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  onEdit: (task: Task) => void
  onReactivate: (id: string) => void
  onDelete: (id: string) => void
  clientName?: string | null
  contactName?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function getAiComment(task: Task, clientName: string | null): string | null {
  if (task.status === 'Completado') return null
  const name = clientName ?? 'el contacto'
  if (task.isOverdue) return `Tarea vencida. Reagenda con ${name} y define una nueva fecha concreta.`
  return `Revisa: ¿esta tarea tiene un resultado medible? Si solo es "seguimiento", redefine con ${name}.`
}

export function TaskCard({ task, onComplete, onEdit, onReactivate, onDelete, clientName, contactName }: TaskCardProps) {
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isOverdue = task.isOverdue && task.status === 'Pendiente'
  const aiComment = getAiComment(task, clientName ?? null)
  const typeTagVariant = task.type ? (TYPE_TAG[task.type] ?? 'gray') : null

  return (
    <div
      className="card"
      style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, opacity: task.status === 'Completado' ? 0.5 : 1 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: time + type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
            {formatTime(task.scheduledAt)}
          </span>
          {typeTagVariant && (
            <Badge variant={typeTagVariant} className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={CheckListIcon} size={11} color="currentColor" strokeWidth={1.8} />
              {task.type}
            </Badge>
          )}
        </div>

        {/* Row 2: client name */}
        {clientName && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>
            <HugeiconsIcon icon={OfficeIcon} size={12} color="#334155" strokeWidth={1.8} />
            {clientName}
          </p>
        )}

        {/* Row 3: task title */}
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{task.title}</p>

        {/* Row 4: date + contact + overdue badge */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: aiComment ? 4 : 0 }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{formatDate(task.scheduledAt)}</span>
          {contactName && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8' }}>
              <HugeiconsIcon icon={User02Icon} size={11} color="#94A3B8" strokeWidth={1.8} />
              {contactName}
            </span>
          )}
          {isOverdue && (
            <Badge variant="red">Vencida</Badge>
          )}
        </div>

        {/* AI comment */}
        {aiComment && (
          <p style={{ fontSize: 11.5, color: '#6D28D9', fontWeight: 500 }}>IA: {aiComment}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {task.status === 'Pendiente' ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="success" size="sm">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} color="currentColor" strokeWidth={1.8} />
                Completar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Completar esta tarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se marcará como completada y se abrirá el registro de actividad. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onComplete(task.id)}>
                  Sí, completar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Badge variant="gray">Completada</Badge>
        )}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Acciones de tarea">
                  <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Acciones de tarea</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="min-w-44">
            {task.status === 'Pendiente' ? (
              <DropdownMenuItem onSelect={() => onEdit(task)}>
                <HugeiconsIcon icon={PencilEdit02Icon} size={13} color="currentColor" strokeWidth={1.8} />
                Editar tarea
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setReactivateOpen(true)}>
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} color="currentColor" strokeWidth={1.8} />
                Reactivar tarea
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <HugeiconsIcon icon={Delete02Icon} size={13} color="currentColor" strokeWidth={1.8} />
              Eliminar tarea
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reactivar esta tarea?</AlertDialogTitle>
              <AlertDialogDescription>
                Volverá a estado Pendiente y podrás completarla de nuevo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onReactivate(task.id)}>
                Sí, reactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible y la tarea se eliminará permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(task.id)}>
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export { TYPE_TAG } from './task-card.constants'
