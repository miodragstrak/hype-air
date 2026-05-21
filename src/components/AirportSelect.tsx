import type { Airport } from '../types/airport';

type AirportSelectProps = {
  id: string;
  label: string;
  value: string;
  airports: Airport[];
  onChange: (iata: string) => void;
  excludeIata?: string;
};

const AirportSelect = ({
  id,
  label,
  value,
  airports,
  onChange,
  excludeIata,
}: AirportSelectProps) => {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-zinc-200" htmlFor={id}>
      <span className="tracking-[0.2em] text-zinc-400 uppercase">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-gold/40 bg-zinc-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-champagne focus:ring-2 focus:ring-gold/20"
      >
        {airports
          .filter((airport) => airport.iata !== excludeIata)
          .map((airport) => (
            <option key={airport.iata} value={airport.iata} className="bg-zinc-950 text-zinc-100">
              {airport.iata} - {airport.name}
            </option>
          ))}
      </select>
    </label>
  );
};

export default AirportSelect;
