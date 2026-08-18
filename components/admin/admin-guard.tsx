'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You must be signed in to access the Authority & Admin area.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login?redirect=/admin">
              <Button className="w-full">Sign in to continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthorized = profile?.role === 'admin' || profile?.role === 'moderator';

  if (!isAuthorized) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16">
        <Alert variant="destructive" className="border-2">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-base font-bold">403 Forbidden — Access Restricted</AlertTitle>
          <AlertDescription className="mt-2 text-sm leading-relaxed">
            Your account (@{profile?.username ?? 'user'}) has the <strong>{profile?.role ?? 'citizen'}</strong> role.
            Access to the CivicTrack Authority & Admin portal is restricted to authorized municipal officials, moderators, and administrators.
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Link href="/issues">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Return to Citizen Issues
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
