import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { IssueStatus, IssueSeverity } from '@/lib/types';
import { STATUS_COLORS, STATUS_DOT_COLORS, SEVERITY_COLORS } from '@/lib/constants';

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('gap-1.5 border', STATUS_COLORS[status], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_COLORS[status])} />
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </Badge>
  );
}

export function SeverityBadge({ severity, className }: { severity: IssueSeverity; className?: string }) {
  return (
    <Badge variant="outline" className={cn('border', SEVERITY_COLORS[severity], className)}>
      <span className="capitalize">{severity}</span>
    </Badge>
  );
}
