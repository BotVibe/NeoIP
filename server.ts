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

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') return true;
  if (cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) return true;
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(cleanIp)) return true;
  if (cleanIp.startsWith('169.254.')) return true;
  if (/^fc00:|^fe80:|^fd/i.test(cleanIp)) return true;
  return false;
}

function extractIpCandidates(headerValue: string | string[] | undefined): string[] {
  if (!headerValue) return [];
  const rawStr = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
  return rawStr
    .split(',')
    .map((s) => s.trim().replace(/^::ffff:/, ''))
    .filter((s) => s.length > 0);
}

function getClientIp(req: Request): string {
  // Check headers in order of priority for reverse proxies (Dokploy/Traefik/Nginx/Cloudflare/etc.)
  const headerKeys = [
    'cf-connecting-ip',
    'true-client-ip',
    'x-real-ip',
    'x-client-ip',
    'fastly-client-ip',
    'x-cluster-client-ip',
    'x-forwarded-for',
    'forwarded'
  ];

  for (const key of headerKeys) {
    const headerVal = req.headers[key];
    const candidates = extractIpCandidates(headerVal);
    for (const candidate of candidates) {
      let clean = candidate;
      if (clean.toLowerCase().startsWith('for=')) {
        clean = clean.substring(4).replace(/^"|"$/g, '');
      }
      if (clean && !isPrivateIp(clean)) {
        return clean;
      }
    }
  }

  // Fallback to Express req.ips array (populated when trust proxy is enabled)
  if (req.ips && Array.isArray(req.ips)) {
    for (const ip of req.ips) {
      const clean = ip.replace(/^::ffff:/, '').trim();
      if (clean && !isPrivateIp(clean)) {
        return clean;
      }
    }
  }

  // Fallback to Express req.ip
  if (req.ip) {
    const clean = req.ip.replace(/^::ffff:/, '').trim();
    if (clean && !isPrivateIp(clean)) {
      return clean;
    }
  }

  // Fallback to socket remoteAddress
  const remoteAddr = req.socket?.remoteAddress || '';
  const cleanRemote = remoteAddr.replace(/^::ffff:/, '').trim();
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
