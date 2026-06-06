import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function MiDiaPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Mi Día</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 10-mi-dia</p>
    </div>
  );
}

export const miDiaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/mi-dia',
  component: MiDiaPage,
});
