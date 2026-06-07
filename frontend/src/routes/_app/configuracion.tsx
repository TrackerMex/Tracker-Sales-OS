import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

export const configuracionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/configuracion',
  component: () => (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Configuración</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — features 14-settings y 15-import-export</p>
    </div>
  ),
});
