import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3000;

// Trust proxies to get correct client IP behind multi-layer load balancers (Dokploy, Traefik, Nginx, Cloudflare, Cloud Run)
app.set('trust proxy', true);

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite HMR and our UI
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow external sites to use our API
}));

// Compress responses
app.use(compression());

// Apply rate limiting to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  keyGenerator: (req) => getClientIp(req) || req.ip || '127.0.0.1',
  message: { status: 'fail', message: 'Too many requests, please try again later.' }
});

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

interface GeoResponse {
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

const cache = new Map<string, { data: GeoResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function cleanIpString(rawIp: string): string {
  if (!rawIp) return '';
  let ip = rawIp.trim();

  // Handle RFC 7239 Forwarded header "for=" prefix
  if (ip.toLowerCase().startsWith('for=')) {
    ip = ip.substring(4);
  }

  // Strip surrounding quotes
  ip = ip.replace(/^["']|["']$/g, '').trim();

  // Handle square brackets around IPv6, e.g. [2001:db8::1] or [2001:db8::1]:8080
  if (ip.startsWith('[')) {
    const bracketEnd = ip.indexOf(']');
    if (bracketEnd !== -1) {
      ip = ip.substring(1, bracketEnd);
    }
  } else {
    // If IPv4 with port, e.g. 203.0.113.195:49152, strip the port
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
      ip = ip.split(':')[0];
    }
  }

  // Strip ::ffff: IPv4-mapped IPv6 prefix
  ip = ip.replace(/^::ffff:/i, '').trim();

  return ip;
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = cleanIpString(ip);
  if (!clean || clean === '127.0.0.1' || clean === '::1' || clean === 'localhost' || clean === '0.0.0.0') return true;

  // Private IPv4 ranges
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true; // 172.16.0.0 - 172.31.255.255
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(clean)) return true; // 100.64.0.0/10 Carrier Grade NAT
  if (clean.startsWith('169.254.')) return true; // Link-local

  // Private / Reserved IPv6 ranges
  if (/^(fc|fd|fe80|ff00):/i.test(clean)) return true;

  return false;
}

function extractIpCandidates(headerValue: string | string[] | undefined): string[] {
  if (!headerValue) return [];
  const rawStr = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
  return rawStr
    .split(',')
    .map((s) => cleanIpString(s))
    .filter((s) => s.length > 0);
}

function getClientIp(req: Request): string {
  // CRITICAL HEADER ORDER:
  // 1. cf-connecting-ip (Cloudflare edge client IP)
  // 2. true-client-ip (Akamai/Cloudflare client IP)
  // 3. x-forwarded-for (FIRST entry is original client IP; must be checked BEFORE x-real-ip
  //    because reverse proxies like Traefik/Dokploy set x-real-ip to the server's own public IP!)
  // 4. forwarded (RFC 7239)
  // 5. x-real-ip
  // 6. x-client-ip
  // 7. fastly-client-ip
  // 8. x-cluster-client-ip
  const headerKeys = [
    'cf-connecting-ip',
    'true-client-ip',
    'x-forwarded-for',
    'forwarded',
    'x-real-ip',
    'x-client-ip',
    'fastly-client-ip',
    'x-cluster-client-ip'
  ];

  for (const key of headerKeys) {
    const headerVal = req.headers[key];
    const candidates = extractIpCandidates(headerVal);
    for (const candidate of candidates) {
      if (candidate && !isPrivateIp(candidate)) {
        return candidate;
      }
    }
  }

  // Fallback to Express req.ips array (populated when trust proxy is enabled from X-Forwarded-For left to right)
  if (req.ips && Array.isArray(req.ips)) {
    for (const ip of req.ips) {
      const clean = cleanIpString(ip);
      if (clean && !isPrivateIp(clean)) {
        return clean;
      }
    }
  }

  // Fallback to Express req.ip
  if (req.ip) {
    const clean = cleanIpString(req.ip);
    if (clean && !isPrivateIp(clean)) {
      return clean;
    }
  }

  // Fallback to socket remoteAddress
  const remoteAddr = req.socket?.remoteAddress || '';
  const cleanRemote = cleanIpString(remoteAddr);
  if (cleanRemote && !isPrivateIp(cleanRemote)) {
    return cleanRemote;
  }

  return '';
}

async function fetchGeoData(queryIp: string): Promise<GeoResponse> {
  const cacheKey = queryIp.trim().toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Target endpoint URL
  const targetUrl = cacheKey
    ? `http://ip-api.com/json/${encodeURIComponent(cacheKey)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
    : `http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = (await response.json()) as GeoResponse;
      if (data && data.status === 'success') {
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else if (data && data.status === 'fail') {
        return data;
      }
    }
  } catch (err) {
    console.warn('Primary ip-api lookup failed or timed out, attempting fallback...', err);
  }

  // Secondary Fallback: ipwho.is
  try {
    const fallbackUrl = cacheKey
      ? `https://ipwho.is/${encodeURIComponent(cacheKey)}`
      : `https://ipwho.is/`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        const formatted: GeoResponse = {
          status: 'success',
          country: data.country || '',
          countryCode: data.country_code || '',
          region: data.region_code || '',
          regionName: data.region || '',
          city: data.city || '',
          zip: data.postal || '',
          lat: data.latitude || 0,
          lon: data.longitude || 0,
          timezone: data.timezone?.id || '',
          isp: data.connection?.isp || data.connection?.org || '',
          org: data.connection?.org || data.connection?.isp || '',
          as: data.connection?.asn ? `AS${data.connection.asn} ${data.connection.org || ''}` : '',
          query: data.ip || cacheKey
        };
        cache.set(cacheKey, { data: formatted, timestamp: Date.now() });
        return formatted;
      }
    }
  } catch (fallbackErr) {
    console.error('Fallback lookup failed:', fallbackErr);
  }

  return {
    status: 'fail',
    message: 'invalid query',
    query: queryIp || 'unknown'
  };
}

async function handleApiRequest(req: Request, res: Response) {
  const queryParam = (req.params.query || req.query.ip || req.query.query || '').toString().trim();
  const targetIp = queryParam || getClientIp(req);

  const geoData = await fetchGeoData(targetIp);

  // Field filtering if ?fields= passed
  const fieldsParam = (req.query.fields || '').toString().trim();
  if (fieldsParam) {
    const requestedFields = fieldsParam.split(',').map((f) => f.trim());
    const filtered: Record<string, any> = {};
    for (const key of requestedFields) {
      if (key in geoData) {
        filtered[key] = (geoData as any)[key];
      }
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json(filtered);
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.json(geoData);
}

// Routes
app.get('/api', apiLimiter, handleApiRequest);
app.get('/api/json', apiLimiter, handleApiRequest);
app.get('/json', apiLimiter, handleApiRequest);
app.get('/api/json/:query', apiLimiter, handleApiRequest);
app.get('/api/:query', apiLimiter, handleApiRequest);
app.get('/json/:query', apiLimiter, handleApiRequest);

app.get('/api/client-info', apiLimiter, (req, res) => {
  res.json({
    clientIp: getClientIp(req),
    headers: {
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'accept-language': req.headers['accept-language']
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
