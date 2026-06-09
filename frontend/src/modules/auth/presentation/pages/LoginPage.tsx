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

const benefits = [
  'Pipeline en tiempo real',
  'Scoring de esfuerzo automatico',
  'Coaching con IA integrada',
  'Reportes ejecutivos mensuales',
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#82bc00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2F7' }}>
      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 800,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,21,36,0.14)',
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            background: '#001524',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 32px 32px',
          }}
        >
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#82bc00', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Tracker Sales OS
            </h1>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', marginBottom: 36 }}>
              Sistema de gestion comercial
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {benefits.map((b) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(130,188,0,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 48 }}>
            Tracker GPS Mexico - Sales OS
          </p>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 40px',
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Bienvenido
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 32 }}>
            Ingresa tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit((data) => login(data))}>
            <div style={{ marginBottom: 20 }}>
              <label className="slabel" style={{ display: 'block', marginBottom: 6 }}>
                Usuario
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className="input"
                placeholder="admin"
              />
              {errors.username && (
                <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.username.message}</p>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="slabel" style={{ display: 'block', marginBottom: 6 }}>
                Contrasena
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="input"
              />
              {errors.password && (
                <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 16 }}>
                Credenciales incorrectas
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="btn-green"
              style={{ width: '100%' }}
            >
              {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Credentials hint */}
          <div
            style={{
              marginTop: 28,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 7,
              padding: '12px 14px',
              fontSize: 12,
              color: '#64748B',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#334155' }}>Credenciales de prueba:</strong>
            <br />
            Usuario: <span style={{ fontWeight: 600, color: '#334155' }}>admin</span>
            <br />
            Contrasena: <span style={{ fontWeight: 600, color: '#334155' }}>Admin123!</span>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: 12,
              cursor: 'pointer',
              padding: '6px 0',
              textDecoration: 'underline',
            }}
          >
            Limpiar formulario
          </button>
        </div>
      </div>
    </div>
  );
}
