import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { CoachingPage } from '../../modules/coaching/presentation/pages/CoachingPage';

export const coachingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/coaching',
  component: CoachingPage,
});
