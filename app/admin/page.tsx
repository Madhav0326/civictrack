import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminDashboardView } from '@/components/admin/admin-dashboard-view';
import { fetchDashboardStats, fetchCategories, fetchStates } from '@/lib/queries';

export const metadata = {
  title: 'Authority & Admin Dashboard — CivicTrack',
};

export default async function AdminDashboardPage() {
  const [stats, categories, states] = await Promise.all([
    fetchDashboardStats().catch(() => null),
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);


  return (
    <AdminGuard>
      <AdminDashboardView stats={stats} categories={categories} states={states} />
    </AdminGuard>
  );
}
