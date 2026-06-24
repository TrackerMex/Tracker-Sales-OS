import { RouterProvider, createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { loginRoute } from './routes/login';
import { laminaRoute } from './routes/lamina';
import { appLayoutRoute } from './routes/_app';
import { dashboardRoute } from './routes/_app/dashboard';
import { miDiaRoute } from './routes/_app/mi-dia';
import { clientesRoute } from './routes/_app/clientes';
import { agendaRoute } from './routes/_app/agenda';
import { nuevaActividadRoute } from './routes/_app/actividades.nueva';
import { pipelineRoute } from './routes/_app/pipeline';
import { ventasRoute } from './routes/_app/ventas';
import { coachingRoute } from './routes/_app/coaching';
import { reportesRoute } from './routes/_app/reportes';
import { equipoRoute } from './routes/_app/equipo';
import { configuracionRoute } from './routes/_app/configuracion';
import { importExportRoute } from './routes/_app/import-export';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  laminaRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    miDiaRoute,
    clientesRoute,
    agendaRoute,
    nuevaActividadRoute,
    pipelineRoute,
    ventasRoute,
    coachingRoute,
    reportesRoute,
    equipoRoute,
    configuracionRoute,
    importExportRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
