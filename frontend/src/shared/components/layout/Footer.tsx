export function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 text-center text-sm text-muted-foreground md:flex-row">
      <p>© 2026 Tracker México</p>
      <p>
        Diseño basado en{" "}
        <a
          href="https://github.com/shadcndashboard/next-shadcn-dashboard"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-primary"
        >
          Shadcn Dashboard
        </a>
      </p>
    </footer>
  )
}
