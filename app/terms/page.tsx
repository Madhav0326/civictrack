import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use — CivicTrack',
  description: 'Terms and conditions governing the use of the CivicTrack civic accountability platform.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="space-y-6">
        <div className="border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold uppercase tracking-wider text-xs">Legal & Policy</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Terms of Use</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Platform Purpose & Neutrality</h2>
          <p>
            CivicTrack is a non-partisan, public civic accountability platform designed to allow citizens across India to report, track, and verify public infrastructure and civic issues. The platform operates independently of political parties and government entities.
          </p>

          <h2 className="text-lg font-semibold">2. User Responsibilities</h2>
          <p>
            Users agree to provide accurate, factual, and respectful information when submitting issue reports, comments, or evidence. Demanding bribes or reporting integrity concerns must be stated as allegations, not proven facts, pending official investigation.
          </p>

          <h2 className="text-lg font-semibold">3. Prohibited Conduct</h2>
          <p>
            Users must not submit false reports, hate speech, defamatory claims, personal attacks, or spam. Accounts violating these rules are subject to temporary suspension or permanent bans by platform moderators.
          </p>

          <h2 className="text-lg font-semibold">4. Emergency Services Notice</h2>
          <p>
            CivicTrack is not an emergency response service. For life-threatening emergencies, medical incidents, or crime in progress, please immediately dial official emergency services (112 in India).
          </p>
        </div>
      </div>
    </div>
  );
}
