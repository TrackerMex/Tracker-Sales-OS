export function fieldErrorProps(name: string, message?: string) {
  if (!message) return {}
  return { "aria-invalid": true, "aria-describedby": `${name}-error` } as const
}
