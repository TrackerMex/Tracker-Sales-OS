import { useAppStore } from '../../store/app.store';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'Dashboard', subtitle }: HeaderProps) {
  const { currentUser, clearAuth } = useAppStore();

  return (
    <header className="flex h-[54px] items-center justify-between border-b bg-white px-5" style={{ borderColor: '#E2E8F0' }}>
      <div>
        <h1 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
          {currentUser?.name}
        </span>
        <button
          onClick={clearAuth}
          className="btn-ghost"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
