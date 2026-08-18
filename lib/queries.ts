import { supabase } from '@/lib/supabase/client';
import type { Issue, Category, Subcategory, GeoState, GeoDistrict, GeoCity, GeoLocality, Profile } from '@/lib/types';


const ISSUE_SELECT = `
  *,
  category:categories(*),
  subcategory:subcategories(*),
  state:geo_states(*),
  district:geo_districts(*),
  city:geo_cities(*),
  locality:geo_localities(*),
  profiles:profiles(*)
`;

// Cards do not need reporter profile data. Keeping the feed projection separate
// prevents an optional profile relationship from blocking public issue discovery.
const ISSUE_LIST_SELECT = `
  *,
  category:categories(*),
  subcategory:subcategories(*),
  state:geo_states(*),
  district:geo_districts(*),
  city:geo_cities(*),
  locality:geo_localities(*)
`;

export interface IssueQueryParams {
  sort?: 'latest' | 'trending' | 'most_supported' | 'most_discussed' | 'longest_unresolved' | 'unresolved';
  status?: string;
  severity?: string;
  category_id?: number;
  subcategory_id?: number;
  state_id?: number;
  district_id?: number;
  city_id?: number;
  locality_id?: number;
  ward_id?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export async function fetchIssues(params: IssueQueryParams = {}) {
  const {
    sort = 'latest',
    status,
    severity,
    category_id,
    subcategory_id,
    state_id,
    district_id,
    city_id,
    locality_id,
    ward_id,
    search,
    page = 1,
    pageSize = 12,
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('issues')
    .select(ISSUE_LIST_SELECT, { count: 'exact' })
    .eq('is_hidden', false);

  // Apply filters
  if (status && status !== 'all') {
    if (status === 'unresolved') {
      query = query.in('status', ['reported', 'under_review', 'acknowledged', 'in_progress', 'reopened']);
    } else {
      query = query.eq('status', status);
    }
  }
  if (severity && severity !== 'all') query = query.eq('severity', severity);
  if (category_id) query = query.eq('category_id', category_id);
  if (subcategory_id) query = query.eq('subcategory_id', subcategory_id);
  if (state_id) query = query.eq('state_id', state_id);
  if (district_id) query = query.eq('district_id', district_id);
  if (city_id) query = query.eq('city_id', city_id);
  if (locality_id) query = query.eq('locality_id', locality_id);
  if (ward_id) query = query.eq('ward_id', ward_id);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,public_id.ilike.%${search}%`);
  }

  // Apply sorting
  switch (sort) {
    case 'most_supported':
      query = query.order('supporter_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'most_discussed':
      query = query.order('comment_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'longest_unresolved':
      query = query
        .in('status', ['reported', 'under_review', 'acknowledged', 'in_progress', 'reopened'])
        .order('created_at', { ascending: true });
      break;
    case 'unresolved':
      query = query
        .in('status', ['reported', 'under_review', 'acknowledged', 'in_progress', 'reopened'])
        .order('created_at', { ascending: false });
      break;
    case 'trending':
      query = query.order('supporter_count', { ascending: false }).order('comment_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'latest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    issues: (data ?? []) as Issue[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function fetchIssueByPublicId(
  publicId: string,
  options?: { includeHidden?: boolean }
): Promise<Issue | null> {
  if (!publicId) return null;
  const cleanId = publicId.trim();

  let query = supabase
    .from('issues')
    .select(ISSUE_SELECT)
    .ilike('public_id', cleanId);

  if (!options?.includeHidden) {
    query = query.eq('is_hidden', false);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.warn('[fetchIssueByPublicId] Primary join query error, executing fallback:', error.message);
    let fallbackQuery = supabase
      .from('issues')
      .select(ISSUE_LIST_SELECT)
      .ilike('public_id', cleanId);

    if (!options?.includeHidden) {
      fallbackQuery = fallbackQuery.eq('is_hidden', false);
    }

    const fallback = await fallbackQuery.maybeSingle();
    if (fallback.error) {
      console.error('[fetchIssueByPublicId] Fallback query failed:', fallback.error);
      throw fallback.error;
    }
    return fallback.data as Issue | null;
  }

  return data as Issue | null;
}


export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Category[];
}

export async function fetchSubcategories(categoryId: number): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Subcategory[];
}

export async function fetchStates(): Promise<GeoState[]> {
  const { data, error } = await supabase
    .from('geo_states')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as GeoState[];
}

export async function fetchDistricts(stateId: number): Promise<GeoDistrict[]> {
  const { data, error } = await supabase
    .from('geo_districts')
    .select('*')
    .eq('state_id', stateId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as GeoDistrict[];
}

export async function fetchCities(districtId: number): Promise<GeoCity[]> {
  const { data, error } = await supabase
    .from('geo_cities')
    .select('*')
    .eq('district_id', districtId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as GeoCity[];
}

export async function fetchLocalities(cityId: number): Promise<GeoLocality[]> {
  const { data, error } = await supabase
    .from('geo_localities')
    .select('*')
    .eq('city_id', cityId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as GeoLocality[];
}

export interface DashboardStats {
  total: number;
  resolved: number;
  inProgress: number;
  unresolved: number;
  reopened: number;
  resolutionRate: number;
  citizens: number;
  byCategory: { category_id: number; category_name: string; count: number }[];
  byStatus: { status: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
}

export async function fetchDashboardStats(filters?: {
  state_id?: number;
  district_id?: number;
  city_id?: number;
  locality_id?: number;
  category_id?: number;
}): Promise<DashboardStats> {
  const baseFilter = { is_hidden: false };
  const applyFilters = (q: any) => {
    q = q.eq('is_hidden', false);
    if (filters?.state_id) q = q.eq('state_id', filters.state_id);
    if (filters?.district_id) q = q.eq('district_id', filters.district_id);
    if (filters?.city_id) q = q.eq('city_id', filters.city_id);
    if (filters?.locality_id) q = q.eq('locality_id', filters.locality_id);
    if (filters?.category_id) q = q.eq('category_id', filters.category_id);
    return q;
  };

  const [
    { count: total },
    { count: resolved },
    { count: inProgress },
    { count: unresolved },
    { count: reopened },
    { count: citizens },
  ] = await Promise.all([
    applyFilters(supabase.from('issues').select('*', { count: 'exact', head: true })),
    applyFilters(supabase.from('issues').select('*', { count: 'exact', head: true })).eq('status', 'resolved'),
    applyFilters(supabase.from('issues').select('*', { count: 'exact', head: true })).in('status', ['in_progress', 'acknowledged', 'under_review']),
    applyFilters(supabase.from('issues').select('*', { count: 'exact', head: true })).in('status', ['reported', 'reopened']),
    applyFilters(supabase.from('issues').select('*', { count: 'exact', head: true })).eq('status', 'reopened'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', false),
  ]);

  const totalNum = total ?? 0;
  const resolvedNum = resolved ?? 0;

  // Fetch category breakdown
  let catQuery = supabase
    .from('issues')
    .select('category_id, category:categories(name)')
    .eq('is_hidden', false);
  if (filters?.state_id) catQuery = catQuery.eq('state_id', filters.state_id);
  if (filters?.district_id) catQuery = catQuery.eq('district_id', filters.district_id);
  if (filters?.city_id) catQuery = catQuery.eq('city_id', filters.city_id);
  if (filters?.locality_id) catQuery = catQuery.eq('locality_id', filters.locality_id);
  if (filters?.category_id) catQuery = catQuery.eq('category_id', filters.category_id);
  const { data: catData } = await catQuery;

  const catMap = new Map<string, { category_id: number; category_name: string; count: number }>();
  (catData ?? []).forEach((row: any) => {
    const key = row.category_id;
    const existing = catMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      catMap.set(key, {
        category_id: row.category_id,
        category_name: row.category?.name ?? 'Unknown',
        count: 1,
      });
    }
  });

  // Fetch status breakdown
  let statusQuery = supabase
    .from('issues')
    .select('status')
    .eq('is_hidden', false);
  if (filters?.state_id) statusQuery = statusQuery.eq('state_id', filters.state_id);
  if (filters?.district_id) statusQuery = statusQuery.eq('district_id', filters.district_id);
  if (filters?.city_id) statusQuery = statusQuery.eq('city_id', filters.city_id);
  if (filters?.locality_id) statusQuery = statusQuery.eq('locality_id', filters.locality_id);
  if (filters?.category_id) statusQuery = statusQuery.eq('category_id', filters.category_id);
  const { data: statusData } = await statusQuery;

  const statusMap = new Map<string, number>();
  (statusData ?? []).forEach((row: any) => {
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
  });

  // Fetch severity breakdown
  let sevQuery = supabase
    .from('issues')
    .select('severity')
    .eq('is_hidden', false);
  if (filters?.state_id) sevQuery = sevQuery.eq('state_id', filters.state_id);
  if (filters?.district_id) sevQuery = sevQuery.eq('district_id', filters.district_id);
  if (filters?.city_id) sevQuery = sevQuery.eq('city_id', filters.city_id);
  if (filters?.locality_id) sevQuery = sevQuery.eq('locality_id', filters.locality_id);
  if (filters?.category_id) sevQuery = sevQuery.eq('category_id', filters.category_id);
  const { data: sevData } = await sevQuery;

  const sevMap = new Map<string, number>();
  (sevData ?? []).forEach((row: any) => {
    sevMap.set(row.severity, (sevMap.get(row.severity) ?? 0) + 1);
  });

  return {
    total: totalNum,
    resolved: resolvedNum,
    inProgress: inProgress ?? 0,
    unresolved: unresolved ?? 0,
    reopened: reopened ?? 0,
    resolutionRate: totalNum > 0 ? (resolvedNum / totalNum) * 100 : 0,
    citizens: citizens ?? 0,
    byCategory: Array.from(catMap.values()).sort((a, b) => b.count - a.count),
    byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    bySeverity: Array.from(sevMap.entries()).map(([severity, count]) => ({ severity, count })),
  };
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function fetchUserIssues(userId: string): Promise<Issue[]> {
  const { data, error } = await supabase
    .from('issues')
    .select(ISSUE_LIST_SELECT)
    .eq('user_id', userId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Issue[];
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'username' | 'bio' | 'avatar_url' | 'is_private'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateIssue(
  issueId: string,
  updates: Partial<Pick<Issue, 'title' | 'description' | 'severity' | 'category_id' | 'subcategory_id' | 'state_id' | 'district_id' | 'city_id' | 'locality_id' | 'address' | 'pincode' | 'location_privacy' | 'date_started' | 'frequency' | 'people_affected_estimate' | 'reference_number'>>
): Promise<Issue> {
  const { data, error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', issueId)
    .select(ISSUE_SELECT)
    .single();

  if (error) throw error;
  return data as Issue;
}

export async function deleteIssue(issueId: string): Promise<boolean> {
  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', issueId);

  if (error) throw error;
  return true;
}

export async function deleteEvidence(evidenceId: string, filePath: string): Promise<boolean> {
  const { error: storageError } = await supabase.storage
    .from('issue-evidence')
    .remove([filePath]);

  if (storageError) {
    console.warn('Storage file cleanup note:', storageError.message);
  }

  const { error: dbError } = await supabase
    .from('issue_evidence')
    .delete()
    .eq('id', evidenceId);

  if (dbError) throw dbError;
  return true;
}

export async function adminUpdateIssueStatus(
  issueId: string,
  newStatus: string,
  note?: string,
  department?: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_issue_status', {
    p_issue_id: issueId,
    p_new_status: newStatus,
    p_note: note || null,
    p_department: department || null,
  });

  if (error) throw error;
}

export async function adminToggleIssueHidden(
  issueId: string,
  hide: boolean,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_toggle_issue_hidden', {
    p_issue_id: issueId,
    p_hide: hide,
    p_reason: reason || null,
  });

  if (error) throw error;
}

export async function adminAssignIssue(
  issueId: string,
  department: string,
  assigneeId?: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_assign_issue', {
    p_issue_id: issueId,
    p_department: department,
    p_assignee_id: assigneeId || null,
  });

  if (error) throw error;
}

export async function postOfficialComment(
  issueId: string,
  body: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Authentication required.');

  const { error } = await supabase
    .from('issue_comments')
    .insert({
      issue_id: issueId,
      user_id: userData.user.id,
      body: body.trim(),
      is_official: true,
    });

  if (error) throw error;
}

export async function fetchReports(): Promise<any[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAuditLogs(): Promise<any[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles!audit_logs_actor_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export interface StateBreakdown {
  id: number;
  name: string;
  code: string;
  total: number;
  resolved: number;
  inProgress: number;
  unresolved: number;
  resolutionRate: number;
}

export async function fetchStateBreakdown(): Promise<StateBreakdown[]> {
  const [statesRes, issuesRes] = await Promise.all([
    supabase.from('geo_states').select('id, name, code').order('name'),
    supabase.from('issues').select('state_id, status').eq('is_hidden', false),
  ]);

  if (statesRes.error) throw statesRes.error;
  if (issuesRes.error) throw issuesRes.error;

  const states = statesRes.data ?? [];
  const issues = issuesRes.data ?? [];

  const countsMap = new Map<number, { total: number; resolved: number; inProgress: number; unresolved: number }>();

  issues.forEach((iss) => {
    if (!iss.state_id) return;
    const curr = countsMap.get(iss.state_id) ?? { total: 0, resolved: 0, inProgress: 0, unresolved: 0 };
    curr.total++;
    if (iss.status === 'resolved') {
      curr.resolved++;
    } else if (['in_progress', 'acknowledged', 'under_review'].includes(iss.status)) {
      curr.inProgress++;
    } else {
      curr.unresolved++;
    }
    countsMap.set(iss.state_id, curr);
  });

  return states.map((st) => {
    const counts = countsMap.get(st.id) ?? { total: 0, resolved: 0, inProgress: 0, unresolved: 0 };
    const rate = counts.total > 0 ? (counts.resolved / counts.total) * 100 : 0;
    return {
      id: st.id,
      name: st.name,
      code: st.code,
      total: counts.total,
      resolved: counts.resolved,
      inProgress: counts.inProgress,
      unresolved: counts.unresolved,
      resolutionRate: Math.round(rate * 10) / 10,
    };
  });
}

export interface DistrictBreakdown {
  id: number;
  name: string;
  state_id: number;
  total: number;
  resolved: number;
  inProgress: number;
  unresolved: number;
  resolutionRate: number;
}

export async function fetchDistrictBreakdown(stateId: number): Promise<DistrictBreakdown[]> {
  const [districtsRes, issuesRes] = await Promise.all([
    supabase.from('geo_districts').select('id, name, state_id').eq('state_id', stateId).order('name'),
    supabase.from('issues').select('district_id, status').eq('state_id', stateId).eq('is_hidden', false),
  ]);

  if (districtsRes.error) throw districtsRes.error;
  if (issuesRes.error) throw issuesRes.error;

  const districts = districtsRes.data ?? [];
  const issues = issuesRes.data ?? [];

  const countsMap = new Map<number, { total: number; resolved: number; inProgress: number; unresolved: number }>();

  issues.forEach((iss) => {
    if (!iss.district_id) return;
    const curr = countsMap.get(iss.district_id) ?? { total: 0, resolved: 0, inProgress: 0, unresolved: 0 };
    curr.total++;
    if (iss.status === 'resolved') {
      curr.resolved++;
    } else if (['in_progress', 'acknowledged', 'under_review'].includes(iss.status)) {
      curr.inProgress++;
    } else {
      curr.unresolved++;
    }
    countsMap.set(iss.district_id, curr);
  });

  return districts.map((dt) => {
    const counts = countsMap.get(dt.id) ?? { total: 0, resolved: 0, inProgress: 0, unresolved: 0 };
    const rate = counts.total > 0 ? (counts.resolved / counts.total) * 100 : 0;
    return {
      id: dt.id,
      name: dt.name,
      state_id: dt.state_id,
      total: counts.total,
      resolved: counts.resolved,
      inProgress: counts.inProgress,
      unresolved: counts.unresolved,
      resolutionRate: Math.round(rate * 10) / 10,
    };
  });
}

export interface TimeTrendItem {
  month: string;
  reported: number;
  resolved: number;
}

export async function fetchTimeTrends(): Promise<TimeTrendItem[]> {
  const { data, error } = await supabase
    .from('issues')
    .select('created_at, resolved_at, status')
    .eq('is_hidden', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const monthMap = new Map<string, { month: string; reported: number; resolved: number }>();

  (data ?? []).forEach((iss) => {
    const repMonth = new Date(iss.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const repCurr = monthMap.get(repMonth) ?? { month: repMonth, reported: 0, resolved: 0 };
    repCurr.reported++;
    monthMap.set(repMonth, repCurr);

    if (iss.resolved_at) {
      const resMonth = new Date(iss.resolved_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const resCurr = monthMap.get(resMonth) ?? { month: resMonth, reported: 0, resolved: 0 };
      resCurr.resolved++;
      monthMap.set(resMonth, resCurr);
    }
  });

  return Array.from(monthMap.values());
}

export interface MapIssueItem extends Issue {

  displayLat: number;
  displayLng: number;
  privacyLabel: string;
}

function computeDisplayCoordinates(issue: Issue): { lat: number; lng: number; privacyLabel: string } | null {
  if (issue.location_privacy === 'exact' && issue.latitude != null && issue.longitude != null) {
    return { lat: issue.latitude, lng: issue.longitude, privacyLabel: 'Exact location' };
  }

  const baseLat = issue.latitude ?? issue.locality?.latitude ?? issue.city?.latitude ?? issue.district?.latitude ?? issue.state?.latitude;
  const baseLng = issue.longitude ?? issue.locality?.longitude ?? issue.city?.longitude ?? issue.district?.longitude ?? issue.state?.longitude;

  if (baseLat == null || baseLng == null) return null;

  if (issue.location_privacy === 'approximate') {
    const hash = (issue.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLat = ((hash % 17) - 8) * 0.0004;
    const offsetLng = (((hash * 13) % 17) - 8) * 0.0004;
    return { lat: baseLat + offsetLat, lng: baseLng + offsetLng, privacyLabel: 'Approximate area' };
  }

  if (issue.location_privacy === 'area_only') {
    const hash = (issue.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLat = ((hash % 11) - 5) * 0.001;
    const offsetLng = (((hash * 7) % 11) - 5) * 0.001;
    return { lat: baseLat + offsetLat, lng: baseLng + offsetLng, privacyLabel: 'Area level only' };
  }

  return { lat: baseLat, lng: baseLng, privacyLabel: 'Location' };
}

export async function fetchMapIssues(filters?: {
  state_id?: number;
  district_id?: number;
  category_id?: number;
  status?: string;
  severity?: string;
}): Promise<MapIssueItem[]> {
  let query = supabase
    .from('issues')
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      state:geo_states(*),
      district:geo_districts(*),
      city:geo_cities(*),
      locality:geo_localities(*)
    `)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (filters?.state_id) query = query.eq('state_id', filters.state_id);
  if (filters?.district_id) query = query.eq('district_id', filters.district_id);
  if (filters?.category_id) query = query.eq('category_id', filters.category_id);
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters?.severity && filters.severity !== 'all') query = query.eq('severity', filters.severity);

  const { data, error } = await query.limit(200);

  if (error) throw error;

  const results: MapIssueItem[] = [];

  (data ?? []).forEach((row: any) => {
    const coords = computeDisplayCoordinates(row as Issue);
    if (coords) {
      results.push({
        ...(row as Issue),
        displayLat: coords.lat,
        displayLng: coords.lng,
        privacyLabel: coords.privacyLabel,
      });
    }
  });

  return results;
}


export async function fetchNotifications(): Promise<any[]> {

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*, issue:issues(public_id, title), actor:profiles!notifications_actor_id_fkey(username, avatar_url)')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userData.user.id)
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}


export async function submitReport(params: {
  target_type: 'issue' | 'comment' | 'solution' | 'evidence' | 'user';
  target_id: string;
  reason: string;
  description?: string;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Authentication required to submit reports.');

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: userData.user.id,
      target_type: params.target_type,
      target_id: params.target_id,
      reason: params.reason,
      description: params.description,
      status: 'pending',
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already submitted a pending report for this item.');
    }
    throw error;
  }
}

export async function adminReviewReport(params: {
  reportId: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  actionType?: string;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_review_report', {
    p_report_id: params.reportId,
    p_status: params.status,
    p_action_type: params.actionType ?? null,
    p_notes: params.notes ?? null,
  });

  if (error) throw error;
}

export async function adminToggleCommentHidden(
  commentId: string,
  isHidden: boolean,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_toggle_comment_hidden', {
    p_comment_id: commentId,
    p_is_hidden: isHidden,
    p_reason: reason ?? null,
  });

  if (error) throw error;
}

export async function adminToggleUserBanStatus(
  targetUserId: string,
  isBanned: boolean,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_toggle_user_ban_status', {
    p_target_user_id: targetUserId,
    p_is_banned: isBanned,
    p_reason: reason ?? null,
  });

  if (error) throw error;
}

export async function adminToggleUserSuspensionStatus(
  targetUserId: string,
  isSuspended: boolean,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('admin_toggle_user_suspension_status', {
    p_target_user_id: targetUserId,
    p_is_suspended: isSuspended,
    p_reason: reason ?? null,
  });

  if (error) throw error;
}

export async function fetchModerationActions(): Promise<any[]> {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select('*, moderator:profiles!moderation_actions_moderator_id_fkey(username, avatar_url, role)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}








