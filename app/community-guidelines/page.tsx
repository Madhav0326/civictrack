import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines — CivicTrack',
  description: 'Standards for respectful and factual civic participation on CivicTrack.',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="space-y-6">
        <div className="border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Users className="h-6 w-6" />
            <span className="font-semibold uppercase tracking-wider text-xs">Community Standard</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Community Guidelines</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: August 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. Factual and Evidence-Based Reporting</h2>
          <p>
            Submissions should be based on real observations, with clear descriptions and optional photo or video evidence. Avoid exaggerated or unverified statements.
          </p>

          <h2 className="text-lg font-semibold">2. Respectful Communication</h2>
          <p>
            CivicTrack is built for constructive civic problem solving. Abuse, personal harassment, hate speech, or political flame wars are strictly prohibited.
          </p>

          <h2 className="text-lg font-semibold">3. Reporting Violations</h2>
          <p>
            If you encounter inappropriate comments or misleading reports, use the "Report Content" button to flag the item for moderator review.
          </p>
        </div>
      </div>
    </div>
  );
}
