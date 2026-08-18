import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moderation Policy — CivicTrack',
  description: 'How CivicTrack handles content reporting, content hiding, and account enforcement.',
};

export default function ModerationPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="space-y-6">
        <div className="border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-semibold uppercase tracking-wider text-xs">Governance</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Moderation Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Neutral Moderation</h2>
          <p>
            Moderators and administrators handle reports without political bias, evaluating items strictly against community guidelines and factual verification standards.
          </p>

          <h2 className="text-lg font-semibold">2. Content Hiding & Review</h2>
          <p>
            Reported content flagged for severe violations can be hidden by moderators. Content owners receive notifications regarding moderation actions taken.
          </p>

          <h2 className="text-lg font-semibold">3. Account Suspension & Banning</h2>
          <p>
            Accounts engaging in repeated spam, abusive conduct, or fraudulent reports may be temporarily suspended or permanently banned by platform administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
