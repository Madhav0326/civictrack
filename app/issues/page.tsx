import { Suspense } from 'react';
import { IssuesFeed } from '@/components/issues/issues-feed';
import { fetchCategories, fetchStates } from '@/lib/queries';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Issues — CivicTrack',
  description: 'Browse civic issues reported across India. Filter by location, category, status, and severity.',
  openGraph: {
    title: 'Browse Issues — CivicTrack',
    description: 'Browse civic issues reported across India.',
  },
};

export default async function IssuesPage() {
  const [categories, states] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Civic Issues</h1>
        <p className="mt-1 text-muted-foreground">
          Browse issues reported by citizens across India. Filter by location, category, and status.
        </p>
      </div>
      <Suspense fallback={<IssuesFeedSkeleton />}>
        <IssuesFeed categories={categories} states={states} />
      </Suspense>
    </div>
  );
}

function IssuesFeedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
