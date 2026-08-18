import type { Metadata } from 'next';
import { fetchCategories, fetchStates } from '@/lib/queries';
import { PublicSearchView } from '@/components/search/public-search-view';

export const metadata: Metadata = {
  title: 'Search Civic Issues — CivicTrack',
  description: 'Search public civic issues across India by issue ID, location, category, or status.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [categories, states] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);

  return <PublicSearchView categories={categories} states={states} searchParams={searchParams} />;
}
