import type { CSSProperties } from "react"

const FADE =
  "linear-gradient(to right, transparent, black 2%, black 98%, transparent)"

const DOTS: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at center, currentColor 1px, transparent 0)",
  backgroundSize: "12px 12px",
  backgroundPosition: "6px 6px",
  color: "var(--foreground)",
  opacity: 0.25,
  maskImage: FADE,
  WebkitMaskImage: FADE,
}

// Dotted strip between bento rows (template shared/divider + StyleDivider).
// Must be a direct child of a `grid-cols-12` bento.
export function DottedDivider() {
  return (
    <div className="col-span-12" aria-hidden="true">
      <div className="relative h-4 overflow-hidden bg-background">
        <div className="absolute inset-0" style={DOTS} />
      </div>
    </div>
  )
}
