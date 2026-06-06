import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function VentasPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Ventas</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 08-sales</p>
    </div>
  );
}

export const ventasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/ventas',
  component: VentasPage,
});
