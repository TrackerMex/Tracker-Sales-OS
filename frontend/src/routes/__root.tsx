import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Toaster } from '@/components/ui/sonner';

export const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
