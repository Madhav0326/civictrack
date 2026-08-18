import Link from 'next/link';
import { MapPin, Users, MessageSquare, Lightbulb, Paperclip, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { StatusBadge, SeverityBadge } from '@/components/issues/status-badges';
import type { Issue } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';

export function IssueCard({ issue }: { issue: Issue }) {
  const location = [issue.locality?.name, issue.city?.name, issue.district?.name, issue.state?.name]
    .filter(Boolean)
    .join(', ');


  const evidenceCount = (issue as any).evidence_count ?? issue.issue_evidence?.length ?? 0;
  const hasEvidence = evidenceCount > 0;

  return (
    <Link href={`/issues/${issue.public_id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="font-medium text-primary">{issue.public_id}</span>
            <span>·</span>
            <span className="capitalize">{issue.category?.name}</span>
            {issue.subcategory && (
              <>
                <span>·</span>
                <span className="capitalize">{issue.subcategory.name}</span>
              </>
            )}
          </div>

          <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {issue.title}
          </h3>

          {location && (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
        </CardContent>

        <CardFooter className="border-t border-border bg-secondary/20 px-4 py-2.5">
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" title="People affected">
                <Users className="h-3.5 w-3.5" />
                {issue.supporter_count}
              </span>
              <span className="flex items-center gap-1" title="Comments">
                <MessageSquare className="h-3.5 w-3.5" />
                {issue.comment_count}
              </span>
              <span className="flex items-center gap-1" title="Solutions">
                <Lightbulb className="h-3.5 w-3.5" />
                {issue.solution_count}
              </span>
              {hasEvidence && (
                <span className="flex items-center gap-1" title="Evidence">
                  <Paperclip className="h-3.5 w-3.5" />
                  {evidenceCount}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeTime(issue.created_at)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
