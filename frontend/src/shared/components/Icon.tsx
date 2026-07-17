import * as React from "react"
import {
  Add,
  AlertCircle,
  ArrowRight,
  Calendar3,
  Category,
  Chart2,
  Check,
  Checklist,
  ChevronDown,
  ChevronExpandY,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  DocumentText,
  Dollar,
  Download,
  Edit2,
  EyeOpen,
  Folder4,
  Gear,
  Kanban,
  Logout,
  MoreH,
  Office,
  People,
  Repeat3,
  SearchNormal,
  SidebarLeft,
  Sun,
  TickCircle,
  Trash,
  User4,
  Users3,
  WavePulse,
  Xmark,
} from "reicon-react"
import type {
  IconComponent,
  IconProps as ReiconIconProps,
} from "reicon-react"

export type IconProps = Omit<ReiconIconProps, "strokeWidth">

function createIcon(
  Base: IconComponent,
  displayName: string,
  strokeWidth?: 2
) {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ color, style, size = 18, ...props }, ref) => (
      <Base
        ref={ref}
        size={size}
        strokeWidth={strokeWidth}
        {...props}
        style={{ color, ...style }}
      />
    )
  )
  Icon.displayName = displayName
  return Icon
}

export const ChevronDownIcon = createIcon(ChevronDown, "ChevronDownIcon")
export const ChevronUpIcon = createIcon(ChevronUp, "ChevronUpIcon")
export const ChevronLeftIcon = createIcon(ChevronLeft, "ChevronLeftIcon")
export const ChevronRightIcon = createIcon(ChevronRight, "ChevronRightIcon")
export const UnfoldMoreIcon = createIcon(ChevronExpandY, "UnfoldMoreIcon")
export const CloseIcon = createIcon(Xmark, "CloseIcon")
export const BuildingIcon = createIcon(Office, "BuildingIcon")
export const EyeIcon = createIcon(EyeOpen, "EyeIcon")

export const SidebarToggleIcon = createIcon(SidebarLeft, "SidebarToggleIcon", 2)
export const EditIcon = createIcon(Edit2, "EditIcon", 2)
export const CheckCircleIcon = createIcon(TickCircle, "CheckCircleIcon", 2)
export const ReloadIcon = createIcon(Repeat3, "ReloadIcon", 2)
export const PlusIcon = createIcon(Add, "PlusIcon", 2)
export const SearchIcon = createIcon(SearchNormal, "SearchIcon", 2)
export const CalendarIcon = createIcon(Calendar3, "CalendarIcon", 2)
export const FolderIcon = createIcon(Folder4, "FolderIcon", 2)
export const UserIcon = createIcon(User4, "UserIcon", 2)
export const DashboardIcon = createIcon(Category, "DashboardIcon", 2)
export const KanbanIcon = createIcon(Kanban, "KanbanIcon", 2)
export const DocumentTextIcon = createIcon(DocumentText, "DocumentTextIcon", 2)
export const TeamIcon = createIcon(People, "TeamIcon", 2)

export const CheckIcon = createIcon(Check, "CheckIcon")
export const TrashIcon = createIcon(Trash, "TrashIcon")
export const LogoutIcon = createIcon(Logout, "LogoutIcon")
export const MoreHorizontalIcon = createIcon(MoreH, "MoreHorizontalIcon")
export const ArrowRightIcon = createIcon(ArrowRight, "ArrowRightIcon")
export const ChecklistIcon = createIcon(Checklist, "ChecklistIcon")
export const PulseIcon = createIcon(WavePulse, "PulseIcon")
export const SunIcon = createIcon(Sun, "SunIcon")
export const UsersIcon = createIcon(Users3, "UsersIcon")
export const DollarIcon = createIcon(Dollar, "DollarIcon")
export const BarChartIcon = createIcon(Chart2, "BarChartIcon")
export const SettingsIcon = createIcon(Gear, "SettingsIcon")
export const DownloadIcon = createIcon(Download, "DownloadIcon")
export const AlertCircleIcon = createIcon(AlertCircle, "AlertCircleIcon")
