import { useState } from "react"
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
import { TYPE_TAG } from "./task-card.constants"
import { cn } from "@/lib/utils"

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
  clientName,
  contactName,
}: TaskCardProps) {
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isOverdue = task.isOverdue && task.status === "Pendiente"
  const aiComment = getAiComment(task, clientName ?? null)
  const typeTagVariant = task.type ? (TYPE_TAG[task.type] ?? "gray") : null

  return (
    <div
      className={cn(
        "card flex items-start justify-between gap-3 p-3.5",
        task.status === "Completado" && "opacity-50"
      )}
    >
      <div className="min-w-0 flex-1">
        {/* Row 1: time + type badge */}
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-xl leading-none font-bold text-tracker-text">
            {formatTime(task.scheduledAt)}
          </span>
          {typeTagVariant && (
            <Badge
              variant={typeTagVariant}
              className="inline-flex items-center gap-1"
            >
              <ChecklistIcon size={11} />
              {task.type}
            </Badge>
          )}
        </div>

        {/* Row 2: client name */}
        {clientName && (
          <p className="mb-0.5 flex items-center gap-1 text-[13px] font-semibold text-slate-700">
            <BuildingIcon size={12} color="#334155" />
            {clientName}
          </p>
        )}

        {/* Row 3: task title */}
        <p className="mb-1 text-xs text-tracker-text-secondary">{task.title}</p>

        {/* Row 4: date + contact + overdue badge */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2.5",
            aiComment && "mb-1"
          )}
        >
          <span className="text-[11px] text-tracker-text-muted">
            {formatDate(task.scheduledAt)}
          </span>
          {contactName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-tracker-text-muted">
              <UserIcon size={11} color="#94A3B8" />
              {contactName}
            </span>
          )}
          {isOverdue && <Badge variant="red">Vencida</Badge>}
        </div>

        {/* AI comment */}
        {aiComment && (
          <p className="text-[11.5px] font-medium text-tracker-purple">
            IA: {aiComment}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {task.status === "Pendiente" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="success" size="sm">
                <CheckCircleIcon size={13} />
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
          <Badge variant="gray">Completada</Badge>
        )}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
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
              <DropdownMenuItem onSelect={() => onEdit(task)}>
                <EditIcon size={13} />
                Editar tarea
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setReactivateOpen(true)}>
                <ReloadIcon size={13} />
                Reactivar tarea
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <TrashIcon size={13} />
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
                Esta acción es irreversible y la tarea se eliminará
                permanentemente.
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

export { TYPE_TAG } from "./task-card.constants"
