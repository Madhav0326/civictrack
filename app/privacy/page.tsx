import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — CivicTrack',
  description: 'How CivicTrack protects and respects your personal data and location privacy.',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="space-y-6">
        <div className="border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-6 w-6" />
            <span className="font-semibold uppercase tracking-wider text-xs">Legal & Policy</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Information We Collect</h2>
          <p>
            CivicTrack collects basic profile details (email address, full name, username, bio, avatar) and civic issue reports submitted by authenticated users.
          </p>

          <h2 className="text-lg font-semibold">2. Location Privacy Controls</h2>
          <p>
            CivicTrack respects user privacy choices regarding report locations. Users can choose between exact location coordinates, approximate neighborhood blurs (~300m), or area-only blurs (~1km) for public display.
          </p>

          <h2 className="text-lg font-semibold">3. Private Profiles</h2>
          <p>
            Users can toggle "Private Profile" in Settings to hide their public profile details and issue activity from non-authenticated visitors.
          </p>

          <h2 className="text-lg font-semibold">4. Data Protection</h2>
          <p>
            We enforce strict database Row Level Security (RLS) to ensure private user email addresses and moderation records are never exposed to unauthorized third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
