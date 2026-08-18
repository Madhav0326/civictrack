import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminIssuesListView } from '@/components/admin/admin-issues-list-view';
import { fetchCategories, fetchStates } from '@/lib/queries';

export const metadata = {
  title: 'Issue Management — Authority & Admin Portal',
};

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [categories, states] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);

  return (
    <AdminGuard>
      <AdminIssuesListView categories={categories} states={states} searchParams={searchParams} />
    </AdminGuard>
  );
}
