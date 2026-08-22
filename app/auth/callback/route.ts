import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'), '/');

  if (!code) {
    return NextResponse.redirect(new URL('/login?message=invalid-link', url.origin));
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?message=link-expired', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
