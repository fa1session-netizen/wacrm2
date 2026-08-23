import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error') || searchParams.get('error_description');
  const errorCode = searchParams.get('error_code');

  if (error || errorCode) {
    const message =
      errorCode === 'otp_expired'
        ? 'Email link is invalid or has expired. Please request a new password reset link.'
        : error || 'Authentication failed.';
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (!exchangeError) {
      const isRelative = next.startsWith('/') && !next.startsWith('//');
      const targetUrl = isRelative ? next : '/dashboard';
      return NextResponse.redirect(`${origin}${targetUrl}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/forgot-password?error=${encodeURIComponent(
      'Invalid or expired auth link. Please try again.'
    )}`
  );
}
