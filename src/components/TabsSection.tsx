import React, { useState } from 'react';
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
} from 'lucide-react';
import { GeoResponse } from '../types';

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

  // Generate code snippets
  const getCodeSnippet = () => {
    const origin = window.location.origin;
    const targetUrl = `${origin}/api${currentIp ? `?ip=${currentIp}` : ''}`;

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
                ? 'bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_0px_#FFF]'
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
                ? 'bg-[#FF007A] text-white border-2 border-black shadow-[2px_2px_0px_0px_#FFF]'
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
                ? 'bg-[#06B6D4] text-black border-2 border-black shadow-[2px_2px_0px_0px_#FFF]'
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
          className="bg-[#22C55E] text-black border-2 border-black px-3.5 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 min-h-[44px] hover:bg-[#4ADE80] shrink-0"
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
              <span className="bg-[#22C55E] text-black px-2 py-0.5 border border-black shrink-0">
                200 OK
              </span>
              <span className="break-all">Content-Type: application/json</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="neo-btn bg-[#FFE600] text-black px-3 py-2 text-xs min-h-[44px] font-black flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'COPIED!' : 'COPY JSON'}
              </button>

              <button
                onClick={handleDownloadJson}
                className="neo-btn bg-[#A855F7] text-white px-3 py-2 text-xs min-h-[44px] font-black flex items-center gap-1.5"
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
                    ? 'bg-[#FF007A] text-white'
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
              className="mt-2 sm:mt-0 sm:absolute sm:top-3 sm:right-3 neo-btn bg-[#FFE600] text-black px-3 py-2 min-h-[44px] text-xs font-black flex items-center justify-center gap-1.5 w-full sm:w-auto"
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
          {/* Endpoint Specification Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF007A]" />
              AVAILABLE API ENDPOINTS
            </h3>

            <div className="overflow-x-auto border-3 border-black">
              <table className="w-full text-left font-mono text-xs border-collapse min-w-[500px]">
                <thead className="bg-[#FFE600] text-black border-b-2 border-black font-sans font-black uppercase">
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
              <Sparkles className="w-4 h-4 text-[#A855F7]" />
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
                className="neo-btn bg-[#22C55E] text-black px-4 py-2.5 min-h-[44px] font-black text-xs uppercase flex items-center justify-center gap-1.5"
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
