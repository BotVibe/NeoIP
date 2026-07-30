export interface GeoResponse {
  status: 'success' | 'fail';
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query: string;
}

export interface PresetIp {
  label: string;
  ip: string;
  flag: string;
  location: string;
}

export const PRESET_IPS: PresetIp[] = [
  { label: 'Delémont (JU)', ip: '170.205.81.42', flag: '🇨🇭', location: 'Switzerland' },
  { label: 'Google DNS', ip: '8.8.8.8', flag: '🇺🇸', location: 'USA' },
  { label: 'Cloudflare', ip: '1.1.1.1', flag: '🇦🇺', location: 'Australia' },
  { label: 'Tokyo', ip: '133.242.18.1', flag: '🇯🇵', location: 'Japan' },
  { label: 'Frankfurt', ip: '138.201.21.22', flag: '🇩🇪', location: 'Germany' },
  { label: 'London', ip: '185.199.108.153', flag: '🇬🇧', location: 'UK' },
];

export function getCountryFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
