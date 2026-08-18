import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchProfileByUsername, fetchUserIssues } from '@/lib/queries';
import { ProfileView } from '@/components/profile/profile-view';

interface ProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await fetchProfileByUsername(params.username).catch(() => null);

  if (!profile) {
    return {
      title: 'Profile Not Found — CivicTrack',
    };
  }

  const name = profile.full_name || profile.username;
  return {
    title: `${name} (@${profile.username}) — CivicTrack`,
    description: profile.bio || `View civic issues reported by ${name} on CivicTrack.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await fetchProfileByUsername(params.username).catch(() => null);

  if (!profile) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The user @{params.username} does not exist or their profile is private.
        </p>
      </div>
    );
  }

  const issues = await fetchUserIssues(profile.id).catch(() => []);

  return <ProfileView targetProfile={profile} initialIssues={issues} />;
}
