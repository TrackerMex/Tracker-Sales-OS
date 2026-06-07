import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { SettingsPage } from '@/modules/settings/presentation/pages/SettingsPage';

export const configuracionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/configuracion',
  component: SettingsPage,
});
