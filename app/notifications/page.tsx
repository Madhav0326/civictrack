'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell, Check, CheckCheck, Loader2, MessageSquare, ShieldCheck,
  CheckCircle2, AlertCircle, ArrowLeft, Trash2, ExternalLink, Activity,
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/queries';
import { formatRelativeTime } from '@/lib/format';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You must be signed in to view your notification center.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login?redirect=/notifications">
              <Button className="w-full">Sign in to continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err: any) {
      setError(err.message ?? 'Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    setUpdating(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      setError(err.message ?? 'Failed to mark all as read.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete notification.');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_update':
      case 'followed_issue_update':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'new_comment':
      case 'comment_reply':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case 'resolution_verified':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'moderation_action':
        return <ShieldCheck className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getTargetUrl = (notif: any) => {
    const publicId = notif.issue?.public_id;
    if (!publicId) return '/issues';

    const isAuthorityRole = profile?.role === 'admin' || profile?.role === 'moderator';
    if (isAuthorityRole && (notif.type === 'resolution_verified' || notif.type === 'moderation_action')) {
      return `/admin/issues/${publicId}`;
    }
    return `/issues/${publicId}`;
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Activity updates for reported issues, status changes, and official responses.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={updating}
              className="gap-1.5 self-start sm:self-auto"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCheck className="h-4 w-4" /> Mark all read</>}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="font-medium">No notifications yet.</p>
              <p className="text-xs">Updates will appear here when your reported or followed issues receive status changes or comments.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const targetUrl = getTargetUrl(notif);

                return (
                  <div
                    key={notif.id}
                    className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                      !notif.is_read
                        ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary'
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full p-2 bg-secondary">
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{notif.title}</span>
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                          )}
                        </div>

                        {notif.body && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{notif.body}</p>
                        )}

                        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                          <span>{formatRelativeTime(notif.created_at)}</span>

                          {notif.issue?.public_id && (
                            <Link
                              href={targetUrl}
                              className="font-mono text-primary font-semibold hover:underline inline-flex items-center gap-0.5"
                              onClick={() => {
                                if (!notif.is_read) handleMarkAsRead(notif.id);
                              }}
                            >
                              {notif.issue.public_id} <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Mark as read"
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Delete notification"
                        onClick={() => handleDelete(notif.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
