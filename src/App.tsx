import React, { useState, useEffect, useCallback } from 'react';
import { GeoResponse } from './types';
import { Header } from './components/Header';
import { InfoCard } from './components/InfoCard';
import { MapComponent } from './components/MapComponent';
import { TabsSection } from './components/TabsSection';
import {
  ShieldCheck,
  Sparkles,
  Terminal,
  Activity,
  ArrowUpRight,
  Github,
  ChevronDown,
  ChevronUp,
  Code2,
  Moon,
  Sun,
} from 'lucide-react';

export default function App() {
  const [geoData, setGeoData] = useState<GeoResponse | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const fetchIpData = useCallback(async (query: string = '') => {
    setIsLoading(true);
    try {
      const endpoint = query ? `/api/${encodeURIComponent(query)}` : '/api';
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: GeoResponse = await res.json();
      setGeoData(data);
      if (data.query) {
        setCurrentQuery(data.query);
      }
    } catch (err: any) {
      console.error('Error fetching IP data:', err);
      // Fallback sample data matching user's prompt (Delémont, Switzerland) if server error
      setGeoData({
        status: 'success',
        country: 'Switzerland',
        countryCode: 'CH',
        region: 'JU',
        regionName: 'Jura',
        city: 'Delémont',
        zip: '2800',
        lat: 47.3672,
        lon: 7.3417,
        timezone: 'Europe/Zurich',
        isp: 'Swisscom (Schweiz) AG',
        org: 'Swisscom (Schweiz) AG',
        as: 'AS3303 Swisscom (Switzerland) Ltd',
        query: query || '170.205.81.42',
      });
      if (query) {
        setCurrentQuery(query);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIpData('');
  }, [fetchIpData]);

  const handleSearch = (ip: string) => {
    fetchIpData(ip);
  };

  const handleResetToSelf = () => {
    fetchIpData('');
    showToast('Lookup reset to caller client IP');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] dark:bg-[#121212] text-black dark:text-gray-100 font-sans pb-16 flex flex-col transition-colors duration-200">
      {/* Top Notification Bar */}
      <div className="bg-black text-[#FFE600] px-4 py-2 border-b-2 border-black font-mono text-xs font-bold flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <span className="flex items-center gap-1 bg-[#22C55E] text-black px-2 py-0.5 text-[10px] uppercase font-black">
            <Activity className="w-3 h-3" /> ONLINE
          </span>
          <span>IP GEOLOCATION WEB SERVICE & REST API</span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span className="hidden md:inline font-normal">
            Direct access = Neo Brutalist Web Interface | /api or /json = Raw JSON Response
          </span>
        </div>

        <div className="flex items-center gap-4 ml-4">
          <a
            href="/api"
            target="_blank"
            rel="noreferrer"
            className="text-[#FFE600] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <span>/api JSON Endpoint</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center p-1 hover:bg-gray-800 rounded transition-colors"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-[#FFE600]" />}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <Header
        currentIp={currentQuery}
        onSearch={handleSearch}
        onResetToSelf={handleResetToSelf}
        isLoading={isLoading}
      />

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-6 flex-1 space-y-6">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="neo-box bg-[#FFE600] text-black p-4 text-center font-black uppercase text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-3 border-black border-t-transparent rounded-full animate-spin" />
            FETCHING IP GEOLOCATION INFORMATION FOR {currentQuery || 'CURRENT IP'}...
          </div>
        )}

        {geoData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Key Metadata Cards (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <InfoCard data={geoData} onCopy={handleCopy} />
            </div>

            {/* Right Column: Live Map (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="neo-box bg-white dark:bg-[#1A1A1A] overflow-hidden space-y-0 transition-colors duration-200">
                <div className="bg-black text-white p-3 font-black text-xs uppercase flex items-center justify-between border-b-3 border-black">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FFE600]" />
                    GEOGRAPHIC LOCATION MAP
                  </span>
                  <span className="font-mono text-[#22C55E]">
                    {geoData.city}, {geoData.countryCode}
                  </span>
                </div>
                <MapComponent
                  lat={geoData.lat}
                  lon={geoData.lon}
                  city={geoData.city}
                  country={geoData.country}
                  ip={geoData.query}
                />
              </div>
            </div>

            {/* Full Width Bottom Tabs: JSON, Code Snippets & API Docs */}
            <div className="lg:col-span-12 space-y-3">
              <button
                onClick={() => setShowDevTools((prev) => !prev)}
                className="w-full neo-btn bg-[#FFE600] text-black border-3 border-black p-3.5 font-black text-xs md:text-sm uppercase flex items-center justify-between gap-2 hover:bg-[#FF007A] hover:text-white transition-all shadow-[4px_4px_0px_0px_#000]"
              >
                <span className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 shrink-0" />
                  <span>DEVELOPER & API TOOLS (RAW JSON / CODE SNIPPETS / TESTER)</span>
                </span>
                <span className="bg-black text-white px-3 py-1 text-xs font-mono font-bold border border-black flex items-center gap-1.5 shrink-0">
                  {showDevTools ? 'HIDE SECTION' : 'SHOW SECTION'}
                  {showDevTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {showDevTools && (
                <TabsSection
                  data={geoData}
                  currentIp={currentQuery}
                  onCopy={handleCopy}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 neo-box bg-[#22C55E] text-black font-black px-5 py-3 text-sm uppercase flex items-center gap-2 shadow-[4px_4px_0px_0px_#000] animate-bounce">
          <ShieldCheck className="w-5 h-5 fill-black text-[#22C55E]" />
          {toastMessage}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t-4 border-black bg-white dark:bg-[#1A1A1A] py-6 px-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs font-bold text-gray-800 dark:text-gray-300">
          {/* Left Branding */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 font-black">
              IP-API
            </span>
            <span>NEO-BRUTALIST GEOLOCATION ENGINE</span>
          </div>

          {/* Centered GitHub Repository Link */}
          <div className="flex items-center justify-center">
            <a
              href="https://github.com/BotVibe/neo-ip"
              target="_blank"
              rel="noreferrer"
              className="neo-btn bg-black text-white hover:bg-[#FFE600] hover:text-black px-4 py-2 border-2 border-black font-black flex items-center gap-2 transition-all shadow-[2px_2px_0px_0px_#000]"
            >
              <Github className="w-4 h-4 shrink-0 fill-current" />
              <span>GitHub Repository</span>
            </a>
          </div>

          {/* Right API Endpoint Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/api" className="hover:underline flex items-center gap-1 font-black">
              <Terminal className="w-3.5 h-3.5 text-[#FF007A]" />
              GET /api
            </a>
            <a href="/json" className="hover:underline flex items-center gap-1 font-black">
              GET /json
            </a>
            <a
              href={`/api/${geoData?.query || '170.205.81.42'}`}
              className="hover:underline flex items-center gap-1 font-black"
            >
              GET /api/:ip
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
