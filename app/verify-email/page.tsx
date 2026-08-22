'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleResend = async () => {
    if (!email) {
      setStatus({
        type: 'error',
        message: 'No email address found. Please try logging in or signing up again.',
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://civictrack-khaki.vercel.app';
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already confirmed')) {
          setStatus({
            type: 'success',
            message: 'Your email address is already verified! You can now log in.',
          });
        } else if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
          setStatus({
            type: 'error',
            message: 'Please wait a moment before requesting another verification email.',
          });
        } else {
          setStatus({
            type: 'error',
            message: error.message || 'Failed to resend verification email. Please try again.',
          });
        }
      } else {
        setStatus({
          type: 'success',
          message: `Verification link successfully resent to ${email}.`,
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription className="text-sm mt-1">
          We&apos;ve sent a verification link to your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {email && (
          <div className="rounded-lg border bg-muted/30 p-3 text-center text-sm font-medium text-foreground break-all">
            {email}
          </div>
        )}

        {status && (
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'} className={status.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300' : ''}>
            {status.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <AlertTitle>{status.type === 'success' ? 'Email Sent' : 'Notice'}</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Didn&apos;t receive the email?</p>
          <p>
            Please check your spam or junk mail folder. If you still don&apos;t see it within a few minutes, click below to resend.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleResend}
          disabled={loading || !email}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resending verification email...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Resend verification email
            </>
          )}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Proceed to Login
        </Link>
      </CardFooter>
    </Card>
  );
}

function LoaderFallback() {
  return (
    <Card className="w-full max-w-md p-8 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center justify-center px-4 py-12">
      <Suspense fallback={<LoaderFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
