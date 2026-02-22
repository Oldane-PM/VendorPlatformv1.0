import { RouterProvider } from 'react-router';
import { PlatformProvider } from './contexts/PlatformContext';
import { router } from './routes';

// Updated: 2026-02-15 - All context migrated to PlatformContext
export default function App() {
  return (
    <PlatformProvider>
      <RouterProvider router={router} />
    </PlatformProvider>
  );
}