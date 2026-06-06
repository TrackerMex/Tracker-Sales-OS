import { useAppStore } from '../../store/app.store';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'Dashboard', subtitle }: HeaderProps) {
  const { currentUser, clearAuth } = useAppStore();

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-black uppercase text-[#002B49]">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500">
          {currentUser?.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAuth}
          className="text-xs"
        >
          Salir
        </Button>
      </div>
    </header>
  );
}
