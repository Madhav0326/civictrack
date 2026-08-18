import { CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/issues/status-badges';
import { formatDateTime } from '@/lib/format';
import type { IssueStatus, IssueStatusHistory } from '@/lib/types';

export function IssueTimeline({ history, loading, currentStatus }: { history: IssueStatusHistory[]; loading: boolean; currentStatus: IssueStatus }) {
  if (loading) return <div className="space-y-4 py-5">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>;
  if (!history.length) return <div className="py-8 text-center text-sm text-muted-foreground"><Clock className="mx-auto mb-2 h-5 w-5" />This issue is currently <span className="font-medium">{currentStatus.replace('_', ' ')}</span>. No status changes have been recorded yet.</div>;
  return <div className="space-y-0 py-4">{history.map((entry, index) => <div key={entry.id} className="relative flex gap-3 pb-6 last:pb-0"><div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-4 w-4" /></div>{index < history.length - 1 && <div className="absolute left-3.5 top-7 h-[calc(100%-1.75rem)] w-px bg-border" />}<div className="min-w-0 pt-0.5"><StatusBadge status={entry.new_status} /><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>{entry.note && <p className="mt-2 text-sm">{entry.note}</p>}</div></div>)}</div>;
}
