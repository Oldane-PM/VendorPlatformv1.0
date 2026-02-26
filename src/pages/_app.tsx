import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Providers } from '@/app/providers';
import { Layout } from '@/components/layout/Layout';
import '@/styles/tailwind.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLogin = router.pathname === '/login';
  const isVendorPortal = router.pathname.startsWith('/vendor-upload');
  const skipLayout = isLogin || isVendorPortal;

  return (
    <Providers>
      {skipLayout ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </Providers>
  );
}
