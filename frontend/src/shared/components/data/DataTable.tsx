import { useState, type KeyboardEvent, type MouseEvent } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  UnfoldMoreIcon,
} from "@/shared/components/Icon"
import { cn } from "@/lib/utils"

declare module "@tanstack/react-table" {
  // Shared by header and body cells of a column (alignment, width).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

/** Server-driven pagination: the page owns `page` and refetches on change. */
interface DataTablePagination {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  disabled?: boolean
  /** What the table lists, used in the button labels ("de deals en riesgo"). */
  label?: string
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  getRowId?: (row: TData) => string
  pagination?: DataTablePagination
  /** Makes rows clickable and keyboard operable (Tab, Enter, Space). */
  onRowClick?: (row: TData) => void
}

// Table pattern from the template (dashboards/modern/projects-orders.tsx look,
// tables/data-table sorting). Full-bleed: put it in a `CardContent px-0`.
// Sorting is client-side, so it is off with server pagination (it would only
// reorder the visible page).
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  pagination,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  // TanStack Table returns non-memoizable functions; the compiler skipping this
  // component is expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId,
    enableSorting: !pagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow
              key={group.id}
              className="border-border hover:bg-transparent"
            >
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                const SortIcon =
                  sorted === "asc"
                    ? ChevronUpIcon
                    : sorted === "desc"
                      ? ChevronDownIcon
                      : UnfoldMoreIcon
                const content = header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : undefined
                    }
                    className={cn(
                      "h-auto px-4 py-3 text-sm font-normal text-muted-foreground",
                      header.column.columnDef.meta?.className
                    )}
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 rounded-sm whitespace-nowrap outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {content}
                        <SortIcon size={14} className="shrink-0" />
                      </button>
                    ) : (
                      content
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                "border-border hover:bg-muted/30",
                onRowClick &&
                  "cursor-pointer outline-none focus-visible:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              )}
              {...(onRowClick && {
                tabIndex: 0,
                onClick: (e: MouseEvent<HTMLTableRowElement>) => {
                  // React bubbles events from portals (menus, dialogs) opened
                  // from the row; only clicks inside the row's DOM count.
                  if (!e.currentTarget.contains(e.target as Node)) return
                  // Clicks on links, buttons or inputs inside the row stay theirs.
                  const hit = (e.target as Element).closest(
                    "a, button, input, select, textarea, [role=menuitem]"
                  )
                  if (hit && e.currentTarget.contains(hit)) return
                  onRowClick(row.original)
                },
                onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
                  // Only the row itself: keys on buttons inside it stay theirs.
                  if (e.target !== e.currentTarget) return
                  if (e.key !== "Enter" && e.key !== " ") return
                  e.preventDefault()
                  onRowClick(row.original)
                },
              })}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "px-4 py-3 text-sm",
                    cell.column.columnDef.meta?.className
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && <Pagination {...pagination} />}
    </>
  )
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  disabled,
  label,
}: DataTablePagination) {
  const of = label ? ` de ${label}` : ""
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border p-4 sm:flex-row">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label={`Ir a la página anterior${of}`}
        >
          Anterior
        </Button>
        <Button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= pageCount}
          aria-label={`Ir a la página siguiente${of}`}
        >
          Siguiente
        </Button>
      </div>
      <p className="text-sm font-medium text-foreground" aria-live="polite">
        Página {page} de {Math.max(pageCount, 1)}
      </p>
    </div>
  )
}
