import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) throw redirect({ to: '/login' });
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});
