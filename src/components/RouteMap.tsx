import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import type { Airport } from '../types/airport';

const GREAT_CIRCLE_STEPS = 80;

const interpolateGreatCircle = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): [number, number][] => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const λ1 = toRad(lng1);
  const φ2 = toRad(lat2);
  const λ2 = toRad(lng2);

  const angularDistance =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
      ),
    );

  const points: [number, number][] = [];

  for (let i = 0; i <= GREAT_CIRCLE_STEPS; i++) {
    const f = i / GREAT_CIRCLE_STEPS;

    if (angularDistance < 0.0001) {
      points.push([lat1, lng1]);
      continue;
    }

    const A = Math.sin((1 - f) * angularDistance) / Math.sin(angularDistance);
    const B = Math.sin(f * angularDistance) / Math.sin(angularDistance);

    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);

    const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
    const λ = Math.atan2(y, x);

    points.push([toDeg(φ), toDeg(λ)]);
  }

  return points;
};

const createDivIcon = (fillColor: string, glowColor: string, size = 14) =>
  L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${fillColor};
      border:2px solid ${glowColor};
      box-shadow:0 0 10px ${glowColor},0 0 22px ${glowColor}66;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

type AutoFitBoundsProps = { positions: [number, number][] };

const AutoFitBounds = ({ positions }: AutoFitBoundsProps) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) {
      return;
    }
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [36, 36], animate: true });
  }, [map, positions]);

  return null;
};

type RouteMapProps = {
  from: Airport;
  to: Airport;
  className?: string;
};

const RouteMap = ({ from, to, className }: RouteMapProps) => {
  const routePoints = interpolateGreatCircle(from.lat, from.lng, to.lat, to.lng);

  const center: [number, number] = [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const lineWeight = isMobile ? 6 : 2.5;
  const markerPx = isMobile ? 20 : 14;

  const departureIcon = createDivIcon('#ffffff', 'rgba(255,255,255,0.7)', markerPx);
  const arrivalIcon = createDivIcon('#C89B3C', 'rgba(200,155,60,0.8)', markerPx);

  return (
    <div className={`hype-air-map relative overflow-hidden rounded-xl border border-white/10 ${className ?? 'h-60'}`}>
      <style>{`
        .hype-air-map .leaflet-container { background: #060b16; }
        .hype-air-map .leaflet-control-attribution {
          background: rgba(6,8,15,0.75) !important;
          color: rgba(255,255,255,0.28) !important;
          font-size: 9px !important;
          backdrop-filter: blur(4px);
          border-radius: 4px 0 0 0;
        }
        .hype-air-map .leaflet-control-attribution a { color: rgba(200,155,60,0.55) !important; }
        .hype-air-map .leaflet-tile-pane { filter: saturate(0.55) brightness(0.85); }
      `}</style>

      <MapContainer
        center={center}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <Polyline
          positions={routePoints}
          pathOptions={{
            color: '#C89B3C',
            weight: lineWeight,
            opacity: 0.88,
            dashArray: '7 11',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        <Marker position={[from.lat, from.lng]} icon={departureIcon} />
        <Marker position={[to.lat, to.lng]} icon={arrivalIcon} />

        <AutoFitBounds positions={routePoints} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
