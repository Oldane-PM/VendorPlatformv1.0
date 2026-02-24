import React from 'react';
import { PlatformProvider } from './contexts/PlatformContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <PlatformProvider>{children}</PlatformProvider>;
}
