import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AirportSearch from './components/AirportSearch';
import RouteVisualizer from './components/RouteVisualizer';
import WorldMapPanel from './components/WorldMapPanel';
import { calculateHaversineDistance, estimateFlightDurationHours } from './utils/haversine';
import { loadAirports } from './utils/loadAirports';
import type { Airport } from './types/airport';

const App = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [fromAirport, setFromAirport] = useState<Airport | undefined>(undefined);
  const [toAirport, setToAirport] = useState<Airport | undefined>(undefined);
  const [isLoadingAirports, setIsLoadingAirports] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const initAirports = async () => {
      try {
        setIsLoadingAirports(true);
        const loadedAirports = await loadAirports();
        setAirports(loadedAirports);

        const defaultFrom = loadedAirports.find((airport) => airport.iata === 'BEG') ?? loadedAirports[0];
        const defaultTo =
          loadedAirports.find((airport) => airport.iata === 'DXB') ??
          loadedAirports.find((airport) => airport.iata !== defaultFrom?.iata);

        setFromAirport(defaultFrom);
        setToAirport(defaultTo);
      } catch (error) {
        setLoadingError(error instanceof Error ? error.message : 'Could not load airports data.');
      } finally {
        setIsLoadingAirports(false);
      }
    };

    void initAirports();
  }, []);

  const distanceKm = useMemo(() => {
    if (!fromAirport || !toAirport) {
      return 0;
    }

    return calculateHaversineDistance(fromAirport.lat, fromAirport.lng, toAirport.lat, toAirport.lng);
  }, [fromAirport, toAirport]);

  const durationHours = useMemo(() => estimateFlightDurationHours(distanceKm), [distanceKm]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-route-glow px-4 py-6 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:linear-gradient(120deg,transparent_0%,rgba(200,155,60,0.08)_35%,transparent_70%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative w-full max-w-4xl rounded-2xl border border-gold/25 bg-zinc-950/75 p-4 shadow-glow backdrop-blur-md sm:rounded-3xl sm:p-6 lg:p-8"
      >
        <header className="mb-6 text-center sm:mb-8">
          <p className="mb-2 text-xs font-semibold tracking-widest text-gold uppercase sm:mb-3">Hype Air</p>
          <h1 className="font-display text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">
            Route Visualizer
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Select your departure and destination airports to preview great-circle distance and
            estimated journey time.
          </p>
          <p className="mt-3 text-xs tracking-[0.18em] text-zinc-400 uppercase">
            Airports loaded: {airports.length.toLocaleString()}
          </p>
        </header>

        {isLoadingAirports && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
            Loading airports...
          </div>
        )}

        {loadingError && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
            {loadingError}
          </div>
        )}

        {!loadingError && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AirportSearch
              id="from-airport"
              label="From Airport"
              selectedAirport={fromAirport}
              airports={airports}
              onSelect={setFromAirport}
              excludeIata={toAirport?.iata}
              disabled={isLoadingAirports || airports.length === 0}
            />
            <AirportSearch
              id="to-airport"
              label="To Airport"
              selectedAirport={toAirport}
              airports={airports}
              onSelect={setToAirport}
              excludeIata={fromAirport?.iata}
              disabled={isLoadingAirports || airports.length === 0}
            />
          </div>
        )}

        <div className="mt-7">
          <RouteVisualizer
            fromCode={fromAirport?.iata ?? '---'}
            toCode={toAirport?.iata ?? '---'}
            distanceKm={distanceKm}
            durationHours={durationHours}
          />
        </div>

        <div className="mt-6">
          {fromAirport && toAirport && (
            <WorldMapPanel from={fromAirport} to={toAirport} distanceKm={distanceKm} />
          )}
        </div>
      </motion.section>
    </main>
  );
};

export default App;
