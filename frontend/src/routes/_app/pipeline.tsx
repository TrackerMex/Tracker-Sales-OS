import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';

function PipelinePage() {
  return (
    <div>
      <h2 className="text-xl font-black text-[#002B49]">Pipeline</h2>
      <p className="mt-2 text-sm text-slate-500">Pendiente — feature 07-pipeline</p>
    </div>
  );
}

export const pipelineRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/pipeline',
  component: PipelinePage,
});
