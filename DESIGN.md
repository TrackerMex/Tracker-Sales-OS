# Design

## Color Palette

### Core Brand Colors

Tracker Sales OS uses **OKLCH** for all color definitions, providing perceptually uniform color space.

#### Primary Semantic Colors

- **Primary (Teal/Cyan)**: `oklch(0.508 0.118 165.612)` — action, links, interactive elements
  - Light variant (foreground): `oklch(0.979 0.021 166.113)`
  - Dark variant (dark mode): `oklch(0.432 0.095 166.913)`

- **Secondary (Light Gray)**: `oklch(0.967 0.001 286.375)` — subtle backgrounds, dividers
  - Foreground: `oklch(0.21 0.006 285.885)`

- **Muted (Very Light Gray)**: `oklch(0.96 0.003 325.6)` — secondary text, placeholders
  - Foreground: `oklch(0.542 0.034 322.5)`

#### Semantic Status Colors

- **Success**: `oklch(0.16a34a)` / `#16a34a` — positive actions, confirmations
- **Warning**: `oklch(0.d97706)` / `#d97706` — caution, alerts
- **Danger/Destructive**: `oklch(0.577 0.245 27.325)` / `#dc2626` — errors, delete, critical actions
- **Accent**: `oklch(0.96 0.003 325.6)` — highlights, emphasis

#### Tracker-Specific Legacy Colors

- **Tracker Dark**: `#001524` — dark navy for hero cells, accents
- **Tracker Blue**: `#002b49` — dark blue buttons, primary CTA
- **Tracker Green**: `#82bc00` — brand accent (sales momentum, growth)
- **Tracker Text**: `#0f172a` — body text
- **Tracker Text Secondary**: `#64748b` — secondary labels
- **Tracker Text Muted**: `#94a3b8` — disabled, tertiary text
- **Tracker Border**: `#e2e8f0` — subtle dividers, card borders

### Neutral Palette (Light Mode)

- **Background**: `oklch(1 0 0)` (pure white)
- **Card**: `oklch(1 0 0)` (white)
- **Foreground**: `oklch(0.145 0.008 326)` (near-black, neutral gray)
- **Border**: `oklch(0.922 0.005 325.62)` (light gray)

### Dark Mode Palette

- **Background**: `oklch(0.145 0.008 326)` (dark gray)
- **Card**: `oklch(0.212 0.019 322.12)` (slightly lighter gray)
- **Foreground**: `oklch(0.985 0 0)` (near-white)
- **Border**: `oklch(1 0 0 / 10%)` (white with transparency)

## Typography

### Font Family

- **Display / Headings**: Montserrat Variable (`@fontsource-variable/montserrat`) — modern sans-serif with weight range 100-900
- **Body / UI**: System stack (Tailwind default: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, etc.)

### Hierarchy

- **h1** (Page Title): Large, bold
- **h2** (Section Heading): Medium-large, semibold
- **h3** (Subsection): Medium, bold
- **Body**: 13–16px, regular weight (400), 1.5–1.6 line height
- **Labels / Small Text**: 10–12px, semibold, uppercase, tracked (0.08–0.15em letter-spacing)
- **Muted / Caption**: 11–12px, medium, secondary color

### UI Copy Standards

- Button labels: verb + object ("Save Changes", "Delete Deal", not "OK" or "Submit")
- Form labels: sentence case, short and scannable
- Status badges: uppercase, semantic color + small background tint
- Data tables: header uppercase + tracked, body left-aligned
- Empty states: clear, specific, actionable instruction

## Spacing & Layout

### Base Unit

- 4px grid for precise alignment

### Common Spacing Scale

- xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px

### Border Radius

- sm: `calc(--radius * 0.6)` ≈ 2.7px — small pills, tags
- md: `calc(--radius * 0.8)` ≈ 3.6px — inputs
- lg: `--radius` ≈ 4.5px (0.45rem) — cards, panels
- xl: `calc(--radius * 1.4)` ≈ 6.3px — larger cards
- 2xl: `calc(--radius * 1.8)` ≈ 8.1px — modals, large containers

### Component Spacing

- **Card**: `rounded-xl` (6–8px), `px-5 py-4` padding, `shadow-sm`
- **Input**: `rounded-lg` (4–5px), `px-3 py-2` padding
- **Button**: `rounded-lg`, `px-3.5 py-[7px]`, `gap-1.5` (icons + text)
- **KPI Strip**: 4-column grid with `1px` gap (border-like divider)

## Components

### Buttons

**Primary Button** (`.btn-primary`)
- Background: `--tracker-blue` (#002b49)
- Color: white
- Padding: `px-3.5 py-[7px]`, font-size `text-xs`, `font-semibold`
- Hover: darkened blue (#001e35)

**Green Button** (`.btn-green`)
- Background: `--tracker-green` (#82bc00)
- Color: `--tracker-dark` (#001524)
- Padding: `px-3.5 py-[7px]`, font-size `text-xs`, `font-bold`
- Hover: darkened green (#6da000)

**Ghost Button** (`.btn-ghost`)
- Background: #f1f5f9 (light gray)
- Color: `--tracker-text-dim` (#475569)
- Padding: `px-3.5 py-[7px]`
- Hover: darker gray (#e2e8f0)

**Danger Button** (`.btn-danger`)
- Background: #fee2e2 (light red)
- Color: `--tracker-danger-dark` (#b91c1c)
- Padding: `px-2.5 py-[7px]`

### Tags / Badges

All tags use `inline-flex`, `rounded-[5px]`, `px-[7px] py-[2px]`, `text-[10px] font-semibold uppercase`, `letter-spacing: 0.03em`

- `.tag-navy`: bg #e8f2f9, color #002b49
- `.tag-green`: bg #eefad4, color #4a7c00
- `.tag-amber`: bg #fef3c7, color #b45309
- `.tag-red`: bg #fee2e2, color #b91c1c
- `.tag-gray`: bg #f1f5f9, color #475569
- `.tag-purple`: bg #ede9fe, color #6d28d9

### Data Table (`.dt`)

- Font-size: `text-[13px]`
- Header (`th`): `text-[10.5px] font-semibold uppercase`, color muted, bg surface-alt
- Cell (`td`): `px-3 py-[10px]`, border-bottom light gray
- Hover row: surface-alt background

### KPI Cell (`.kpi-cell`)

- Padding: `px-5 py-[18px]`
- Variant `.ac` (active/contrast): dark background, white text, green labels
- Label (`.kl`): `text-[11px] font-semibold uppercase`
- Value (`.kv`): `text-[22px] font-bold`
- Subtext (`.ksb`): `text-[11px]`, muted color

### Cards

- Border: 1px solid `--tracker-border`
- Radius: `rounded-xl`
- Background: white
- Shadow: `shadow-sm`
- Padding: varies per use (typically `p-4` to `p-5`)

### Navigation Button (`.navbtn`)

- Padding: `px-3 py-[7px]`
- Color: rgba(255, 255, 255, 0.48) (muted white)
- Hover: rgba(255, 255, 255, 0.07) bg, white text
- Active: green-tinted bg, white text, green left border accent (3px wide)

## Interaction Patterns

### Transitions

- Standard: `transition-colors`, `duration-400`
- Button/hover states: `transition-colors` 0.12s
- Progress bar fill: `transition-all duration-400`

### States

- **Disabled**: reduced opacity, cursor not-allowed (handled per component)
- **Hover**: background or color shift (per component rules above)
- **Focus/Ring**: `outline-ring/50` on all focusable elements
- **Active/Selected**: color or background change + visual indicator (e.g., left border on nav items)

### Reduced Motion

- All animations and transitions respect `@media (prefers-reduced-motion: reduce)`
- Replace animations with instant/opacity-only alternatives when motion is disabled

## Responsive Design

- **Mobile**: Single-column, full-width KPI cells, stacked layout
- **Tablet**: 2–3 column grid for KPI strip, adjusted spacing
- **Desktop**: Full 4-column KPI strip, sidebar navigation, multi-column layouts

Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:) for breakpoint-specific styles.

## Accessibility

- **Color Contrast**: All text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
- **Semantic HTML**: Use native `<button>`, `<a>`, `<label>`, `<table>` where possible
- **ARIA labels**: Add `aria-label` for icon-only buttons, role attributes where needed
- **Keyboard Navigation**: All interactive elements reachable via Tab key
- **Focus Indicators**: Always visible (use `outline-ring`)
- **Color Not Alone**: Status/meaning also conveyed via text, icon, or pattern

## References

- **Palette**: OKLCH color space for perceptually uniform colors
- **Typography**: Montserrat (headings) + system UI fonts (body)
- **CSS Framework**: Tailwind CSS 4 with custom theme variables in `:root` and `.dark`
- **Component Library**: shadcn/ui (pre-configured, extends Tailwind)
- **Icons**: Huge Icons (React-based, free tier)
- **Design Tokens**: Defined in `frontend/src/index.css` under `:root` (light) and `.dark` selectors
