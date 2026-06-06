import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function CoachingPage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Coaching Comercial</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — features 11-coaching y 12-ai-coach</p>
    </div>
  );
}

export const coachingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/coaching',
  component: CoachingPage,
});
