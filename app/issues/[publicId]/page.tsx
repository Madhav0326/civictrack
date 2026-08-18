import { notFound } from 'next/navigation';
import { fetchIssueByPublicId, fetchCategories, fetchStates } from '@/lib/queries';
import { IssueDetail } from '@/components/issues/issue-detail';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { publicId: string } }): Promise<Metadata> {
  const issue = await fetchIssueByPublicId(params.publicId).catch(() => null);
  if (!issue) {
    return { title: 'Issue Not Found — CivicTrack' };
  }
  const location = [issue.locality?.name, issue.city?.name, issue.state?.name].filter(Boolean).join(', ');
  return {
    title: `${issue.title} — CivicTrack`,
    description: `${issue.public_id} · ${issue.category?.name} · ${location || 'India'} · ${issue.status.replace('_', ' ')}`,
    openGraph: {
      title: issue.title,
      description: `${issue.public_id} — ${issue.description.slice(0, 200)}`,
      type: 'article',
    },
  };
}

export default async function IssueDetailPage({ params }: { params: { publicId: string } }) {
  const [issue, categories, states] = await Promise.all([
    fetchIssueByPublicId(params.publicId).catch(() => null),
    fetchCategories().catch(() => []),
    fetchStates().catch(() => []),
  ]);

  if (!issue) notFound();

  return <IssueDetail issue={issue} categories={categories} states={states} />;
}
