import React, { useState } from 'react';
import { Search, Globe, RotateCcw, Zap, ExternalLink } from 'lucide-react';

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

  return (
    <header className="w-full bg-[#FFE600] dark:bg-[#CCB800] border-b-4 border-black p-4 sm:p-5 md:p-6 shadow-[0px_4px_0px_0px_#000] transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">
        {/* Top Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-black text-[#FFE600] dark:text-[#CCB800] p-2.5 border-2 border-black shadow-[3px_3px_0px_0px_#FFF] shrink-0">
              <Globe className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="bg-[#FF007A] dark:bg-[#CC0062] text-white border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                  v1.0 API Service
                </span>
                <span className="bg-[#22C55E] dark:bg-[#1B9E4B] text-black dark:text-white border-2 border-black text-[10px] font-black px-2 py-0.5 uppercase shadow-[2px_2px_0px_0px_#000]">
                  HTTP/JSON Ready
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight text-black uppercase mt-1 break-words">
                IP-API <span className="bg-black text-white px-2 py-0.5 inline-block">GEO LOOKUP</span>
              </h1>
            </div>
          </div>

          {/* Quick API Link & Self IP Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/api"
              target="_blank"
              rel="noreferrer"
              className="neo-btn bg-[#06B6D4] dark:bg-[#0491A9] text-black dark:text-white font-black px-3 py-2 text-xs min-h-[44px] flex items-center gap-1.5 uppercase hover:bg-[#38BDF8] dark:hover:bg-[#037A8E]"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              Open /api Direct
            </a>

            <button
              onClick={onResetToSelf}
              disabled={isLoading}
              className="neo-btn bg-[#A855F7] dark:bg-[#8644C6] text-white font-black px-3 py-2 text-xs min-h-[44px] flex items-center gap-1.5 uppercase hover:bg-[#C084FC] dark:hover:bg-[#7038A6] disabled:opacity-50"
              title="Lookup your current client IP address"
            >
              <RotateCcw className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              Lookup My IP
            </button>
          </div>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter IP address or domain (e.g., 170.205.81.42 or google.com)"
                className="w-full bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-mono font-bold text-sm md:text-base border-3 border-black p-3 pl-10 md:pl-11 min-h-[48px] shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:ring-0 focus:bg-[#FFFDF5] dark:focus:bg-[#2A2A2A]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black dark:text-gray-400 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="neo-btn bg-[#FF007A] dark:bg-[#CC0062] text-white font-black px-6 py-3 min-h-[48px] text-sm md:text-base flex items-center justify-center gap-2 uppercase whitespace-nowrap disabled:opacity-50"
            >
              <Zap className="w-5 h-5 fill-current shrink-0" />
              {isLoading ? 'SEARCHING...' : 'LOOKUP IP'}
            </button>
          </div>
        </form>
      </div>
    </header>
  );
};
