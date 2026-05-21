import type { Airport } from '../types/airport';

type CsvRecord = Record<string, string>;

const COUNTRY_DISPLAY =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const parseCsv = (source: string): string[][] => {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (char === '"') {
      if (inQuotes && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && source[i + 1] === '\n') {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.length > 0);
};

const normalizeCountry = (isoCountryCode: string): string => {
  const trimmedCode = isoCountryCode.trim().toUpperCase();
  if (!trimmedCode) {
    return 'Unknown';
  }

  const displayName = COUNTRY_DISPLAY?.of(trimmedCode);
  return displayName ?? trimmedCode;
};

const toRecord = (headers: string[], row: string[]): CsvRecord => {
  return headers.reduce<CsvRecord>((record, header, index) => {
    record[header] = row[index] ?? '';
    return record;
  }, {});
};

const toAirport = (record: CsvRecord): Airport | null => {
  const airportType = record.type;
  if (airportType !== 'large_airport' && airportType !== 'medium_airport') {
    return null;
  }

  const iata = record.iata_code?.trim().toUpperCase();
  const latRaw = record.latitude_deg?.trim();
  const lngRaw = record.longitude_deg?.trim();

  if (!iata || !latRaw || !lngRaw) {
    return null;
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    iata,
    name: record.name?.trim() || iata,
    city: record.municipality?.trim() || undefined,
    country: normalizeCountry(record.iso_country || ''),
    lat,
    lng,
  };
};

export const loadAirports = async (): Promise<Airport[]> => {
  const response = await fetch('/data/airports.csv');
  if (!response.ok) {
    throw new Error(`Failed to load airports.csv (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  const deduped = new Map<string, Airport>();

  for (const dataRow of dataRows) {
    const record = toRecord(headers, dataRow);
    const airport = toAirport(record);

    if (airport && !deduped.has(airport.iata)) {
      deduped.set(airport.iata, airport);
    }
  }

  return [...deduped.values()].sort((a, b) => a.iata.localeCompare(b.iata));
};
