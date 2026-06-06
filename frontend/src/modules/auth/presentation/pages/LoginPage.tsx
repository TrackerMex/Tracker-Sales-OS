import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../../application/hooks/useLogin';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(1, 'Requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#002B49]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-black uppercase tracking-widest text-[#002B49]">
            Tracker Sales OS
          </h1>
          <p className="mt-1 text-xs text-slate-400">GPS México</p>
        </div>

        <form onSubmit={handleSubmit((data) => login(data))} className="space-y-4">
          <div>
            <label className="text-tracker-label">Usuario</label>
            <input
              {...register('username')}
              type="text"
              autoComplete="username"
              className="input mt-1"
              placeholder="admin"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="text-tracker-label">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="input mt-1"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500">
              Credenciales incorrectas
            </p>
          )}

          <Button
            type="submit"
            className="btn-green w-full"
            disabled={isPending}
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
