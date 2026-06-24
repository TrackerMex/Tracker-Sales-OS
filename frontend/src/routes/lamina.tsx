import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LaminaPage } from '../modules/reports/presentation/pages/LaminaPage';

export const laminaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lamina',
  validateSearch: (search: Record<string, unknown>): {
    month?: string;
    goalAmount?: number;
    goalUnits?: number;
    goalPerSeller?: number;
  } => ({
    month: typeof search.month === 'string' ? search.month : undefined,
    goalAmount: typeof search.goalAmount === 'number' ? search.goalAmount
      : typeof search.goalAmount === 'string' && !isNaN(Number(search.goalAmount)) ? Number(search.goalAmount)
      : undefined,
    goalUnits: typeof search.goalUnits === 'number' ? search.goalUnits
      : typeof search.goalUnits === 'string' && !isNaN(Number(search.goalUnits)) ? Number(search.goalUnits)
      : undefined,
    goalPerSeller: typeof search.goalPerSeller === 'number' ? search.goalPerSeller
      : typeof search.goalPerSeller === 'string' && !isNaN(Number(search.goalPerSeller)) ? Number(search.goalPerSeller)
      : undefined,
  }),
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      const redirectTo = location.pathname + location.search;
      throw redirect({
        to: '/login',
        search: { redirect: redirectTo },
      });
    }
  },
  component: LaminaPage,
});
