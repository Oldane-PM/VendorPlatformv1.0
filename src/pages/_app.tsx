import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Providers } from '@/app/providers';
import { Layout } from '@/components/layout/Layout';
import '@/styles/tailwind.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isStandalonePage =
    router.pathname === '/login' ||
    router.pathname.startsWith('/vendor-portal');

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
