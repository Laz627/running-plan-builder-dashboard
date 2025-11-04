'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Tabs';
import { toast } from '@/components/Toaster';

const STORAGE_KEY = 'runlift:savedRoutes:v1';
const MAPBOX_JS = 'https://api.mapbox.com/mapbox-gl-js/v2.16.1/mapbox-gl.js';
const MAPBOX_CSS = 'https://api.mapbox.com/mapbox-gl-js/v2.16.1/mapbox-gl.css';

export type LatLng = { lat: number; lng: number };
export type SavedRoute = {
  id: string;
  name: string;
  notes?: string;
  distanceMiles: number;
  waypoints: LatLng[];
  createdAt: string;
  updatedAt: string;
};

let mapboxPromise: Promise<any> | null = null;

function loadMapbox(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Mapbox unavailable on server'));
  if ((window as any).mapboxgl) return Promise.resolve((window as any).mapboxgl);
  if (!mapboxPromise) {
    mapboxPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-mapbox-gl]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve((window as any).mapboxgl));
        existingScript.addEventListener('error', reject);
      } else {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = MAPBOX_CSS;
        link.dataset.mapboxGlCss = 'true';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = MAPBOX_JS;
        script.async = true;
        script.dataset.mapboxGl = 'true';
        script.onload = () => resolve((window as any).mapboxgl);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      }
    });
  }
  return mapboxPromise;
}

function toRad(v: number) { return (v * Math.PI) / 180; }
function haversineMiles(a: LatLng, b: LatLng) {
  const R = 3958.8; // earth radius in miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function computeDistance(points: LatLng[]) {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMiles(points[i - 1], points[i]);
  }
  return total;
}

function formatDistance(mi: number) {
  if (!Number.isFinite(mi)) return '0.00';
  return mi.toFixed(2);
}

function featureCollection(points: LatLng[]) {
  if (!points.length) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points.map((p) => [p.lng, p.lat]),
        },
        properties: {},
      },
    ],
  };
}

function ensureMapboxToken(token?: string) {
  return (token ?? '').trim().length > 0;
}

type EditableMapProps = {
  token?: string;
  points: LatLng[];
  onChange: (pts: LatLng[]) => void;
};

function EditableMap({ token, points, onChange }: EditableMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapboxRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pointsRef = useRef<LatLng[]>(points);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { pointsRef.current = points; }, [points]);

  useEffect(() => {
    if (!ensureMapboxToken(token) || !containerRef.current) return;
    let disposed = false;
    loadMapbox()
      .then((mapbox) => {
        if (disposed || !containerRef.current) return;
        mapboxRef.current = mapbox;
        mapbox.accessToken = token;
        const start = points[0] ? [points[0].lng, points[0].lat] : [-122.4194, 37.7749];
        const map = new mapbox.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: start,
          zoom: points.length ? 13 : 11,
        });
        map.addControl(new mapbox.NavigationControl(), 'top-right');
        map.on('load', () => {
          map.addSource('route-line', {
            type: 'geojson',
            data: featureCollection(pointsRef.current),
          });
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route-line',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#2563eb', 'line-width': 4 },
          });
          mapRef.current = map;
          updateMap(pointsRef.current);
        });
        map.on('click', (ev: any) => {
          const next = [...pointsRef.current, { lng: ev.lngLat.lng, lat: ev.lngLat.lat }];
          pointsRef.current = next;
          updateMap(next);
          onChange(next);
        });
      })
      .catch(() => setError('Map could not load. Check your connection.'));
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    updateMap(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const updateMap = useCallback((pts: LatLng[]) => {
    if (!mapRef.current || !mapboxRef.current) return;
    const map = mapRef.current;
    const mapbox = mapboxRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = pts.map((pt, idx) => {
      const color = idx === 0 ? '#16a34a' : idx === pts.length - 1 ? '#f97316' : '#2563eb';
      return new mapbox.Marker({ color }).setLngLat([pt.lng, pt.lat]).addTo(map);
    });

    const source = map.getSource('route-line');
    if (source) {
      (source as any).setData(featureCollection(pts));
    }

    if (pts.length >= 2) {
      const bounds = pts.reduce((b, pt) => {
        if (!b) return new mapbox.LngLatBounds([pt.lng, pt.lat], [pt.lng, pt.lat]);
        return b.extend([pt.lng, pt.lat]);
      }, null as any);
      if (bounds) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 0 });
      }
    }
  }, []);

  if (!ensureMapboxToken(token)) {
    return (
      <div className="h-72 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-sm text-gray-500">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the route builder map.
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-72 rounded-xl border border-dashed border-red-300 flex items-center justify-center text-sm text-red-500">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className="h-72 rounded-xl overflow-hidden" />;
}

type StaticMapProps = {
  token?: string;
  points: LatLng[];
};

function StaticMap({ token, points }: StaticMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapboxRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ensureMapboxToken(token) || !containerRef.current) return;
    let disposed = false;
    loadMapbox()
      .then((mapbox) => {
        if (disposed || !containerRef.current) return;
        mapboxRef.current = mapbox;
        mapbox.accessToken = token;
        const start = points[0] ? [points[0].lng, points[0].lat] : [-122.4194, 37.7749];
        const map = new mapbox.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: start,
          zoom: points.length ? 13 : 11,
          interactive: true,
        });
        map.addControl(new mapbox.NavigationControl(), 'top-right');
        map.on('load', () => {
          map.addSource('route-line', {
            type: 'geojson',
            data: featureCollection(points),
          });
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route-line',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#2563eb', 'line-width': 4 },
          });
          markersRef.current = points.map((pt, idx) => {
            const color = idx === 0 ? '#16a34a' : idx === points.length - 1 ? '#f97316' : '#2563eb';
            return new mapbox.Marker({ color }).setLngLat([pt.lng, pt.lat]).addTo(map);
          });
          if (points.length >= 2) {
            const bounds = points.reduce((b, pt) => {
              if (!b) return new mapbox.LngLatBounds([pt.lng, pt.lat], [pt.lng, pt.lat]);
              return b.extend([pt.lng, pt.lat]);
            }, null as any);
            if (bounds) map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 0 });
          }
        });
        mapRef.current = map;
      })
      .catch(() => setError('Map preview unavailable.'));
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [token, points]);

  if (!ensureMapboxToken(token)) {
    return (
      <div className="h-56 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-sm text-gray-500">
        Provide a Mapbox token to preview this route.
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-56 rounded-xl border border-dashed border-red-300 flex items-center justify-center text-sm text-red-500">
        {error}
      </div>
    );
  }
  return <div ref={containerRef} className="h-56 rounded-xl overflow-hidden" />;
}

type RouteDetailProps = {
  route: SavedRoute;
  token?: string;
  onUpdate: (route: SavedRoute) => void;
  onDelete: (id: string) => void;
  onLoad: (route: SavedRoute) => void;
  isActive: boolean;
};

function RouteDetail({ route, token, onUpdate, onDelete, onLoad, isActive }: RouteDetailProps) {
  const [name, setName] = useState(route.name);
  const [notes, setNotes] = useState(route.notes ?? '');

  useEffect(() => { setName(route.name); setNotes(route.notes ?? ''); }, [route.id, route.name, route.notes]);

  const hasChanges = name.trim() !== route.name || (notes ?? '').trim() !== (route.notes ?? '');

  function saveChanges() {
    const updated: SavedRoute = {
      ...route,
      name: name.trim() || 'Untitled route',
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    toast({ title: 'Route updated', description: `${updated.name} saved.` });
  }

  function deleteRoute() {
    onDelete(route.id);
    toast({ title: 'Route removed', description: `${route.name} deleted.` });
  }

  return (
    <div className="space-y-4">
      <StaticMap token={token} points={route.waypoints} />
      <div className="grid gap-3">
        <label className="text-sm">
          Route name
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm">
          Notes
          <textarea className="input mt-1 min-h-[96px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Distance: <strong>{formatDistance(route.distanceMiles)}</strong> mi
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => onLoad(route)}>
          {isActive ? 'Route loaded' : 'Load into Run Log'}
        </button>
        <button className="btn" onClick={saveChanges} disabled={!hasChanges}>
          Save changes
        </button>
        <button className="btn" onClick={deleteRoute}>
          Delete
        </button>
      </div>
    </div>
  );
}

type RouteManagerProps = {
  token?: string;
  onRouteLoad?: (route: SavedRoute) => void;
  onRouteClear?: () => void;
  activeRouteId?: string | null;
};

export default function RouteManager({ token, onRouteLoad, onRouteClear, activeRouteId }: RouteManagerProps) {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [activeTab, setActiveTab] = useState<string>('create');
  const [draftName, setDraftName] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftPoints, setDraftPoints] = useState<LatLng[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedRoute[];
        if (Array.isArray(parsed)) setSavedRoutes(parsed);
      }
    } catch (err) {
      console.error('Could not read saved routes', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes));
    } catch (err) {
      console.error('Could not persist routes', err);
    }
  }, [savedRoutes]);

  const sortedRoutes = useMemo(() => {
    return [...savedRoutes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [savedRoutes]);

  useEffect(() => {
    if (sortedRoutes.length && activeTab === 'create') {
      setActiveTab(sortedRoutes[0].id);
    }
  }, [sortedRoutes, activeTab]);

  function saveDraft() {
    const distanceMiles = computeDistance(draftPoints);
    const route: SavedRoute = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `route-${Date.now()}`,
      name: draftName.trim() || 'Untitled route',
      notes: draftNotes.trim(),
      distanceMiles,
      waypoints: draftPoints.map((pt) => ({ ...pt })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedRoutes((prev) => [route, ...prev]);
    setDraftName('');
    setDraftNotes('');
    setDraftPoints([]);
    setActiveTab(route.id);
    toast({ title: 'Route saved', description: `${route.name} stored on this device.` });
  }

  function updateRoute(updated: SavedRoute) {
    setSavedRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function deleteRoute(id: string) {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
    if (activeRouteId === id && onRouteClear) {
      onRouteClear();
    }
    if (activeTab === id) {
      setActiveTab('create');
    }
  }

  function handleLoad(route: SavedRoute) {
    onRouteLoad?.(route);
  }

  const hasDraft = draftPoints.length >= 2 && draftName.trim().length > 0;
  const draftDistance = computeDistance(draftPoints);

  return (
    <Card title="Route Builder" subtitle="Plot a path and reuse it for future runs">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col lg:flex-row gap-4">
          <TabsList className="flex lg:flex-col flex-wrap lg:flex-nowrap lg:w-60">
            <TabsTrigger value="create" className="w-full justify-between">
              <span>New route</span>
              <span className="text-xs text-gray-500">{draftPoints.length} pts</span>
            </TabsTrigger>
            {sortedRoutes.map((route) => (
              <TabsTrigger
                key={route.id}
                value={route.id}
                className="w-full justify-between"
              >
                <span>{route.name}</span>
                <span className="text-xs text-gray-500">{formatDistance(route.distanceMiles)} mi{activeRouteId === route.id ? ' • active' : ''}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1 min-w-0">
            <TabsContent value="create" className="mt-0 space-y-4">
              <EditableMap token={token} points={draftPoints} onChange={setDraftPoints} />
              <div className="grid gap-3">
                <label className="text-sm">
                  Route name
                  <input className="input mt-1" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Neighborhood loop" />
                </label>
                <label className="text-sm">
                  Notes
                  <textarea className="input mt-1 min-h-[96px]" value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} placeholder="Surface, lighting, water fountains…" />
                </label>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>Distance: <strong>{formatDistance(draftDistance)}</strong> mi</span>
                  <span>Points: {draftPoints.length}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={saveDraft} disabled={!hasDraft}>
                  Save route
                </button>
                <button className="btn" onClick={() => setDraftPoints((pts) => pts.slice(0, -1))} disabled={draftPoints.length === 0}>
                  Undo last point
                </button>
                <button className="btn" onClick={() => setDraftPoints([])} disabled={draftPoints.length === 0}>
                  Clear points
                </button>
              </div>
            </TabsContent>
            {sortedRoutes.map((route) => (
              <TabsContent key={route.id} value={route.id} className="mt-0">
                <RouteDetail
                  route={route}
                  token={token}
                  onUpdate={updateRoute}
                  onDelete={deleteRoute}
                  onLoad={handleLoad}
                  isActive={activeRouteId === route.id}
                />
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </Card>
  );
}
