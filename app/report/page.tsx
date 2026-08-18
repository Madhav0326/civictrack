import type { Metadata } from 'next';
import { IssueReportForm } from '@/components/issues/issue-report-form';
import { fetchCategories, fetchStates } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Report an Issue | CivicTrack',
  description: 'Report a civic issue in your community and help track its progress.',
};

export default async function ReportIssuePage() {
  const [categories, states] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);

  return <IssueReportForm categories={categories} states={states} />;
}
