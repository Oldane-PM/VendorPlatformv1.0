import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Providers } from '@/app/providers';
import { Layout } from '@/components/layout/Layout';
import { authClient } from '@/lib/auth-client';
import '@/styles/tailwind.css';

// Pages that don't require authentication
const PUBLIC_PATHS = ['/login'];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/vendor-portal')
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isStandalonePage =
    router.pathname === '/login' ||
    router.pathname.startsWith('/vendor-portal');

  // Auth check — redirect to /login if not authenticated
  useEffect(() => {
    // Skip auth check for public paths
    if (isPublicPath(router.pathname)) {
      setAuthChecked(true);
      return;
    }

    authClient
      .getSession()
      .then(({ data }) => {
        if (data?.session) {
          setIsAuthenticated(true);
        } else {
          router.replace('/login');
        }
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace('/login');
        setAuthChecked(true);
      });
  }, [router.pathname]);

  // Show nothing while checking auth (prevents dashboard flash)
  if (!authChecked && !isPublicPath(router.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <Providers>
      {isStandalonePage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </Providers>
  );
}
