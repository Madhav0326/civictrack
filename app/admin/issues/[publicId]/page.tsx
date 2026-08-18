import { notFound } from 'next/navigation';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminIssueDetailView } from '@/components/admin/admin-issue-detail-view';
import { fetchIssueByPublicId } from '@/lib/queries';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { publicId: string } }): Promise<Metadata> {
  const issue = await fetchIssueByPublicId(params.publicId, { includeHidden: true }).catch(() => null);
  if (!issue) return { title: 'Issue Not Found — Authority Portal' };
  return { title: `Manage ${issue.public_id} — Authority & Admin Portal` };
}

export default async function AdminIssueDetailPage({ params }: { params: { publicId: string } }) {
  const issue = await fetchIssueByPublicId(params.publicId, { includeHidden: true }).catch(() => null);
  if (!issue) notFound();


  return (
    <AdminGuard>
      <AdminIssueDetailView initialIssue={issue} />
    </AdminGuard>
  );
}
