'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StatusBadge, SeverityBadge } from '@/components/issues/status-badges';
import { formatRelativeTime } from '@/lib/format';
import type { MapIssueItem } from '@/lib/queries';

interface InteractiveMapProps {
  issues: MapIssueItem[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

function getMarkerColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#3b82f6';
    default: return '#6b7280';
  }
}

function createCustomPin(severity: string) {
  const color = getMarkerColor(severity);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff" />
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export function InteractiveMap({ issues, centerLat = 20.5937, centerLng = 78.9629, zoom = 5 }: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers & Bounds when issues change
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (issues.length === 0) return;

    const bounds = L.latLngBounds([]);

    issues.forEach((issue) => {
      if (typeof issue.displayLat !== 'number' || typeof issue.displayLng !== 'number') return;

      const latLng: [number, number] = [issue.displayLat, issue.displayLng];
      bounds.extend(latLng);

      const icon = createCustomPin(issue.severity);
      const marker = L.marker(latLng, { icon });

      const locationStr = [issue.locality?.name, issue.city?.name, issue.district?.name, issue.state?.name]
        .filter(Boolean)
        .join(', ');

      const popupHtml = `
        <div style="min-width: 220px; font-family: inherit; font-size: 13px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-family: monospace; font-weight: 700; font-size: 11px; color: #2563eb;">${issue.public_id}</span>
            <span style="font-size: 11px; color: #6b7280;">${issue.privacyLabel}</span>
          </div>
          <h4 style="margin: 0 0 6px 0; font-weight: 700; font-size: 14px; line-height: 1.3; color: #111827;">
            ${issue.title}
          </h4>
          <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px; text-transform: capitalize; font-weight: 600;">
              ${issue.category?.name ?? 'Category'}
            </span>
            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: capitalize;">
              ${issue.status.replace('_', ' ')}
            </span>
          </div>
          ${locationStr ? `<p style="margin: 0 0 6px 0; font-size: 11px; color: #4b5563;">📍 ${locationStr}</p>` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 10px; color: #9ca3af;">${formatRelativeTime(issue.created_at)}</span>
            <a href="/issues/${issue.public_id}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              View Details &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersGroup.addLayer(marker);
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [issues]);

  return <div ref={containerRef} className="h-full w-full rounded-lg z-0" />;
}
