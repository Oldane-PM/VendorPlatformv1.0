import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authClient } from '@/lib/auth-client';
import SignIn from '@/components/sign-in';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const errorParam = router.query.error as string | undefined;

  // Check if already authenticated and redirect
  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) {
        router.replace('/dashboard');
      } else {
        setIsPending(false);
      }
    }).catch(() => {
      setIsPending(false);
    });
  }, [router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-lg border border-border shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to the Vendor Platform
          </p>
        </div>

        {/* OAuth error from callback redirect */}
        {errorParam && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-md px-4 py-3 border border-destructive/20 mb-4">
            {errorParam === 'OAuthAccountNotLinked'
              ? 'This email is already associated with another sign-in method.'
              : 'Access is restricted to authorized Intellibus users only.'}
          </div>
        )}

        <SignIn />
      </div>
    </div>
  );
}
