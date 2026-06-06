import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function NuevaActividadPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Registrar Actividad</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 05-activities</p>
    </div>
  );
}

export const nuevaActividadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/actividades/nueva',
  component: NuevaActividadPage,
});
