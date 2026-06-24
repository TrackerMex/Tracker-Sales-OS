import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LoginPage } from '../modules/auth/presentation/pages/LoginPage';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});
