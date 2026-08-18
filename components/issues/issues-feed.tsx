'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { IssueCard } from '@/components/issues/issue-card';
import { IssueFeedFilters } from '@/components/issues/issue-filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSearch, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Issue, Category, GeoState } from '@/lib/types';
import { fetchIssues } from '@/lib/queries';

type SortOption = 'latest' | 'trending' | 'most_supported' | 'most_discussed' | 'unresolved' | 'longest_unresolved';

export function IssuesFeed({ categories, states }: { categories: Category[]; states: GeoState[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const sort = (searchParams.get('sort') ?? 'latest') as SortOption;
  const status = searchParams.get('status') ?? 'all';
  const severity = searchParams.get('severity') ?? 'all';
  const categoryId = searchParams.get('category') ? parseInt(searchParams.get('category')!, 10) : undefined;
  const stateId = searchParams.get('state') ? parseInt(searchParams.get('state')!, 10) : undefined;
  const search = searchParams.get('q') ?? undefined;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIssues({
        sort,
        status,
        severity,
        category_id: categoryId,
        state_id: stateId,
        search,
        page,
        pageSize: 12,
      });
      setIssues(result.issues);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [sort, status, severity, categoryId, stateId, search, page]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (updates.page === undefined && Object.keys(updates).length > 0) {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <IssueFeedFilters
        categories={categories}
        states={states}
        currentSort={sort}
        currentStatus={status}
        currentSeverity={severity}
        currentCategory={categoryId}
        currentState={stateId}
        currentSearch={search}
        onFilterChange={updateParams}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadIssues}>
            Try again
          </Button>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-secondary/20 py-16 text-center">
          <FileSearch className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No issues found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search || status !== 'all' || severity !== 'all' || categoryId || stateId
              ? 'No issues match your current filters. Try adjusting them.'
              : 'No issues have been reported yet. Be one of the first to report an issue in your area.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {issues.length} of {total.toLocaleString('en-IN')} issue{total !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
