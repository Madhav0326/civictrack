import type { Metadata } from 'next';
import {
  fetchDashboardStats,
  fetchStateBreakdown,
  fetchDistrictBreakdown,
  fetchCategories,
  fetchStates,
  fetchTimeTrends,
} from '@/lib/queries';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const metadata: Metadata = {
  title: 'Civic Accountability Dashboard — CivicTrack',
  description: 'National and state-level civic accountability metrics, resolution rates, and open issue breakdown across India.',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const stateIdParam = typeof searchParams.state === 'string'
    ? Number(searchParams.state)
    : typeof searchParams.state_id === 'string'
    ? Number(searchParams.state_id)
    : undefined;

  const validStateId = stateIdParam && !Number.isNaN(stateIdParam) ? stateIdParam : undefined;

  const districtIdParam = typeof searchParams.district === 'string'
    ? Number(searchParams.district)
    : typeof searchParams.district_id === 'string'
    ? Number(searchParams.district_id)
    : undefined;

  const validDistrictId = districtIdParam && !Number.isNaN(districtIdParam) ? districtIdParam : undefined;

  const [stats, stateBreakdown, categories, states, timeTrends] = await Promise.all([
    fetchDashboardStats({ state_id: validStateId, district_id: validDistrictId }).catch(() => null),
    fetchStateBreakdown().catch(() => []),
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
    fetchTimeTrends().catch(() => []),
  ]);

  const districtBreakdown = validStateId
    ? await fetchDistrictBreakdown(validStateId).catch(() => [])
    : [];

  return (
    <DashboardView
      stats={stats}
      stateBreakdown={stateBreakdown}
      districtBreakdown={districtBreakdown}
      categories={categories}
      states={states}
      selectedStateId={validStateId}
      selectedDistrictId={validDistrictId}
      timeTrends={timeTrends}
    />
  );
}
