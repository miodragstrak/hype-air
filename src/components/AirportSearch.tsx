import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Airport } from '../types/airport';

type AirportSearchProps = {
  id: string;
  label: string;
  selectedAirport?: Airport;
  airports: Airport[];
  onSelect: (airport: Airport) => void;
  excludeIata?: string;
  disabled?: boolean;
};

const formatAirportLabel = (airport: Airport) => `${airport.iata} - ${airport.name}`;

const AirportSearch = ({
  id,
  label,
  selectedAirport,
  airports,
  onSelect,
  excludeIata,
  disabled = false,
}: AirportSearchProps) => {
  const [query, setQuery] = useState(selectedAirport ? formatAirportLabel(selectedAirport) : '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedAirport) {
      setQuery(formatAirportLabel(selectedAirport));
    }
  }, [selectedAirport?.iata]);

  useEffect(() => {
    const onWindowPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', onWindowPointerDown);
    return () => window.removeEventListener('mousedown', onWindowPointerDown);
  }, []);

  const filteredAirports = useMemo(() => {
    const sanitized = query.trim().toLowerCase();
    const candidates = airports.filter((airport) => airport.iata !== excludeIata);

    if (!sanitized) {
      return candidates.slice(0, 10);
    }

    return candidates
      .filter((airport) => {
        const haystack = `${airport.iata} ${airport.name} ${airport.country}`.toLowerCase();
        return haystack.includes(sanitized);
      })
      .slice(0, 10);
  }, [airports, excludeIata, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, excludeIata]);

  const chooseAirport = (airport: Airport) => {
    onSelect(airport);
    setQuery(formatAirportLabel(airport));
    setIsOpen(false);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredAirports.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const airport = filteredAirports[highlightedIndex];
      if (airport) {
        chooseAirport(airport);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const listboxId = `${id}-listbox`;

  return (
    <div ref={wrapperRef} className="relative flex w-full flex-col gap-2 text-sm font-medium text-zinc-200">
      <label htmlFor={id} className="tracking-[0.2em] text-zinc-400 uppercase">
        {label}
      </label>

      <input
        id={id}
        type="text"
        value={query}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onInputKeyDown}
        autoComplete="off"
        placeholder="Search by IATA, name, country"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && filteredAirports[highlightedIndex]
            ? `${id}-option-${filteredAirports[highlightedIndex].iata}`
            : undefined
        }
        className="w-full rounded-xl border border-gold/40 bg-zinc-950/80 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-champagne focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
      />

      {isOpen && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-20 max-h-80 overflow-auto rounded-xl border border-gold/30 bg-zinc-950/95 p-1 shadow-xl"
        >
          {filteredAirports.length === 0 && (
            <li className="px-3 py-3 text-sm text-zinc-400">No airports found.</li>
          )}

          {filteredAirports.map((airport, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li key={airport.iata} role="presentation">
                <button
                  id={`${id}-option-${airport.iata}`}
                  role="option"
                  aria-selected={isHighlighted}
                  type="button"
                  onClick={() => chooseAirport(airport)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition ${
                    isHighlighted ? 'bg-gold/20 text-white' : 'text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <p className="text-sm font-semibold tracking-[0.08em]">{airport.iata}</p>
                  <p className="text-sm text-zinc-200">{airport.name}</p>
                  <p className="text-xs text-zinc-400">{airport.country}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AirportSearch;
