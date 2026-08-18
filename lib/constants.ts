import type { IssueStatus, IssueSeverity } from './types';

export const ISSUE_STATUSES: { value: IssueStatus; label: string; color: string; description: string }[] = [
  { value: 'reported', label: 'Reported', color: 'bg-slate-500', description: 'Issue submitted by a citizen.' },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-500', description: 'Platform moderators are reviewing this issue.' },
  { value: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-500', description: 'The issue has been acknowledged.' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-cyan-500', description: 'Action is reportedly being taken.' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-500', description: 'The issue has been marked as resolved.' },
  { value: 'reopened', label: 'Reopened', color: 'bg-orange-500', description: 'The issue has returned or was not fully resolved.' },
  { value: 'closed', label: 'Closed', color: 'bg-slate-400', description: 'Final administrative closure.' },
];

export const ISSUE_SEVERITIES: { value: IssueSeverity; label: string; color: string; description: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200', description: 'Minor inconvenience.' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', description: 'Affects some citizens.' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Significant disruption or public-service impact.' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200', description: 'Potential immediate safety or public welfare concern.' },
];

export const STATUS_COLORS: Record<IssueStatus, string> = {
  reported: 'bg-slate-100 text-slate-700 border-slate-200',
  under_review: 'bg-amber-100 text-amber-700 border-amber-200',
  acknowledged: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reopened: 'bg-orange-100 text-orange-700 border-orange-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const STATUS_DOT_COLORS: Record<IssueStatus, string> = {
  reported: 'bg-slate-500',
  under_review: 'bg-amber-500',
  acknowledged: 'bg-blue-500',
  in_progress: 'bg-cyan-500',
  resolved: 'bg-emerald-500',
  reopened: 'bg-orange-500',
  closed: 'bg-slate-400',
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export const REPORT_REASONS = [
  'Spam or promotional content',
  'Harassment or personal attacks',
  'Hate speech',
  'Personal data exposure (doxxing)',
  'Unverified accusation against an identifiable person',
  'Political campaigning or propaganda',
  'Explicitly false or misleading content',
  'Inappropriate or explicit content',
  'Malicious or harmful upload',
  'Other (please describe)',
];

export const PLATFORM_NAME = 'CivicTrack';
export const PLATFORM_TAGLINE = 'See the problems. Track the progress. Know what is happening in your area.';
export const PLATFORM_DESCRIPTION = 'A public platform where citizens can report government-related issues, support issues affecting their community, share evidence and solutions, and track progress toward resolution.';

export const FREQUENCY_OPTIONS = [
  'One-time incident',
  'Occasional (once in a while)',
  'Frequent (weekly)',
  'Very frequent (daily)',
  'Continuous / ongoing',
];

export function getStatusInfo(status: IssueStatus) {
  return ISSUE_STATUSES.find((s) => s.value === status) ?? ISSUE_STATUSES[0];
}

export function getSeverityInfo(severity: IssueSeverity) {
  return ISSUE_SEVERITIES.find((s) => s.value === severity) ?? ISSUE_SEVERITIES[1];
}
