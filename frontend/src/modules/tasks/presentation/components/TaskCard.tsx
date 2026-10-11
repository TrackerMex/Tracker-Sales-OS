import { useRef, useState } from "react"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Task } from "../../domain/tasks.types"
import {
  BuildingIcon,
  UserIcon,
  ChecklistIcon,
  EditIcon,
  CheckCircleIcon,
  ReloadIcon,
  TrashIcon,
  MoreHorizontalIcon,
} from "@/shared/components/Icon"
import { StatusBadge } from "@/shared/components/data/StatusBadge"

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  onEdit: (task: Task, opener?: HTMLElement) => void
  onReactivate: (id: string) => void
  onDelete: (id: string) => void
  onReturnFocus?: () => void
  clientName?: string | null
  contactName?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getAiComment(task: Task, clientName: string | null): string | null {
  if (task.status === "Completado") return null
  const name = clientName ?? "el contacto"
  if (task.isOverdue)
    return `Tarea vencida. Reagenda con ${name} y define una nueva fecha concreta.`
  return `Revisa: ¿esta tarea tiene un resultado medible? Si solo es "seguimiento", redefine con ${name}.`
}

export function TaskCard({
  task,
  onComplete,
  onEdit,
  onReactivate,
  onDelete,
  onReturnFocus,
  clientName,
  contactName,
}: TaskCardProps) {
  const actionsRef = useRef<HTMLButtonElement>(null)
  const deleteConfirmed = useRef(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isOverdue = task.isOverdue && task.status === "Pendiente"
  const aiComment = getAiComment(task, clientName ?? null)

  function restoreFocus(event: Event) {
    event.preventDefault()
    const target = document.getElementById(`task-actions-${task.id}`)
    if (target) target.focus()
    else onReturnFocus?.()
  }

  return (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base leading-none font-semibold text-foreground tabular-nums">
            {formatTime(task.scheduledAt)}
          </span>
          {task.type && (
            <Badge variant="outline">
              <ChecklistIcon />
              {task.type}
            </Badge>
          )}
          {isOverdue && <StatusBadge status="Vencida" />}
        </div>

        {clientName && (
          <p className="mt-2 flex items-center gap-1 text-sm font-medium text-foreground">
            <BuildingIcon size={14} className="text-muted-foreground" />
            {clientName}
          </p>
        )}

        <p className="mt-1 text-xs text-muted-foreground">{task.title}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <span>{formatDate(task.scheduledAt)}</span>
          {contactName && (
            <span className="inline-flex items-center gap-1">
              <UserIcon size={14} />
              {contactName}
            </span>
          )}
        </div>

        {aiComment && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">IA:</span> {aiComment}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {task.status === "Pendiente" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm">
                <CheckCircleIcon />
                Completar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Completar esta tarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se marcará como completada y se abrirá el registro de
                  actividad. Esta acción no se puede deshacer.
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
          <StatusBadge status="Completada" />
        )}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={actionsRef}
                  id={`task-actions-${task.id}`}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Acciones de tarea"
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Acciones de tarea</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="min-w-44">
            {task.status === "Pendiente" ? (
              <DropdownMenuItem onSelect={() => onEdit(task, actionsRef.current ?? undefined)}>
                <EditIcon />
                Editar tarea
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setReactivateOpen(true)}>
                <ReloadIcon />
                Reactivar tarea
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                deleteConfirmed.current = false
                setDeleteOpen(true)
              }}
            >
              <TrashIcon />
              Eliminar tarea
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
          <AlertDialogContent onCloseAutoFocus={restoreFocus}>
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
          <AlertDialogContent
            onCloseAutoFocus={(event) => {
              if (deleteConfirmed.current && onReturnFocus) {
                event.preventDefault()
                onReturnFocus()
              } else {
                restoreFocus(event)
              }
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible y la tarea se eliminará
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                deleteConfirmed.current = true
                onDelete(task.id)
              }}>
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export { TYPE_TAG } from "./task-card.constants"
