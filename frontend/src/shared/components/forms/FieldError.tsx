interface Props {
  name: string
  message?: string
}

export function FieldError({ name, message }: Props) {
  if (!message) return null
  return (
    <p id={`${name}-error`} className="mt-1 text-xs text-destructive">
      {message}
    </p>
  )
}
