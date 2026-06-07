import { createRoute } from '@tanstack/react-router';
import { ClientesPage } from '../../modules/clients/presentation/pages/ClientesPage';
import { appLayoutRoute } from '../_app';

export const clientesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/clientes',
  component: ClientesPage,
});
