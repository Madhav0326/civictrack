export type IssueStatus = 'reported' | 'under_review' | 'acknowledged' | 'in_progress' | 'resolved' | 'reopened' | 'closed';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LocationPrivacy = 'exact' | 'approximate' | 'area_only';
export type EvidenceType = 'image' | 'video' | 'document';
export type UserRole = 'citizen' | 'moderator' | 'admin';
export type NotificationType =
  | 'status_update' | 'new_comment' | 'issue_reopened' | 'resolution_verified'
  | 'moderation_action' | 'followed_issue_update' | 'new_follower'
  | 'solution_posted' | 'comment_reply' | 'platform' | 'issue_supported';
export type ReportTargetType = 'issue' | 'comment' | 'solution' | 'evidence' | 'user';
export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  sort_order: number;
  is_sensitive: boolean;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface GeoState {
  id: number;
  code: string;
  name: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GeoDistrict {
  id: number;
  state_id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GeoCity {
  id: number;
  district_id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GeoLocality {
  id: number;
  ward_id: number | null;
  city_id: number | null;
  name: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Issue {
  id: string;
  public_id: string;
  user_id: string;
  category_id: number;
  subcategory_id: number | null;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  state_id: number | null;
  district_id: number | null;
  city_id: number | null;
  ward_id: number | null;
  locality_id: number | null;
  address: string | null;
  custom_city?: string | null;
  custom_locality?: string | null;
  latitude: number | null;
  longitude: number | null;
  pincode: string | null;
  location_privacy: LocationPrivacy;
  date_started: string | null;
  frequency: string | null;
  people_affected_estimate: number | null;
  reference_number: string | null;
  is_sensitive: boolean;
  is_hidden: boolean;
  supporter_count: number;
  comment_count: number;
  solution_count: number;
  follower_count: number;
  resolved_at: string | null;
  department_name?: string | null;
  assigned_to?: string | null;
  edit_count?: number;
  created_at: string;


  updated_at: string;
  category?: Category;
  subcategory?: Subcategory;
  state?: GeoState;
  district?: GeoDistrict;
  city?: GeoCity;
  locality?: GeoLocality;
  profiles?: Profile;
  issue_evidence?: IssueEvidence[];
}

export interface IssueEvidence {
  id: string;
  issue_id: string;
  user_id: string;
  file_path: string;
  file_type: EvidenceType;
  file_name: string | null;
  file_size: number | null;
  caption: string | null;
  created_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_hidden: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface IssueSolution {
  id: string;
  issue_id: string;
  user_id: string;
  title: string;
  description: string;
  vote_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  user_vote?: boolean;
}

export interface IssueSupporter {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
  profiles?: Profile;
}

export interface IssueFollower {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface ResolutionVerification {
  id: string;
  issue_id: string;
  user_id: string;
  is_resolved: boolean;
  comment: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface IssueStatusHistory {
  id: string;
  issue_id: string;
  user_id: string | null;
  old_status: IssueStatus | null;
  new_status: IssueStatus;
  note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  issue_id: string | null;
  comment_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  action_type: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string | null;
  notes: string | null;
  report_id: string | null;
  created_at: string;
}
