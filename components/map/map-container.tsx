'use client';

import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';
import type { MapIssueItem } from '@/lib/queries';

const DynamicMap = dynamic(
  () => import('./interactive-map').then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[450px] w-full flex-col items-center justify-center rounded-lg border bg-muted/20 p-8 text-center">
        <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading interactive Leaflet map...</p>
      </div>
    ),
  }
);

interface MapContainerProps {
  issues: MapIssueItem[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

export function MapContainer({ issues, centerLat, centerLng, zoom }: MapContainerProps) {
  return <DynamicMap issues={issues} centerLat={centerLat} centerLng={centerLng} zoom={zoom} />;
}
