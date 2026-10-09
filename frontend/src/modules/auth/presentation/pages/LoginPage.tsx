import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLogin } from "../../application/hooks/useLogin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"

const loginSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

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
    <main className="grid min-h-screen place-items-center bg-accent px-4 py-6">
      <div className="w-full max-w-md bg-background p-6 shadow-lg">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1>
            <img
              src="/brand/trackermexico-dark.png"
              alt="Tracker México GPS"
              width={1681}
              height={280}
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/brand/trackermexico.png"
              alt="Tracker México GPS"
              width={1681}
              height={280}
              className="hidden h-8 w-auto dark:block"
            />
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistema de gestión comercial
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit((data) => login(data))}
          className="mt-6 flex flex-col gap-4"
        >
          <div>
            <Label
              htmlFor="login-username"
              className="text-sm text-muted-foreground"
            >
              Usuario
            </Label>
            <Input
              id="login-username"
              className="mt-2"
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

          <div>
            <Label
              htmlFor="login-password"
              className="text-sm text-muted-foreground"
            >
              Contraseña
            </Label>
            <Input
              id="login-password"
              className="mt-2"
              {...register("password", {
                onChange: () => clearField("password"),
              })}
              type="password"
              autoComplete="current-password"
              {...fieldErrorProps("password", passwordError)}
            />
            <FieldError name="password" message={passwordError} />
          </div>

          {serverError && <FormErrorSummary error={serverError} />}

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="link"
            onClick={() => reset()}
            className="h-auto p-0 font-normal text-muted-foreground"
          >
            Limpiar formulario
          </Button>
        </div>
      </div>
    </main>
  )
}
