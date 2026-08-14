import React from 'react';
import { Layers, Copy, Check } from 'lucide-react';
import { GeoResponse, getCountryFlagEmoji } from '../types';

interface DualStackBannerProps {
  ipv4: GeoResponse;
  ipv6: GeoResponse;
  activeFamily: 'ipv4' | 'ipv6';
  onSelect: (family: 'ipv4' | 'ipv6') => void;
  onCopy: (text: string, label: string) => void;
}

const FamilyCard: React.FC<{
  label: string;
  data: GeoResponse;
  active: boolean;
  onSelect: () => void;
  onCopy: (text: string, label: string) => void;
}> = ({ label, data, active, onSelect, onCopy }) => {
  const flag = getCountryFlagEmoji(data.countryCode);
  return (
    <button
      onClick={onSelect}
      className={`neo-box text-left w-full p-3.5 space-y-2 transition-all ${
        active
          ? 'bg-[#FFE600] dark:bg-[#CCB800]'
          : 'bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#242424]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
          {label}
        </span>
        {active && (
          <span className="text-[10px] font-black uppercase text-black">Active</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono font-black text-sm sm:text-base text-black dark:text-white break-all">
          {data.query}
        </span>
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(data.query, `${label} Address`);
          }}
          className="shrink-0 p-1.5 border-2 border-black bg-white dark:bg-[#2A2A2A] hover:bg-[#22C55E] dark:hover:bg-[#1B9E4B]"
          title={`Copy ${label} address`}
        >
          <Copy className="w-3.5 h-3.5" />
        </span>
      </div>
      {data.status === 'success' ? (
        <div className="text-xs font-bold text-gray-800 dark:text-gray-300 truncate">
          <span className="mr-1">{flag}</span>
          {data.city ? `${data.city}, ` : ''}
          {data.country || 'Unknown location'}
        </div>
      ) : (
        <div className="text-xs font-bold text-[#FF007A] dark:text-[#CC0062]">
          Lookup failed: {data.message || 'unknown error'}
        </div>
      )}
    </button>
  );
};

export const DualStackBanner: React.FC<DualStackBannerProps> = ({
  ipv4,
  ipv6,
  activeFamily,
  onSelect,
  onCopy,
}) => {
  return (
    <div className="neo-box bg-[#A855F7] dark:bg-[#8644C6] p-3.5 sm:p-4 space-y-3 transition-colors duration-200">
      <div className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
        <Layers className="w-4 h-4 shrink-0" />
        Dual-Stack Client Detected: IPv4 & IPv6 Both Available
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FamilyCard
          label="IPv4"
          data={ipv4}
          active={activeFamily === 'ipv4'}
          onSelect={() => onSelect('ipv4')}
          onCopy={onCopy}
        />
        <FamilyCard
          label="IPv6"
          data={ipv6}
          active={activeFamily === 'ipv6'}
          onSelect={() => onSelect('ipv6')}
          onCopy={onCopy}
        />
      </div>
    </div>
  );
};
