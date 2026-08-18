import type { Metadata } from 'next';
import { fetchCategories, fetchStates } from '@/lib/queries';
import { MapView } from '@/components/map/map-view';

export const metadata: Metadata = {
  title: 'Public Issue Map — CivicTrack',
  description: 'Explore public civic issues geographically across India with privacy-preserving issue markers and location filters.',
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [categories, states] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);

  const stateIdParam = typeof searchParams.state === 'string'
    ? Number(searchParams.state)
    : typeof searchParams.state_id === 'string'
    ? Number(searchParams.state_id)
    : undefined;

  const districtIdParam = typeof searchParams.district === 'string'
    ? Number(searchParams.district)
    : typeof searchParams.district_id === 'string'
    ? Number(searchParams.district_id)
    : undefined;

  const categoryIdParam = typeof searchParams.category === 'string'
    ? Number(searchParams.category)
    : typeof searchParams.category_id === 'string'
    ? Number(searchParams.category_id)
    : undefined;

  return (
    <MapView
      categories={categories}
      states={states}
      initialStateId={stateIdParam && !Number.isNaN(stateIdParam) ? stateIdParam : undefined}
      initialDistrictId={districtIdParam && !Number.isNaN(districtIdParam) ? districtIdParam : undefined}
      initialCategoryId={categoryIdParam && !Number.isNaN(categoryIdParam) ? categoryIdParam : undefined}
      initialStatus={typeof searchParams.status === 'string' ? searchParams.status : 'all'}
      initialSeverity={typeof searchParams.severity === 'string' ? searchParams.severity : 'all'}
    />
  );
}
