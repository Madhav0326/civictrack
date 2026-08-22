import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  const nextParam = searchParams.get('next');
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/';

  const supabase = createServerClient();

  // Preferred flow: token_hash from the custom Supabase email template
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    return NextResponse.redirect(
      new URL('/login?message=link-expired', request.url)
    );
  }

  // Fallback: support PKCE confirmation links
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    return NextResponse.redirect(
      new URL('/login?message=link-expired', request.url)
    );
  }

  return NextResponse.redirect(
    new URL('/login?message=invalid-link', request.url)
  );
}