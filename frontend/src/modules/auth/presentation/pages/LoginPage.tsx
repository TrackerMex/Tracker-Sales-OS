import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLogin } from "../../application/hooks/useLogin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { CheckIcon } from "@/shared/components/Icon"

const loginSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

const benefits = [
  "Pipeline en tiempo real",
  "Scoring de esfuerzo automatico",
  "Coaching con IA integrada",
  "Reportes ejecutivos mensuales",
]

export function LoginPage() {
  const { mutate: login, isPending, error } = useLogin()
  const {
    summary: serverError,
    fieldErrors,
    clearField,
    formRef,
  } = useApiFormErrors(error)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const usernameError = errors.username?.message ?? fieldErrors.username
  const passwordError = errors.password?.message ?? fieldErrors.password

  return (
    <div className="flex min-h-screen items-center justify-center bg-tracker-bg px-4 py-6">
      <div className="flex w-full max-w-[800px] flex-col overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(0,21,36,0.14)] md:flex-row">
        {/* Left panel */}
        <div className="flex w-full shrink-0 flex-col justify-between bg-tracker-dark px-6 py-6 md:w-[300px] md:px-8 md:pt-12 md:pb-8">
          <div>
            <h1 className="mb-3 flex min-h-12 w-full items-center">
              <img
                src="/brand/trackermexico.png"
                alt="Tracker México GPS"
                width={1681}
                height={280}
                className="h-auto max-h-8 w-full object-contain"
              />
            </h1>
            <p className="mb-9 text-[12.5px] text-white/60">
              Sistema de gestion comercial
            </p>

            <div className="hidden flex-col gap-4 md:flex">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tracker-green/12">
                    <CheckIcon className="text-tracker-green" />
                  </div>
                  <span className="text-[13px] font-medium text-white/85">
                    {b}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-12 hidden text-[11px] text-white/30 md:block">
            Tracker GPS Mexico - Sales OS
          </p>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 sm:py-12">
          <h2 className="mb-1 text-[22px] font-extrabold text-tracker-text">
            Bienvenido
          </h2>
          <p className="mb-8 text-[13px] text-tracker-text-secondary">
            Ingresa tus credenciales para acceder
          </p>

          <form ref={formRef} onSubmit={handleSubmit((data) => login(data))}>
            <div className="mb-5">
              <label className="slabel mb-1.5 block">Usuario</label>
              <Input
                {...register("username", {
                  onChange: () => clearField("username"),
                })}
                type="text"
                autoComplete="username"
                placeholder="admin"
                {...fieldErrorProps("username", usernameError)}
              />
              <FieldError name="username" message={usernameError} />
            </div>

            <div className="mb-5">
              <label className="slabel mb-1.5 block">Contrasena</label>
              <Input
                {...register("password", {
                  onChange: () => clearField("password"),
                })}
                type="password"
                autoComplete="current-password"
                {...fieldErrorProps("password", passwordError)}
              />
              <FieldError name="password" message={passwordError} />
            </div>

            {serverError && (
              <div className="mb-4">
                <FormErrorSummary error={serverError} />
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              variant="success"
              className="w-full"
            >
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Reset button */}
          <Button
            type="button"
            variant="link"
            onClick={() => reset()}
            className="mt-3 h-auto p-0 text-xs font-normal text-tracker-text-muted"
          >
            Limpiar formulario
          </Button>
        </div>
      </div>
    </div>
  )
}
