import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  FileJson,
  Copy,
  Check,
  Download,
  ExternalLink,
  Play,
  Layers,
  Sparkles,
  Globe2,
} from 'lucide-react';
import { GeoResponse } from '../types';

/** Production dual-stack API hosts (DNS A-only / AAAA-only for family pinning). */
const API_HOSTS = {
  dual: 'https://neoip.rosentreter.site',
  ipv4: 'https://ipv4.neoip.rosentreter.site',
  ipv6: 'https://ipv6.neoip.rosentreter.site',
} as const;

const FAMILY_PROBE_TIMEOUT_MS = 3000;

async function fetchQueryWithTimeout(url: string, ms: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { query?: string; status?: string };
    if (json.status === 'fail' || !json.query) return null;
    return json.query;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface TabsSectionProps {
  data: GeoResponse;
  currentIp: string;
  onCopy: (text: string, label: string) => void;
}

export const TabsSection: React.FC<TabsSectionProps> = ({
  data,
  currentIp,
  onCopy,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'code' | 'docs'>('json');
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'php' | 'go'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  // Playground custom params
  const [testFieldQuery, setTestFieldQuery] = useState('');
  const [playgroundResult, setPlaygroundResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Optional live probe of family-specific hosts (docs tab only).
  const [familyIps, setFamilyIps] = useState<{
    ipv4: string | null;
    ipv6: string | null;
    loading: boolean;
  }>({ ipv4: null, ipv6: null, loading: true });

  useEffect(() => {
    if (activeTab !== 'docs') return;
    let cancelled = false;
    setFamilyIps((prev) => ({ ...prev, loading: true }));

    Promise.all([
      fetchQueryWithTimeout(`${API_HOSTS.ipv4}/api/`, FAMILY_PROBE_TIMEOUT_MS),
      fetchQueryWithTimeout(`${API_HOSTS.ipv6}/api/`, FAMILY_PROBE_TIMEOUT_MS),
    ]).then(([ipv4, ipv6]) => {
      if (!cancelled) setFamilyIps({ ipv4, ipv6, loading: false });
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopyJson = () => {
    onCopy(jsonString, 'JSON Response');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-api-${data.query || 'response'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate code snippets — pin /api/:ip when known so `query` is the preferred
  // address (IPv4 after dual-stack), not a bare Happy-Eyeballs /api self-lookup.
  const getCodeSnippet = () => {
    const origin = window.location.origin;
    const targetUrl = currentIp
      ? `${origin}/api/${encodeURIComponent(currentIp)}`
      : `${origin}/api`;

    switch (activeLang) {
      case 'curl':
        return `# cURL Request\ncurl -s "${targetUrl}"`;

      case 'js':
        return `// JavaScript / Fetch API\nfetch('${targetUrl}')\n  .then(res => res.json())\n  .then(data => {\n    console.log('Country:', data.country);\n    console.log('IP:', data.query);\n  });`;

      case 'python':
        return `# Python requests library\nimport requests\n\nresponse = requests.get('${targetUrl}')\ndata = response.json()\n\nprint(f"Status: {data.get('status')}")\nprint(f"Country: {data.get('country')}")\nprint(f"IP: {data.get('query')}")`;

      case 'php':
        return `<?php\n// PHP file_get_contents\n$json = file_get_contents('${targetUrl}');\n$data = json_decode($json, true);\n\necho "Country: " . $data['country'] . "\\n";\necho "IP: " . $data['query'] . "\\n";\n?>`;

      case 'go':
        return `// Go HTTP GET\npackage main\n\nimport (\n\t"encoding/json"\n\t"fmt"\n\t"net/http"\n)\n\nfunc main() {\n\tres, err := http.Get("${targetUrl}")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer res.Body.Close()\n\n\tvar data map[string]interface{}\n\tjson.NewDecoder(res.Body).Decode(&data)\n\tfmt.Println("Country:", data["country"])\n}`;
    }
  };

  // Live Playground Test Execution
  const handleRunPlaygroundTest = async () => {
    setIsTesting(true);
    setPlaygroundResult(null);
    try {
      const queryStr = testFieldQuery ? `?fields=${encodeURIComponent(testFieldQuery)}` : '';
      const endpoint = `${window.location.origin}/api${currentIp ? `/${currentIp}` : ''}${queryStr}`;
      const res = await fetch(endpoint);
      const jsonRes = await res.json();
      setPlaygroundResult(JSON.stringify(jsonRes, null, 2));
    } catch (err: any) {
      setPlaygroundResult(JSON.stringify({ error: err.message || 'Failed' }, null, 2));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="neo-box bg-white dark:bg-[#1A1A1A] overflow-hidden transition-colors duration-200">
      {/* Tabs Bar Header */}
      <div className="bg-black p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b-3 border-black">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3.5 py-2 font-black text-xs uppercase flex items-center gap-1.5 min-h-[44px] transition-all ${
              activeTab === 'json'
                ? 'bg-[#FFE600] dark:bg-[#CCB800] text-black dark:text-white border-2 border-black shadow-[2px_2px_0px_0px_#FFF]'
                : 'text-white hover:bg-gray-800'
            }`}
          >
            <FileJson className="w-4 h-4 shrink-0" />
            RAW JSON
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3.5 py-2 font-black text-xs uppercase flex items-center gap-1.5 min-h-[44px] transition-all ${
              activeTab === 'code'
                ? 'bg-[#FF007A] dark:bg-[#CC0062] text-white border-2 border-black shadow-[2px_2px_0px_0px_#FFF]'
                : 'text-white hover:bg-gray-800'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            CODE SNIPPETS
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-2 font-black text-xs uppercase flex items-center gap-1.5 min-h-[44px] transition-all ${
              activeTab === 'docs'
                ? 'bg-[#06B6D4] dark:bg-[#0491A9] text-black dark:text-white border-2 border-black shadow-[2px_2px_0px_0px_#FFF]'
                : 'text-white hover:bg-gray-800'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            API DOCS & TESTER
          </button>
        </div>

        {/* Quick link button to open live API endpoint */}
        <a
          href={`/api${currentIp ? `/${currentIp}` : ''}`}
          target="_blank"
          rel="noreferrer"
          className="bg-[#22C55E] dark:bg-[#1B9E4B] text-black dark:text-white border-2 border-black px-3.5 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 min-h-[44px] hover:bg-[#4ADE80] dark:hover:bg-[#16A34A] shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          Test Endpoint
        </a>
      </div>

      {/* Tab 1: Raw JSON */}
      {activeTab === 'json' && (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs font-mono font-black text-black dark:text-white flex items-center gap-2">
              <span className="bg-[#22C55E] dark:bg-[#1B9E4B] text-black dark:text-white px-2 py-0.5 border border-black shrink-0">
                200 OK
              </span>
              <span className="break-all">Content-Type: application/json</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="neo-btn bg-[#FFE600] dark:bg-[#CCB800] text-black dark:text-white px-3 py-2 text-xs min-h-[44px] font-black flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'COPIED!' : 'COPY JSON'}
              </button>

              <button
                onClick={handleDownloadJson}
                className="neo-btn bg-[#A855F7] dark:bg-[#8644C6] text-white px-3 py-2 text-xs min-h-[44px] font-black flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD .JSON
              </button>
            </div>
          </div>

          <pre className="bg-[#18181B] text-[#00FF66] p-3.5 sm:p-4 font-mono text-xs md:text-sm overflow-x-auto border-3 border-black max-h-[420px]">
            {jsonString}
          </pre>
        </div>
      )}

      {/* Tab 2: Code Generators */}
      {activeTab === 'code' && (
        <div className="p-3.5 sm:p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['curl', 'js', 'python', 'php', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`neo-btn px-3.5 py-2 text-xs min-h-[44px] font-black uppercase ${
                  activeLang === lang
                    ? 'bg-[#FF007A] dark:bg-[#CC0062] text-white'
                    : 'bg-gray-100 dark:bg-[#2A2A2A] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {lang === 'js' ? 'JavaScript' : lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="bg-[#18181B] text-white p-3.5 sm:p-4 font-mono text-xs md:text-sm overflow-x-auto border-3 border-black">
              {getCodeSnippet()}
            </pre>

            <button
              onClick={() => {
                onCopy(getCodeSnippet(), 'Code Snippet');
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="mt-2 sm:mt-0 sm:absolute sm:top-3 sm:right-3 neo-btn bg-[#FFE600] dark:bg-[#CCB800] text-black dark:text-white px-3 py-2 min-h-[44px] text-xs font-black flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'COPIED' : 'COPY CODE'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: API Docs & Interactive Playground */}
      {activeTab === 'docs' && (
        <div className="p-3.5 sm:p-4 space-y-5">
          {/* Production API hosts (dual-stack / IPv4-only / IPv6-only) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#06B6D4] dark:text-[#0491A9]" />
              PRODUCTION API HOSTS
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              Three hostnames, same app, no redirects. Dual-stack returns whichever family your connection used; the family-specific hosts pin DNS to A-only or AAAA-only.
            </p>

            <div className="overflow-x-auto border-3 border-black">
              <table className="w-full text-left font-mono text-xs border-collapse min-w-[560px]">
                <thead className="bg-[#06B6D4] dark:bg-[#0491A9] text-black dark:text-white border-b-2 border-black font-sans font-black uppercase">
                  <tr>
                    <th className="p-2.5 border-r-2 border-black">Host</th>
                    <th className="p-2.5 border-r-2 border-black">DNS</th>
                    <th className="p-2.5">Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white dark:bg-[#1A1A1A] text-black dark:text-white">
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black break-all">neoip.rosentreter.site</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">A + AAAA</td>
                    <td className="p-2.5 font-sans">IP the connection actually used (Happy Eyeballs)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black break-all">ipv4.neoip.rosentreter.site</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">A 45.137.68.45 (no AAAA)</td>
                    <td className="p-2.5 font-sans">IPv4 only</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black break-all">ipv6.neoip.rosentreter.site</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">AAAA 2a06:de00:401:909b::1 (no A)</td>
                    <td className="p-2.5 font-sans">IPv6 only</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="relative">
              <pre className="bg-[#18181B] text-[#00FF66] p-3.5 sm:p-4 font-mono text-xs md:text-sm overflow-x-auto border-3 border-black">{`# Self-lookup — connection family depends on DNS
curl https://neoip.rosentreter.site/api/
curl https://ipv4.neoip.rosentreter.site/api/
curl https://ipv6.neoip.rosentreter.site/api/

# Lookup a specific IP
curl https://neoip.rosentreter.site/api/8.8.8.8`}</pre>
              <button
                type="button"
                onClick={() => {
                  onCopy(
                    [
                      'curl https://neoip.rosentreter.site/api/',
                      'curl https://ipv4.neoip.rosentreter.site/api/',
                      'curl https://ipv6.neoip.rosentreter.site/api/',
                      'curl https://neoip.rosentreter.site/api/8.8.8.8',
                    ].join('\n'),
                    'curl examples'
                  );
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="mt-2 sm:mt-0 sm:absolute sm:top-3 sm:right-3 neo-btn bg-[#FFE600] dark:bg-[#CCB800] text-black dark:text-white px-3 py-2 min-h-[44px] text-xs font-black flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'COPIED' : 'COPY CURL'}
              </button>
            </div>

            {/* Your IPv4 / IPv6 via family-specific hosts */}
            <div className="neo-box bg-[#FFFDF5] dark:bg-[#2A2A2A] p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-colors duration-200">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400">Your IPv4</div>
                <div className="font-mono text-sm font-bold text-black dark:text-white break-all">
                  {familyIps.loading ? '…' : familyIps.ipv4 ?? 'not available'}
                </div>
                <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all">
                  {API_HOSTS.ipv4}/api/
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400">Your IPv6</div>
                <div className="font-mono text-sm font-bold text-black dark:text-white break-all">
                  {familyIps.loading ? '…' : familyIps.ipv6 ?? 'not available'}
                </div>
                <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 break-all">
                  {API_HOSTS.ipv6}/api/
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint Specification Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF007A] dark:text-[#CC0062]" />
              AVAILABLE API ENDPOINTS
            </h3>

            <div className="overflow-x-auto border-3 border-black">
              <table className="w-full text-left font-mono text-xs border-collapse min-w-[500px]">
                <thead className="bg-[#FFE600] dark:bg-[#CCB800] text-black dark:text-white border-b-2 border-black font-sans font-black uppercase">
                  <tr>
                    <th className="p-2.5 border-r-2 border-black">Method</th>
                    <th className="p-2.5 border-r-2 border-black">Endpoint</th>
                    <th className="p-2.5 border-r-2 border-black">Description</th>
                    <th className="p-2.5">Response Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white dark:bg-[#1A1A1A] text-black dark:text-white">
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black bg-emerald-100 dark:bg-emerald-900">GET</td>
                    <td className="p-2.5 font-bold border-r-2 border-black">/api</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">Returns IP geolocation of the caller</td>
                    <td className="p-2.5">application/json</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black bg-emerald-100 dark:bg-emerald-900">GET</td>
                    <td className="p-2.5 font-bold border-r-2 border-black">/json</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">Alias route for ip-api.com compatibility</td>
                    <td className="p-2.5">application/json</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black bg-emerald-100 dark:bg-emerald-900">GET</td>
                    <td className="p-2.5 font-bold border-r-2 border-black">/api/:query</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">Lookup specific IP or domain (e.g. /api/170.205.81.42)</td>
                    <td className="p-2.5">application/json</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r-2 border-black bg-emerald-100 dark:bg-emerald-900">GET</td>
                    <td className="p-2.5 font-bold border-r-2 border-black">/json/:query</td>
                    <td className="p-2.5 border-r-2 border-black font-sans">Alias route for ip-api lookup</td>
                    <td className="p-2.5">application/json</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Field filtering playground */}
          <div className="neo-box bg-[#FFFDF5] dark:bg-[#2A2A2A] p-3.5 sm:p-4 space-y-3 transition-colors duration-200">
            <h4 className="text-xs font-black uppercase text-black dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#A855F7] dark:text-[#8644C6]" />
              INTERACTIVE FIELD FILTER TESTER (?fields=...)
            </h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              You can request specific response fields by passing a comma-separated list to <code className="bg-black text-white px-1">?fields=</code>.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <input
                type="text"
                value={testFieldQuery}
                onChange={(e) => setTestFieldQuery(e.target.value)}
                placeholder="e.g. status,country,city,lat,lon,query"
                className="flex-1 bg-white dark:bg-[#1A1A1A] text-black dark:text-white border-2 border-black p-2.5 min-h-[44px] font-mono text-xs font-bold focus:outline-none"
              />
              <button
                onClick={handleRunPlaygroundTest}
                disabled={isTesting}
                className="neo-btn bg-[#22C55E] dark:bg-[#1B9E4B] text-black dark:text-white px-4 py-2.5 min-h-[44px] font-black text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                {isTesting ? 'EXECUTING...' : 'RUN REQUEST'}
              </button>
            </div>

            {playgroundResult && (
              <pre className="bg-[#18181B] text-[#38BDF8] p-3 font-mono text-xs overflow-x-auto border-2 border-black max-h-[200px]">
                {playgroundResult}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
