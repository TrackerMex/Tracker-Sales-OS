import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { ImportExportPage } from '@/modules/import-export/presentation/pages/ImportExportPage';

export const importExportRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/import-export',
  component: ImportExportPage,
});
