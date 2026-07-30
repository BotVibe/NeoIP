import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Globe2,
  Building2,
  Clock,
  Wifi,
  Radio,
  Copy,
  Check,
  Compass,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { GeoResponse, getCountryFlagEmoji } from '../types';

interface InfoCardProps {
  data: GeoResponse;
  onCopy: (text: string, label: string) => void;
}

export const InfoCard: React.FC<InfoCardProps> = ({ data, onCopy }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState<string>('');

  const flag = getCountryFlagEmoji(data.countryCode);

  const handleCopy = (text: string, fieldName: string) => {
    onCopy(text, fieldName);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate local time in the specified timezone if valid
  useEffect(() => {
    if (!data.timezone) return;
    const updateTime = () => {
      try {
        const timeStr = new Date().toLocaleTimeString('en-US', {
          timeZone: data.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        setLocalTime(timeStr);
      } catch {
        setLocalTime('');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [data.timezone]);

  return (
    <div className="space-y-4">
      {/* Primary IP Banner */}
      <div className="neo-box bg-[#06B6D4] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-1.5 mb-1">
            <Globe2 className="w-4 h-4" />
            RESOLVED TARGET QUERY IP
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl font-mono font-black text-black">
              {data.query}
            </span>
            <button
              onClick={() => handleCopy(data.query, 'IP Address')}
              className="neo-btn bg-white text-black p-1.5 text-xs font-bold hover:bg-[#FFE600]"
              title="Copy IP Address"
            >
              {copiedField === 'IP Address' ? (
                <Check className="w-4 h-4 text-green-700" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {data.status === 'success' ? (
            <div className="bg-[#22C55E] text-black border-3 border-black px-4 py-2 font-black text-sm uppercase flex items-center gap-2 shadow-[3px_3px_0px_0px_#000]">
              <CheckCircle2 className="w-5 h-5 fill-black text-[#22C55E]" />
              STATUS: SUCCESS (200 OK)
            </div>
          ) : (
            <div className="bg-[#FF007A] text-white border-3 border-black px-4 py-2 font-black text-sm uppercase flex items-center gap-2 shadow-[3px_3px_0px_0px_#000]">
              <XCircle className="w-5 h-5 fill-white text-[#FF007A]" />
              STATUS: FAIL ({data.message || 'INVALID QUERY'})
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Country & Region */}
        <div className="neo-box bg-white p-4 space-y-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <span className="text-lg">{flag}</span> COUNTRY & REGION
            </span>
            <span className="bg-[#FFE600] text-black border-2 border-black text-[10px] font-mono font-black px-1.5 py-0.5">
              {data.countryCode || 'N/A'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xl font-black text-black">
              {data.country || 'Unknown Country'}
            </div>
            <div className="text-sm font-bold text-gray-800">
              Region: {data.regionName || 'N/A'}{' '}
              {data.region ? `(${data.region})` : ''}
            </div>
          </div>
        </div>

        {/* City & Zip */}
        <div className="neo-box bg-white p-4 space-y-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF007A]" /> CITY & POSTAL CODE
            </span>
            <span className="bg-[#A855F7] text-white border-2 border-black text-[10px] font-mono font-black px-1.5 py-0.5">
              ZIP: {data.zip || 'N/A'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xl font-black text-black">
              {data.city || 'Unknown City'}
            </div>
            <div className="text-sm font-bold text-gray-800">
              Zip/Postal Code: <span className="font-mono">{data.zip || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Lat & Lon Coordinates */}
        <div className="neo-box bg-white p-4 space-y-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#06B6D4]" /> COORDINATES (LAT/LON)
            </span>
            <button
              onClick={() =>
                handleCopy(`${data.lat}, ${data.lon}`, 'Coordinates')
              }
              className="neo-box-sm bg-[#FFE600] text-black p-1 text-xs hover:bg-[#22C55E]"
              title="Copy Coordinates"
            >
              {copiedField === 'Coordinates' ? (
                <Check className="w-3.5 h-3.5 text-black" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="font-mono text-base font-bold text-black grid grid-cols-2 gap-2 pt-1">
            <div className="bg-gray-100 p-2 border-2 border-black">
              <div className="text-[10px] font-sans font-black text-gray-600">LATITUDE</div>
              <div className="text-lg font-black">{data.lat ?? 0}</div>
            </div>
            <div className="bg-gray-100 p-2 border-2 border-black">
              <div className="text-[10px] font-sans font-black text-gray-600">LONGITUDE</div>
              <div className="text-lg font-black">{data.lon ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="neo-box bg-white p-4 space-y-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#A855F7]" /> TIMEZONE & LOCAL TIME
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-base font-mono font-black text-black">
              {data.timezone || 'UTC'}
            </div>
            {localTime && (
              <div className="bg-[#22C55E] text-black border-2 border-black p-1.5 font-mono text-center font-black text-sm shadow-[2px_2px_0px_0px_#000]">
                ⏰ LOCAL TIME: {localTime}
              </div>
            )}
          </div>
        </div>

        {/* ISP & Organization */}
        <div className="neo-box bg-white p-4 space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-[#FF007A]" /> ISP & NETWORK OPERATOR
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-xs font-black text-gray-600 uppercase">INTERNET SERVICE PROVIDER</div>
              <div className="text-base font-black text-black">{data.isp || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs font-black text-gray-600 uppercase">ORGANIZATION</div>
              <div className="text-base font-black text-black">{data.org || data.isp || 'N/A'}</div>
            </div>

            {data.as && (
              <div className="md:col-span-2 bg-[#FFFDF5] border-2 border-black p-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#06B6D4] shrink-0" />
                <span className="text-xs font-mono font-bold text-black break-all">
                  AS NUMBER / ROUTING: {data.as}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
