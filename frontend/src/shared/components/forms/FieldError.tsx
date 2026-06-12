interface Props {
  name: string
  message?: string
}

export function FieldError({ name, message }: Props) {
  if (!message) return null
  return (
    <p id={`${name}-error`} className="mt-1 font-medium" style={{ fontSize: 11, color: '#b91c1c' }}>
      {message}
    </p>
  )
}

export function fieldErrorProps(name: string, message?: string) {
  if (!message) return {}
  return { 'aria-invalid': true, 'aria-describedby': `${name}-error` } as const
}
