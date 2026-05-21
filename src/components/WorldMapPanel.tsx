import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RouteMap from './RouteMap';
import type { Airport } from '../types/airport';

type MapMode = 'globe' | 'map';

type WorldMapPanelProps = {
  from: Airport;
  to: Airport;
  distanceKm: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  visible: boolean;
};

const MAP_WIDTH = 960;
const MAP_HEIGHT = 460;
const GLOBE_RADIUS = 180;
const CENTER_X = MAP_WIDTH / 2;
const CENTER_Y = MAP_HEIGHT / 2;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const midpointLongitude = (startLng: number, endLng: number): number => {
  const rawDiff = ((endLng - startLng + 540) % 360) - 180;
  return startLng + rawDiff / 2;
};

const projectOrthographic = (
  latDeg: number,
  lngDeg: number,
  centerLatDeg: number,
  centerLngDeg: number
): ProjectedPoint => {
  const lat = toRadians(latDeg);
  const lng = toRadians(lngDeg);
  const centerLat = toRadians(centerLatDeg);
  const centerLng = toRadians(centerLngDeg);
  const lngDiff = lng - centerLng;

  const cosC =
    Math.sin(centerLat) * Math.sin(lat) +
    Math.cos(centerLat) * Math.cos(lat) * Math.cos(lngDiff);

  const x = CENTER_X + GLOBE_RADIUS * Math.cos(lat) * Math.sin(lngDiff);
  const y =
    CENTER_Y +
    GLOBE_RADIUS *
      (Math.cos(centerLat) * Math.sin(lat) -
        Math.sin(centerLat) * Math.cos(lat) * Math.cos(lngDiff));

  return {
    x,
    y,
    visible: cosC >= 0,
  };
};

const clampToGlobe = ({ x, y }: Pick<ProjectedPoint, 'x' | 'y'>): Pick<ProjectedPoint, 'x' | 'y'> => {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= GLOBE_RADIUS) {
    return { x, y };
  }

  const scale = GLOBE_RADIUS / distance;
  return {
    x: CENTER_X + dx * scale,
    y: CENTER_Y + dy * scale,
  };
};

const routePath = (from: Pick<ProjectedPoint, 'x' | 'y'>, to: Pick<ProjectedPoint, 'x' | 'y'>): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const arcHeight = Math.max(26, Math.min(88, Math.abs(dx) * 0.16 + Math.abs(dy) * 0.08));
  const controlX = from.x + dx * 0.5;
  const controlY = Math.min(from.y, to.y) - arcHeight;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
};

const buildLatitudePath = (latDeg: number, centerLat: number, centerLng: number): string => {
  const points: string[] = [];
  for (let lng = -180; lng <= 180; lng += 4) {
    const projected = projectOrthographic(latDeg, lng, centerLat, centerLng);
    if (!projected.visible) {
      continue;
    }
    points.push(`${projected.x},${projected.y}`);
  }
  return points.length > 1 ? `M ${points.join(' L ')}` : '';
};

const buildLongitudePath = (lngDeg: number, centerLat: number, centerLng: number): string => {
  const points: string[] = [];
  for (let lat = -85; lat <= 85; lat += 3) {
    const projected = projectOrthographic(lat, lngDeg, centerLat, centerLng);
    if (!projected.visible) {
      continue;
    }
    points.push(`${projected.x},${projected.y}`);
  }
  return points.length > 1 ? `M ${points.join(' L ')}` : '';
};

const WorldMapPanel = ({ from, to, distanceKm }: WorldMapPanelProps) => {
  const [mode, setMode] = useState<MapMode>(() => {
    const saved = localStorage.getItem('hype-route-view');
    return saved === 'globe' || saved === 'map' ? saved : 'map';
  });

  useEffect(() => {
    localStorage.setItem('hype-route-view', mode);
  }, [mode]);

  const centerLat = (from.lat + to.lat) / 2;
  const centerLng = midpointLongitude(from.lng, to.lng);

  const projectedFromRaw = projectOrthographic(from.lat, from.lng, centerLat, centerLng);
  const projectedToRaw = projectOrthographic(to.lat, to.lng, centerLat, centerLng);

  const projectedFrom = projectedFromRaw.visible ? projectedFromRaw : clampToGlobe(projectedFromRaw);
  const projectedTo = projectedToRaw.visible ? projectedToRaw : clampToGlobe(projectedToRaw);

  const pathD = routePath(projectedFrom, projectedTo);
  const pathId = `route-motion-path-${from.iata.toLowerCase()}-${to.iata.toLowerCase()}`;

  const latitudePaths = [-60, -30, 0, 30, 60]
    .map((latDeg) => buildLatitudePath(latDeg, centerLat, centerLng))
    .filter(Boolean);
  const longitudePaths = [-120, -60, 0, 60, 120]
    .map((lngDeg) => buildLongitudePath(lngDeg, centerLat, centerLng))
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-gold/25 bg-zinc-950/70 p-4 sm:p-5">
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-gold/30 bg-zinc-950/60 p-1">
        {(['globe', 'map'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-sm font-semibold tracking-wider uppercase transition ${
              mode === m
                ? 'border border-gold/50 bg-gold/20 text-champagne shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {m === 'globe' ? 'Globe' : 'Map'}
          </button>
        ))}
      </div>

      {mode === 'map' && <RouteMap from={from} to={to} className="h-80 sm:h-60" />}

      {mode === 'globe' && (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#060b16]">
        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg border border-gold/40 bg-zinc-950/70 px-3 py-1 text-sm text-champagne">
          {Math.round(distanceKm)} km
        </div>

        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="h-[480px] w-full sm:h-[600px]"
          role="img"
          aria-label={`Globe route from ${from.iata} to ${to.iata}`}
        >
          <defs>
            <linearGradient id="route-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="55%" stopColor="rgba(244,213,141,0.95)" />
              <stop offset="100%" stopColor="rgba(200,155,60,0.95)" />
            </linearGradient>
            <radialGradient id="globe-fill" cx="50%" cy="45%" r="58%">
              <stop offset="0%" stopColor="rgba(66,88,141,0.55)" />
              <stop offset="70%" stopColor="rgba(28,41,72,0.58)" />
              <stop offset="100%" stopColor="rgba(9,14,28,0.9)" />
            </radialGradient>
            <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            fill="url(#route-gradient)"
            opacity="0.06"
          />

          <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} fill="url(#globe-fill)" />
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={GLOBE_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth="1.2"
          />

          <g stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none">
            {latitudePaths.map((path, index) => (
              <path key={`lat-${index}`} d={path} />
            ))}
            {longitudePaths.map((path, index) => (
              <path key={`lng-${index}`} d={path} />
            ))}
          </g>

          <path d={pathD} fill="none" stroke="url(#route-gradient)" strokeWidth="2.5" strokeLinecap="round" />

          <motion.path
            d={pathD}
            fill="none"
            stroke="rgba(244,213,141,0.95)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="8 14"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          <motion.text
            fontSize="18"
            fill="#f4d58d"
            filter="url(#gold-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#${pathId}`} />
            </animateMotion>
            ✈
          </motion.text>

          <path id={pathId} d={pathD} fill="none" stroke="transparent" strokeWidth="1" />

          <motion.circle
            cx={projectedFrom.x}
            cy={projectedFrom.y}
            r="6"
            fill="#ffffff"
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <motion.circle
            cx={projectedTo.x}
            cy={projectedTo.y}
            r="6"
            fill="#c89b3c"
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.35 }}
          />

          <text x={projectedFrom.x + 10} y={projectedFrom.y - 10} fontSize="12" fill="rgba(255,255,255,0.92)">
            {from.iata}
          </text>
          <text x={projectedTo.x + 10} y={projectedTo.y - 10} fontSize="12" fill="rgba(244,213,141,0.98)">
            {to.iata}
          </text>
        </svg>
      </div>
      )}
    </div>
  );
};

export default WorldMapPanel;
