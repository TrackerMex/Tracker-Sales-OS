import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { EquipoPage } from '../../modules/equipo/presentation/pages/EquipoPage';

export const equipoRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/equipo',
  component: EquipoPage,
});
