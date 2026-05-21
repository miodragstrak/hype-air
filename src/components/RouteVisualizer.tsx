import { motion } from 'framer-motion';

type RouteVisualizerProps = {
  fromCode: string;
  toCode: string;
  distanceKm: number;
  durationHours: number;
};

const formatDuration = (hours: number) => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const RouteVisualizer = ({ fromCode, toCode, distanceKm, durationHours }: RouteVisualizerProps) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/35 bg-[#03060f] p-4 shadow-glow sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(244,213,141,0.18),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(255,255,255,0.16),transparent_20%),linear-gradient(180deg,rgba(16,24,48,0.92)_0%,rgba(5,9,18,0.95)_50%,rgba(3,6,12,1)_100%)]" />

      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        animate={{ backgroundPositionX: ['0%', '100%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 90px)',
        }}
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-widest text-zinc-300 uppercase">
            Flight Calculator
          </p>
          <p className="rounded-full border border-gold/45 bg-gold/10 px-3 py-1 text-[11px] tracking-wider text-champagne uppercase">
            Great-circle distance
          </p>
        </div>

        <div className="text-center">
          <p className="font-display text-xl tracking-normal text-champagne sm:text-2xl lg:text-3xl">
            {fromCode} ✈ {toCode}
          </p>
          <p className="mt-2 text-[10px] tracking-wider text-zinc-400 uppercase">Great-circle distance</p>

          <div className="mt-2 flex items-end justify-center gap-3">
            <motion.span
              key={`${fromCode}-${toCode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="font-display text-7xl leading-none text-champagne sm:text-8xl"
            >
              {Math.round(distanceKm)}
            </motion.span>
            <span className="mb-2 text-base font-semibold tracking-wider text-gold uppercase">KM</span>
          </div>

          <p className="mt-4 text-sm text-zinc-300">Estimated duration</p>
          <p className="mt-1 font-display text-3xl text-white">{formatDuration(durationHours)}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/15 bg-white/5 p-2 sm:p-3">
            <p className="text-[9px] tracking-wider text-zinc-400 uppercase sm:text-[10px]">Altitude</p>
            <p className="mt-1 text-base font-semibold text-white sm:text-lg">39,000 ft</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-2 sm:p-3">
            <p className="text-[9px] tracking-wider text-zinc-400 uppercase sm:text-[10px]">Cruise</p>
            <p className="mt-1 text-base font-semibold text-white sm:text-lg">800 km/h</p>
          </div>
          <div className="rounded-xl border border-gold/35 bg-gold/10 p-2 sm:p-3">
            <p className="text-[9px] tracking-wider text-zinc-300 uppercase sm:text-[10px]">ETA</p>
            <p className="mt-1 text-base font-semibold text-champagne sm:text-lg">{formatDuration(durationHours)}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RouteVisualizer;
