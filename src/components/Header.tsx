import React, { useState } from 'react';
import { Search, Globe, RotateCcw, Zap, ExternalLink } from 'lucide-react';
import { PRESET_IPS, PresetIp } from '../types';

interface HeaderProps {
  currentIp: string;
  onSearch: (ip: string) => void;
  onResetToSelf: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentIp,
  onSearch,
  onResetToSelf,
  isLoading,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handleSelectPreset = (preset: PresetIp) => {
    setInputVal(preset.ip);
    onSearch(preset.ip);
  };

  return (
    <header className="w-full bg-[#FFE600] border-b-4 border-black p-4 md:p-6 shadow-[0px_4px_0px_0px_#000]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Title & Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-black text-[#FFE600] p-2.5 border-2 border-black shadow-[3px_3px_0px_0px_#FFF]">
              <Globe className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF007A] text-white border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                  v1.0 API Service
                </span>
                <span className="bg-[#22C55E] text-black border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase shadow-[2px_2px_0px_0px_#000]">
                  HTTP/JSON Ready
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-black uppercase mt-0.5">
                IP-API <span className="bg-black text-white px-2 py-0.5">GEO LOOKUP</span>
              </h1>
            </div>
          </div>

          {/* Quick API Link & Self IP Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api"
              target="_blank"
              rel="noreferrer"
              className="neo-btn bg-[#06B6D4] text-black font-black px-3 py-1.5 text-xs flex items-center gap-1.5 uppercase hover:bg-[#38BDF8]"
            >
              <ExternalLink className="w-4 h-4" />
              Open /api Direct
            </a>

            <button
              onClick={onResetToSelf}
              disabled={isLoading}
              className="neo-btn bg-[#A855F7] text-white font-black px-3 py-1.5 text-xs flex items-center gap-1.5 uppercase hover:bg-[#C084FC] disabled:opacity-50"
              title="Lookup your current client IP address"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Lookup My IP
            </button>
          </div>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSubmit} className="relative w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter IP address or domain (e.g., 170.205.81.42 or google.com)"
                className="w-full bg-white text-black font-mono font-bold text-sm md:text-base border-3 border-black p-3.5 pl-11 shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:ring-0 focus:bg-[#FFFDF5]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="neo-btn bg-[#FF007A] text-white font-black px-6 py-3.5 text-sm md:text-base flex items-center justify-center gap-2 uppercase whitespace-nowrap disabled:opacity-50"
            >
              <Zap className="w-5 h-5 fill-current" />
              {isLoading ? 'SEARCHING...' : 'LOOKUP IP'}
            </button>
          </div>
        </form>

        {/* Preset IP quick buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-black uppercase text-black flex items-center gap-1">
            ⚡ QUICK PRESETS:
          </span>
          {PRESET_IPS.map((preset) => (
            <button
              key={preset.ip}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`text-xs font-black px-2.5 py-1 border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 ${
                currentIp === preset.ip
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-[#22C55E]'
              }`}
            >
              <span>{preset.flag}</span>
              <span>{preset.label}</span>
              <span className="font-mono text-[10px] opacity-75">({preset.ip})</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
