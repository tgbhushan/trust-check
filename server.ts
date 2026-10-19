/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In AI Studio iFrame preview environments, HMR is disabled to prevent WebSocket connection failures
process.env.DISABLE_HMR = 'true';

import http from 'http';
import fs from 'fs';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getVirusTotalUrlId,
  validateUrl,
  validateDomain,
  validateIp,
  validateFileHash,
  detectSensitiveIndicators,
  calculateAssessmentCategory,
  maskIndicator,
  extractHostname,
  queryGoogleDnsOverHttps,
  queryGoogleSafeBrowsing,
  evaluateMultiProviderVerdict,
  areIndicatorsEquivalent,
  validateReportTarget,
} from './src/utils/indicators.ts';
import type {
  UnifiedReport,
  IndicatorType,
  EngineResult,
  EngineStats,
  TechnicalMetadata,
  OwnerDiagnostics,
  GoogleDnsResult,
  GoogleSafeBrowsingResult,
  ProviderAvailability,
  AssessmentCategory,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ---------------------------------------------------------------------------
// Cross-Origin Resource Sharing (CORS) Middleware
// Enables external clients (such as GitHub Pages or external frontends)
// to query the Express threat intelligence endpoints safely.
// ---------------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Server Start Time for Uptime Diagnostics
const serverStartTime = Date.now();

// Runtime VirusTotal API Key (can be provided via env or configured by Owner at runtime)
let runtimeApiKey = (process.env.VIRUSTOTAL_API_KEY || '').trim();
if (runtimeApiKey === 'MY_VIRUSTOTAL_API_KEY') {
  runtimeApiKey = '';
}

// Runtime Google Safe Browsing API Key (can be provided via env or configured by Owner at runtime)
let runtimeSafeBrowsingKey = (
  process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
  process.env.SAFE_BROWSING_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  ''
).trim();
if (runtimeSafeBrowsingKey === 'MY_SAFE_BROWSING_API_KEY') {
  runtimeSafeBrowsingKey = '';
}

// ---------------------------------------------------------------------------
// 1. OWNER AUTHENTICATION (Salted PBKDF2 PIN & Secure Sessions)
// ---------------------------------------------------------------------------

function hashPin(pin: string, salt: string): string {
  return crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
}

// Default owner PIN '2026' (Academic Session 2026–2027) or from OWNER_PIN env
let ownerPinSalt = crypto.randomBytes(16).toString('hex');
let ownerPinHash = hashPin(process.env.OWNER_PIN || '2026', ownerPinSalt);
let isInitialSetupComplete = Boolean(process.env.OWNER_PIN);

// Active Owner Sessions: token -> { createdAt, expiresAt }
const ownerSessions = new Map<string, { createdAt: number; expiresAt: number }>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// Login rate limiting & lockout tracker: ip -> { attempts, lockedUntil }
const loginAttemptTracker = new Map<string, { attempts: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control chars
    .trim();
}

// Authentication Middleware for Owner Endpoints
function requireOwnerAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.['trustcheck_owner_session'] || (req.headers['authorization']?.replace('Bearer ', ''));

  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Owner authentication required.' });
    return;
  }

  const session = ownerSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) ownerSessions.delete(token);
    res.clearCookie('trustcheck_owner_session');
    res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' });
    return;
  }

  next();
}

// POST /api/owner/login
app.post('/api/owner/login', (req: Request, res: Response): void => {
  const { pin } = req.body;
  const clientIp = getClientIp(req);
  const now = Date.now();

  const tracker = loginAttemptTracker.get(clientIp) || { attempts: 0, lockedUntil: 0 };
  if (now < tracker.lockedUntil) {
    const remainingSeconds = Math.ceil((tracker.lockedUntil - now) / 1000);
    res.status(429).json({
      error: 'ACCOUNT_LOCKED',
      message: `Too many failed attempts. Login locked for ${remainingSeconds} seconds.`,
      remainingSeconds,
    });
    return;
  }

  if (typeof pin !== 'string' || !pin.trim()) {
    res.status(400).json({ error: 'INVALID_PIN', message: 'PIN is required.' });
    return;
  }

  const inputHash = hashPin(pin.trim(), ownerPinSalt);
  if (!crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(ownerPinHash, 'hex'))) {
    tracker.attempts += 1;
    if (tracker.attempts >= MAX_LOGIN_ATTEMPTS) {
      tracker.lockedUntil = now + LOCKOUT_DURATION_MS;
      tracker.attempts = 0;
      loginAttemptTracker.set(clientIp, tracker);
      recordSanitizedError('AUTH_LOCKOUT', `Multiple failed owner login attempts from ${clientIp.slice(0, 7)}...`);
      res.status(429).json({
        error: 'ACCOUNT_LOCKED',
        message: 'Too many failed login attempts. Locked for 5 minutes.',
        remainingSeconds: 300,
      });
      return;
    }
    loginAttemptTracker.set(clientIp, tracker);
    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Incorrect owner PIN.',
      remainingAttempts: MAX_LOGIN_ATTEMPTS - tracker.attempts,
    });
    return;
  }

  // Login successful
  loginAttemptTracker.delete(clientIp);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  ownerSessions.set(sessionToken, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });

  res.cookie('trustcheck_owner_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });

  res.json({
    success: true,
    message: 'Owner authenticated successfully.',
    sessionToken,
  });
});

// POST /api/owner/setup (Set custom PIN)
app.post('/api/owner/setup', (req: Request, res: Response): void => {
  const { currentPin, newPin } = req.body;

  if (typeof newPin !== 'string' || newPin.trim().length < 4) {
    res.status(400).json({ error: 'WEAK_PIN', message: 'PIN must be at least 4 digits.' });
    return;
  }

  if (isInitialSetupComplete) {
    const inputHash = hashPin((currentPin || '').trim(), ownerPinSalt);
    if (!crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(ownerPinHash, 'hex'))) {
      res.status(401).json({ error: 'INVALID_CURRENT_PIN', message: 'Current PIN is incorrect.' });
      return;
    }
  }

  ownerPinSalt = crypto.randomBytes(16).toString('hex');
  ownerPinHash = hashPin(newPin.trim(), ownerPinSalt);
  isInitialSetupComplete = true;

  res.json({ success: true, message: 'Owner PIN updated successfully.' });
});

// POST /api/owner/logout
app.post('/api/owner/logout', (req: Request, res: Response): void => {
  const token = req.cookies?.['trustcheck_owner_session'] || (req.headers['authorization']?.replace('Bearer ', ''));
  if (token) {
    ownerSessions.delete(token);
  }
  res.clearCookie('trustcheck_owner_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/owner/status (Checks authentication state)
app.get('/api/owner/status', (req: Request, res: Response): void => {
  const token = req.cookies?.['trustcheck_owner_session'] || (req.headers['authorization']?.replace('Bearer ', ''));
  const session = token ? ownerSessions.get(token) : null;
  const isAuthenticated = Boolean(session && Date.now() <= session.expiresAt);

  res.json({
    authenticated: isAuthenticated,
    isInitialSetupComplete,
  });
});

// POST /api/owner/api-key (Configure VirusTotal API Key)
app.post('/api/owner/api-key', requireOwnerAuth, (req: Request, res: Response): void => {
  const { apiKey } = req.body;

  if (typeof apiKey !== 'string') {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'API key must be a string.' });
    return;
  }

  const trimmed = apiKey.trim();
  runtimeApiKey = trimmed;

  recordSanitizedError('CONFIG_CHANGE', trimmed ? 'VirusTotal API key updated by owner' : 'VirusTotal API key cleared by owner');

  res.json({
    success: true,
    hasApiKey: Boolean(trimmed),
    maskedKey: trimmed ? `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}` : null,
    message: trimmed ? 'VirusTotal API key updated in server runtime.' : 'VirusTotal API key cleared.',
  });
});

// POST /api/owner/safebrowsing-key (Configure Google Safe Browsing Key)
app.post('/api/owner/safebrowsing-key', requireOwnerAuth, (req: Request, res: Response): void => {
  const { apiKey } = req.body;

  if (typeof apiKey !== 'string') {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'API key must be a string.' });
    return;
  }

  const trimmed = apiKey.trim();
  runtimeSafeBrowsingKey = trimmed;

  recordSanitizedError(
    'CONFIG_CHANGE',
    trimmed ? 'Google Safe Browsing key updated by owner' : 'Google Safe Browsing key cleared by owner'
  );

  res.json({
    success: true,
    hasSafeBrowsingKey: Boolean(trimmed),
    maskedKey: trimmed ? `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}` : null,
    message: trimmed
      ? 'Google Safe Browsing key updated in server runtime.'
      : 'Google Safe Browsing key cleared.',
  });
});

// ---------------------------------------------------------------------------
// 2. ACTIVE VISITOR SESSION TRACKING (Privacy-Preserving Heartbeat)
// ---------------------------------------------------------------------------

const activeVisitors = new Map<string, number>();

app.post('/api/session/heartbeat', (req: Request, res: Response): void => {
  const { sessionId } = req.body;
  if (typeof sessionId === 'string' && sessionId.trim()) {
    activeVisitors.set(sessionId.slice(0, 36), Date.now());
  }

  // Clean old visitors
  const now = Date.now();
  for (const [id, lastSeen] of activeVisitors.entries()) {
    if (now - lastSeen > 90000) {
      activeVisitors.delete(id);
    }
  }

  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// 3. VIRUSTOTAL API V3 INTEGRATION & EVIDENCE TELEMETRY
// ---------------------------------------------------------------------------

const VT_RATE_LIMIT_PER_MINUTE = 4;
let requestTimestamps: number[] = [];
let recentSanitizedErrors: Array<{ timestamp: string; category: string; message: string }> = [];
let lastApiTestResult: any = null;

function recordSanitizedError(category: string, message: string): void {
  recentSanitizedErrors.unshift({
    timestamp: new Date().toISOString(),
    category,
    message: sanitizeText(message).slice(0, 150),
  });
  if (recentSanitizedErrors.length > 25) recentSanitizedErrors = recentSanitizedErrors.slice(0, 25);
}

function checkRateLimit(): { allowed: boolean; waitSeconds: number; currentCount: number } {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter((ts) => now - ts < 60000);
  if (requestTimestamps.length >= VT_RATE_LIMIT_PER_MINUTE) {
    const oldest = requestTimestamps[0];
    const waitSeconds = Math.max(1, Math.ceil((60000 - (now - oldest)) / 1000));
    return { allowed: false, waitSeconds, currentCount: requestTimestamps.length };
  }
  return { allowed: true, waitSeconds: 0, currentCount: requestTimestamps.length };
}

function recordRequest(): void {
  requestTimestamps.push(Date.now());
}

// In-memory short-term report cache (TTL: 5 minutes)
interface CacheEntry {
  report: UnifiedReport;
  timestamp: number;
}
const reportCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedReport(
  cacheKey: string,
  expectedIndicator?: string,
  type?: IndicatorType
): UnifiedReport | null {
  const entry = reportCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= CACHE_TTL_MS) {
    reportCache.delete(cacheKey);
    return null;
  }
  if (expectedIndicator && entry.report.indicator) {
    if (!areIndicatorsEquivalent(expectedIndicator, entry.report.indicator, type || 'url')) {
      reportCache.delete(cacheKey);
      return null;
    }
  }
  return entry.report;
}

function setCachedReport(cacheKey: string, report: UnifiedReport): void {
  reportCache.set(cacheKey, { report, timestamp: Date.now() });
}

async function callVirusTotal(
  endpoint: string,
  apiKey: string,
  method = 'GET',
  body?: any,
  timeoutMs = 6000
) {
  const url = `https://www.virustotal.com/api/v3${endpoint}`;
  const headers: Record<string, string> = {
    'x-apikey': apiKey,
    'Accept': 'application/json',
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body) {
    if (typeof body === 'string') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, options);
    clearTimeout(timer);
    const responseData = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError';
    return {
      status: isTimeout ? 504 : 500,
      ok: false,
      data: null,
      error: isTimeout ? 'TIMEOUT' : (err?.message || 'Network error'),
    };
  }
}

function normalizeVtResponse(
  rawVtData: any,
  indicator: string,
  indicatorType: IndicatorType,
  isExpanded = false
): UnifiedReport {
  const attributes = rawVtData?.data?.attributes || {};
  const lastStats = attributes.last_analysis_stats || {
    malicious: 0,
    suspicious: 0,
    harmless: 0,
    undetected: 0,
  };

  const stats: EngineStats = {
    malicious: Number(lastStats.malicious || 0),
    suspicious: Number(lastStats.suspicious || 0),
    harmless: Number(lastStats.harmless || 0),
    undetected: Number(lastStats.undetected || 0),
    timeout: Number(lastStats.timeout || 0),
  };

  const engines: EngineResult[] = [];
  const rawResults = attributes.last_analysis_results || {};
  for (const [engineName, res] of Object.entries(rawResults) as [string, any][]) {
    engines.push({
      engine_name: engineName,
      category: res.category || 'undetected',
      result: res.result || null,
      method: res.method || 'signature',
    });
  }

  const assessment = calculateAssessmentCategory(stats);

  let assessment_summary = '';
  if (assessment === 'malicious') {
    assessment_summary = `Multiple independent security vendors (${stats.malicious}) report confirmed malicious indicators for this item. Treat it as potentially dangerous and verify it independently before interacting with it.`;
  } else if (assessment === 'conflicting') {
    const flagged = engines.filter((e) => e.category === 'malicious' || e.category === 'suspicious');
    const flaggedDetail = flagged.map((f) => `${f.engine_name}: ${f.result || f.category}`).join(', ') || 'one vendor';
    assessment_summary = `Conflicting evidence: 1 security vendor flagged this URL (${flaggedDetail}), while ${stats.harmless} vendors reported harmless and ${stats.undetected} reported undetected. This isolated detection is visible below and should neither be treated as definitive malware nor dismissed as safe without independent verification.`;
  } else if (assessment === 'suspicious') {
    assessment_summary = `Available threat intelligence reports suspicious indicators (${stats.suspicious} vendors) for this item. Heuristic or reputation algorithms flag anomalous behavioral traits.`;
  } else if (assessment === 'no_detections') {
    assessment_summary = 'No malicious or suspicious detections were reported in the available data for this item. This does not prove that it is safe.';
  } else {
    assessment_summary = 'Available threat intelligence data is inconclusive or incomplete. Absence of telemetry provides zero evidence of safety.';
  }

  const technical_metadata: TechnicalMetadata = {};
  if (attributes.as_owner) technical_metadata.as_owner = attributes.as_owner;
  if (attributes.asn) technical_metadata.asn = `AS${attributes.asn}`;
  if (attributes.country) technical_metadata.country = attributes.country;
  if (attributes.registrar) technical_metadata.registrar = attributes.registrar;
  if (attributes.creation_date) {
    technical_metadata.creation_date = new Date(attributes.creation_date * 1000).toISOString();
  }
  if (attributes.last_dns_records && Array.isArray(attributes.last_dns_records)) {
    technical_metadata.last_dns_records = attributes.last_dns_records.slice(0, 8).map((r: any) => ({
      type: r.type || 'A',
      value: r.value || '',
      ttl: r.ttl,
    }));
  }
  if (attributes.jarm) technical_metadata.jarm = attributes.jarm;
  if (attributes.size) technical_metadata.file_size = attributes.size;
  if (attributes.type_description) technical_metadata.file_type = attributes.type_description;
  if (attributes.meaningful_name) technical_metadata.meaningful_name = attributes.meaningful_name;
  if (attributes.md5) technical_metadata.md5 = attributes.md5;
  if (attributes.sha1) technical_metadata.sha1 = attributes.sha1;
  if (attributes.sha256) technical_metadata.sha256 = attributes.sha256;
  if (attributes.times_submitted) technical_metadata.times_submitted = attributes.times_submitted;
  if (attributes.first_submission_date) {
    technical_metadata.first_submission_date = new Date(attributes.first_submission_date * 1000).toISOString();
  }
  if (attributes.last_submission_date) {
    technical_metadata.last_submission_date = new Date(attributes.last_submission_date * 1000).toISOString();
  }

  const permalink = rawVtData?.data?.links?.self || `https://www.virustotal.com/gui/${indicatorType}/${encodeURIComponent(indicator)}`;

  const limitations = [
    'Threat intelligence reflects detections known to reporting security vendors at query time.',
    'A "No detections reported" verdict does NOT prove safety; targeted, private, or novel zero-day attacks often evade public feeds.',
  ];

  const warnings: string[] = [];
  if (assessment === 'malicious') {
    warnings.push('Multiple independent malicious detections reported. Do NOT enter credentials, submit payments, or execute files from this indicator.');
  } else if (assessment === 'conflicting') {
    warnings.push('Conflicting evidence: an isolated vendor flagged this URL while other engines reported harmless/undetected. Verify independently before taking action.');
  } else if (stats.suspicious > 0) {
    warnings.push('Suspicious indicators reported. Verify legitimacy independently through official contact channels.');
  }

  const report: UnifiedReport = {
    id: `vt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    indicator,
    raw_indicator_masked: maskIndicator(indicator, indicatorType),
    indicator_type: indicatorType,
    assessment,
    assessment_summary,
    timestamp: new Date().toISOString(),
    is_live: true,
    is_simulated: false,
    provider: 'VirusTotal API v3',
    stats,
    engines,
    categories: attributes.categories || {},
    tags: attributes.tags || [],
    reputation: attributes.reputation,
    permalink,
    technical_metadata,
    limitations,
    warnings,
  };

  if (indicatorType === 'url') {
    report.url_findings = {
      final_url: attributes.last_final_url || indicator,
      status_code: attributes.last_http_response_code,
      title: attributes.title,
    };
  }

  return report;
}

function buildMultiProviderReport(params: {
  indicator: string;
  indicatorType: IndicatorType;
  dnsEvidence?: GoogleDnsResult;
  safeBrowsingEvidence?: GoogleSafeBrowsingResult;
  providerAvailability: ProviderAvailability;
  warnings?: string[];
}): UnifiedReport {
  const engines: EngineResult[] = [];
  if (safeBrowsingEvidence && safeBrowsingEvidence.configured) {
    engines.push({
      engine_name: 'Google Safe Browsing',
      category: safeBrowsingEvidence.status === 'threat_found' ? 'malicious' : 'harmless',
      result:
        safeBrowsingEvidence.status === 'threat_found'
          ? safeBrowsingEvidence.matches?.map((m) => m.threatType).join(', ')
          : 'Clean / No Threat Match',
      method: 'threat_list_lookup',
    });
  }

  if (dnsEvidence && dnsEvidence.status !== 'error') {
    engines.push({
      engine_name: 'Google Public DNS',
      category: dnsEvidence.status === 'nxdomain' ? 'suspicious' : 'harmless',
      result:
        dnsEvidence.status === 'resolved'
          ? `Resolved to ${dnsEvidence.ipAddresses?.length || 0} IP(s)`
          : dnsEvidence.status.toUpperCase(),
      method: 'dns_resolution',
    });
  }

  const malCount = safeBrowsingEvidence?.status === 'threat_found' ? 1 : 0;
  const suspCount = dnsEvidence?.status === 'nxdomain' ? 1 : 0;
  const harmlessCount =
    (safeBrowsingEvidence?.status === 'safe' ? 1 : 0) +
    (dnsEvidence?.status === 'resolved' ? 1 : 0);

  const verdict = evaluateMultiProviderVerdict({
    stats: {
      malicious: malCount,
      suspicious: suspCount,
      harmless: harmlessCount,
      undetected: 0,
    },
    engines,
    safeBrowsingEvidence,
    dnsEvidence,
  });

  const stats: EngineStats = {
    malicious: malCount,
    suspicious: suspCount,
    harmless: harmlessCount,
    undetected: 0,
    timeout: 0,
  };

  const limitations = [
    `VirusTotal feed: ${providerAvailability.virusTotal.status} (${providerAvailability.virusTotal.message || 'not queried'}).`,
    'Threat intelligence reflects only data known to participating security vendors at query time.',
    'A "No detections reported" verdict does NOT prove safety; targeted, private, or novel zero-day attacks often evade public feeds.',
  ];

  const warnings: string[] = params.warnings ? [...params.warnings] : [];
  for (const w of verdict.warnings) {
    if (!warnings.includes(w)) warnings.push(w);
  }
  if (providerAvailability.virusTotal.status === 'rate_limited') {
    warnings.push(
      `VirusTotal public quota reached (limit: 4 req/min). Available to re-query in ${providerAvailability.virusTotal.retryAfterSeconds || 15}s.`
    );
  } else if (providerAvailability.virusTotal.status === 'unconfigured') {
    warnings.push('VirusTotal API key is unconfigured on server; assessment relies on Google Safe Browsing and DNS.');
  }

  return {
    id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    indicator,
    raw_indicator_masked: maskIndicator(indicator, indicatorType),
    indicator_type: indicatorType,
    assessment: verdict.assessment,
    assessment_summary: verdict.assessment_summary,
    timestamp: new Date().toISOString(),
    is_live: true,
    is_simulated: false,
    provider: safeBrowsingEvidence?.configured
      ? 'Google Safe Browsing + Google Public DNS'
      : 'Google Public DNS (DoH)',
    stats,
    engines,
    dns_evidence: dnsEvidence,
    safe_browsing_evidence: safeBrowsingEvidence,
    provider_availability: providerAvailability,
    limitations,
    warnings,
  };
}

// POST /api/investigate (Provider-independent public investigation API)
app.post('/api/investigate', async (req: Request, res: Response): Promise<void> => {
  const { indicator, indicatorType, mode = 'standard', userConsented } = req.body;

  if (!userConsented) {
    res.status(403).json({
      error: 'CONSENT_REQUIRED',
      message: 'Explicit user consent is mandatory before sending indicators to external threat intelligence providers.',
    });
    return;
  }

  const validTypes: IndicatorType[] = ['url', 'domain', 'ip', 'file'];
  if (!validTypes.includes(indicatorType)) {
    res.status(400).json({ error: 'INVALID_TYPE', message: `Invalid indicator type "${indicatorType}".` });
    return;
  }

  let normalizedIndicator = '';
  if (indicatorType === 'url') {
    const urlCheck = validateUrl(indicator || '');
    if (!urlCheck.valid || !urlCheck.normalized) {
      res.status(400).json({ error: 'INVALID_URL', message: urlCheck.error || 'Invalid URL.' });
      return;
    }
    normalizedIndicator = urlCheck.normalized;
  } else if (indicatorType === 'domain') {
    const domainCheck = validateDomain(indicator || '');
    if (!domainCheck.valid || !domainCheck.normalized) {
      res.status(400).json({ error: 'INVALID_DOMAIN', message: domainCheck.error || 'Invalid domain.' });
      return;
    }
    normalizedIndicator = domainCheck.normalized;
  } else if (indicatorType === 'ip') {
    const ipCheck = validateIp(indicator || '');
    if (!ipCheck.valid || !ipCheck.normalized) {
      res.status(400).json({ error: 'INVALID_IP', message: ipCheck.error || 'Invalid IP address.' });
      return;
    }
    normalizedIndicator = ipCheck.normalized;
  } else if (indicatorType === 'file') {
    const fileCheck = validateFileHash(indicator || '');
    if (!fileCheck.valid || !fileCheck.normalized) {
      res.status(400).json({ error: 'INVALID_HASH', message: fileCheck.error || 'Invalid SHA-256 hash.' });
      return;
    }
    normalizedIndicator = fileCheck.normalized;
  }

  // Sensitive Indicator Check (strips credentials, tokens, private RFC 1918 IPs)
  const sensitiveCheck = detectSensitiveIndicators(normalizedIndicator, indicatorType);
  if (sensitiveCheck.isSensitive) {
    res.status(400).json({
      error: 'SENSITIVE_INDICATOR_BLOCKED',
      message: sensitiveCheck.reason,
      detectedTokens: sensitiveCheck.detectedTokens,
      sanitizedSuggestion: sensitiveCheck.sanitizedSuggestion,
    });
    return;
  }

  // Check Cache first
  const cacheKey = `${indicatorType}:${mode}:${normalizedIndicator}`;
  const cached = getCachedReport(cacheKey, normalizedIndicator, indicatorType);

  // 1. Resolve domain existence via Google Public DNS over HTTPS (DoH)
  const host = extractHostname(normalizedIndicator, indicatorType);
  let dnsEvidence: GoogleDnsResult | undefined = undefined;
  if (host) {
    try {
      dnsEvidence = await queryGoogleDnsOverHttps(host);
    } catch {
      // Tolerate failure
    }
  }

  // 2. Check against Google Safe Browsing Lookup API v4
  let safeBrowsingEvidence: GoogleSafeBrowsingResult | undefined = undefined;
  const activeSbKey =
    runtimeSafeBrowsingKey ||
    (
      process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
      process.env.SAFE_BROWSING_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    ).trim();

  if (indicatorType === 'url') {
    try {
      safeBrowsingEvidence = await queryGoogleSafeBrowsing(normalizedIndicator, activeSbKey);
    } catch {
      // Tolerate failure
    }
  } else if (indicatorType === 'domain' && activeSbKey) {
    // Domains can also be inspected via Safe Browsing standard URL format
    try {
      safeBrowsingEvidence = await queryGoogleSafeBrowsing(`https://${normalizedIndicator}/`, activeSbKey);
    } catch {
      // Tolerate failure
    }
  }

  // If cached report is found, refresh live telemetry, re-evaluate multi-provider verdict and return
  if (cached) {
    if (dnsEvidence) cached.dns_evidence = dnsEvidence;
    if (safeBrowsingEvidence) cached.safe_browsing_evidence = safeBrowsingEvidence;
    const verdict = evaluateMultiProviderVerdict({
      stats: cached.stats,
      engines: cached.engines,
      safeBrowsingEvidence: cached.safe_browsing_evidence,
      dnsEvidence: cached.dns_evidence,
    });
    cached.assessment = verdict.assessment;
    cached.assessment_summary = verdict.assessment_summary;
    for (const w of verdict.warnings) {
      if (!cached.warnings.includes(w)) {
        cached.warnings.push(w);
      }
    }
    res.json({ report: cached, cached: true });
    return;
  }

  // 3. Evaluate VirusTotal Provider independently
  const activeKey = runtimeApiKey || (process.env.VIRUSTOTAL_API_KEY || '').trim();
  const hasVtKey = Boolean(activeKey && activeKey !== 'MY_VIRUSTOTAL_API_KEY');

  let vtAvailability: ProviderAvailability['virusTotal'] = {
    status: 'unconfigured',
    message: 'VirusTotal API key is not configured on the server.',
  };
  let vtResult: any = null;

  if (!hasVtKey) {
    vtAvailability = {
      status: 'unconfigured',
      message: 'VirusTotal API key is unconfigured. Showing Google Safe Browsing and DNS telemetry.',
    };
  } else {
    // Check Rate Limiting (4 req/min for public tier)
    const rateLimitStatus = checkRateLimit();
    if (!rateLimitStatus.allowed) {
      recordSanitizedError('RATE_LIMIT', `Rate limit triggered. Wait ${rateLimitStatus.waitSeconds}s`);
      vtAvailability = {
        status: 'rate_limited',
        message: `VirusTotal Public API quota reached (limit: 4 req/min). Available in ${rateLimitStatus.waitSeconds}s.`,
        retryAfterSeconds: rateLimitStatus.waitSeconds,
      };
    } else {
      try {
        recordRequest();
        if (indicatorType === 'url') {
          const vtUrlId = getVirusTotalUrlId(normalizedIndicator);
          vtResult = await callVirusTotal(`/urls/${vtUrlId}`, activeKey);

          // If 404, check alternate trailing slash representation
          if (vtResult.status === 404) {
            let altUrl = '';
            if (normalizedIndicator.endsWith('/')) {
              altUrl = normalizedIndicator.slice(0, -1);
            } else if (!normalizedIndicator.includes('?') && !normalizedIndicator.includes('#')) {
              altUrl = `${normalizedIndicator}/`;
            }
            if (altUrl) {
              const altId = getVirusTotalUrlId(altUrl);
              const altRes = await callVirusTotal(`/urls/${altId}`, activeKey);
              if (altRes.ok && altRes.data) {
                vtResult = altRes;
                normalizedIndicator = altUrl;
              }
            }
          }
        } else if (indicatorType === 'domain') {
          vtResult = await callVirusTotal(`/domains/${encodeURIComponent(normalizedIndicator)}`, activeKey);
        } else if (indicatorType === 'ip') {
          vtResult = await callVirusTotal(`/ip_addresses/${encodeURIComponent(normalizedIndicator)}`, activeKey);
        } else if (indicatorType === 'file') {
          vtResult = await callVirusTotal(`/files/${encodeURIComponent(normalizedIndicator)}`, activeKey);
        }

        if (vtResult.status === 404) {
          vtAvailability = {
            status: 'not_found',
            message: 'No existing historical report was found in VirusTotal.',
          };
        } else if (vtResult.status === 401 || vtResult.status === 403) {
          recordSanitizedError('AUTH_REJECTED', 'VirusTotal rejected the configured API key.');
          vtAvailability = {
            status: 'error',
            message: 'VirusTotal API key was rejected as invalid or unauthorized.',
          };
        } else if (vtResult.status === 504 || vtResult.error === 'TIMEOUT') {
          recordSanitizedError('UPSTREAM_TIMEOUT', 'VirusTotal API request timed out after 6s.');
          vtAvailability = {
            status: 'timeout',
            message: 'VirusTotal API request timed out.',
          };
        } else if (!vtResult.ok || !vtResult.data) {
          recordSanitizedError('UPSTREAM_ERROR', `Status ${vtResult.status}`);
          vtAvailability = {
            status: 'error',
            message: `VirusTotal upstream returned status ${vtResult.status}.`,
          };
        } else {
          vtAvailability = {
            status: 'available',
            message: 'Historical analysis verified across 70+ security vendors.',
          };
        }
      } catch (err: any) {
        recordSanitizedError('VT_ERROR', err?.message || 'Error querying VirusTotal');
        vtAvailability = {
          status: 'error',
          message: err?.message || 'Error querying VirusTotal',
        };
      }
    }
  }

  // Construct complete Provider Availability overview
  const providerAvailability: ProviderAvailability = {
    virusTotal: vtAvailability,
    safeBrowsing: {
      status: safeBrowsingEvidence?.status || (activeSbKey ? 'safe' : 'not_configured'),
      message: safeBrowsingEvidence?.message,
    },
    googleDns: {
      status: dnsEvidence?.status || (host ? 'error' : 'not_applicable'),
      message: dnsEvidence?.message,
    },
  };

  // CASE 1: VirusTotal returned an authoritative report
  if (vtAvailability.status === 'available' && vtResult?.data) {
    const report = normalizeVtResponse(vtResult.data, normalizedIndicator, indicatorType, mode === 'expanded');
    report.dns_evidence = dnsEvidence;
    report.safe_browsing_evidence = safeBrowsingEvidence;
    report.provider_availability = providerAvailability;

    // Cross-verify with Google Safe Browsing and DNS using independent multi-provider evaluation
    const verdict = evaluateMultiProviderVerdict({
      stats: report.stats,
      engines: report.engines,
      safeBrowsingEvidence,
      dnsEvidence,
    });
    report.assessment = verdict.assessment;
    report.assessment_summary = verdict.assessment_summary;
    for (const w of verdict.warnings) {
      if (!report.warnings.includes(w)) {
        report.warnings.push(w);
      }
    }

    setCachedReport(cacheKey, report);
    res.json({ report });
    return;
  }

  // CASE 2: VirusTotal returned 404 (Not Found)
  if (vtAvailability.status === 'not_found') {
    // If Google Safe Browsing detected a threat, provide the verified threat report!
    if (safeBrowsingEvidence?.status === 'threat_found') {
      const report = buildMultiProviderReport({
        indicator: normalizedIndicator,
        indicatorType,
        dnsEvidence,
        safeBrowsingEvidence,
        providerAvailability,
      });
      res.json({ report });
      return;
    }

    // Otherwise, return honest unindexed status preserving URL submission CTA
    res.status(200).json({
      notFound: true,
      indicator: normalizedIndicator,
      indicatorType,
      message: 'No existing historical report was found in VirusTotal. The safety of this website could not be determined.',
      canSubmitScan: indicatorType === 'url',
      dnsEvidence,
      safeBrowsingEvidence,
      providerAvailability,
    });
    return;
  }

  // CASE 3: VirusTotal is unconfigured, rate-limited, or errored, BUT Google feeds have evidence!
  const hasAlternativeEvidence =
    (safeBrowsingEvidence && safeBrowsingEvidence.status !== 'not_configured' && safeBrowsingEvidence.status !== 'error') ||
    (dnsEvidence && (dnsEvidence.status === 'resolved' || dnsEvidence.status === 'nxdomain'));

  if (hasAlternativeEvidence) {
    const report = buildMultiProviderReport({
      indicator: normalizedIndicator,
      indicatorType,
      dnsEvidence,
      safeBrowsingEvidence,
      providerAvailability,
    });
    res.json({
      report,
      partialEvidence: true,
      rateLimited: vtAvailability.status === 'rate_limited',
      retryAfterSeconds: vtAvailability.retryAfterSeconds,
    });
    return;
  }

  // CASE 4: Absolute failure (no provider could provide telemetry)
  if (vtAvailability.status === 'rate_limited') {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: vtAvailability.message,
      retryAfterSeconds: vtAvailability.retryAfterSeconds,
      dnsEvidence,
      safeBrowsingEvidence,
      providerAvailability,
      canUseDemo: true,
    });
    return;
  }

  if (vtAvailability.status === 'unconfigured') {
    res.status(503).json({
      error: 'MISSING_API_KEY',
      message: 'Threat intelligence providers are unconfigured on the server.',
      dnsEvidence,
      safeBrowsingEvidence,
      providerAvailability,
      canUseDemo: true,
    });
    return;
  }

  res.status(502).json({
    error: 'UPSTREAM_ERROR',
    message: vtAvailability.message || 'Threat intelligence providers were temporarily unavailable.',
    dnsEvidence,
    safeBrowsingEvidence,
    providerAvailability,
    canUseDemo: true,
  });
});

// POST /api/scan-url (Submit a URL for fresh analysis)
app.post('/api/scan-url', async (req: Request, res: Response): Promise<void> => {
  const { url, userConsented } = req.body;

  if (!userConsented) {
    res.status(403).json({
      error: 'CONSENT_REQUIRED',
      message: 'Explicit user consent is mandatory before submitting a URL to VirusTotal for public scanning.',
    });
    return;
  }

  const urlCheck = validateUrl(url || '');
  if (!urlCheck.valid || !urlCheck.normalized) {
    res.status(400).json({ error: 'INVALID_URL', message: urlCheck.error || 'Invalid URL format.' });
    return;
  }
  const normalizedUrl = urlCheck.normalized;

  const sens = detectSensitiveIndicators(normalizedUrl, 'url');
  if (sens.isSensitive) {
    res.status(400).json({
      error: 'SENSITIVE_INDICATOR_BLOCKED',
      message: sens.reason,
    });
    return;
  }

  const activeKey = runtimeApiKey || (process.env.VIRUSTOTAL_API_KEY || '').trim();
  if (!activeKey || activeKey === 'MY_VIRUSTOTAL_API_KEY') {
    res.status(503).json({
      error: 'MISSING_API_KEY',
      message: 'VirusTotal API key is not configured on the server.',
    });
    return;
  }

  const rateLimitStatus = checkRateLimit();
  if (!rateLimitStatus.allowed) {
    recordSanitizedError('RATE_LIMIT', `Rate limit triggered during URL scan. Wait ${rateLimitStatus.waitSeconds}s`);
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `VirusTotal Public API quota reached. Please retry in ${rateLimitStatus.waitSeconds} seconds.`,
      retryAfterSeconds: rateLimitStatus.waitSeconds,
    });
    return;
  }

  try {
    recordRequest();
    // Submit URL to VirusTotal v3 POST /urls
    const submitResult = await callVirusTotal('/urls', activeKey, 'POST', `url=${encodeURIComponent(normalizedUrl)}`);

    if (submitResult.status === 401 || submitResult.status === 403) {
      res.status(401).json({
        error: 'AUTHENTICATION_FAILED',
        message: 'VirusTotal API key was rejected as invalid or unauthorized.',
      });
      return;
    }

    if (!submitResult.ok || !submitResult.data) {
      res.status(502).json({
        error: 'SUBMISSION_FAILED',
        message: 'VirusTotal rejected the scan submission request.',
      });
      return;
    }

    const analysisId = submitResult.data?.data?.id;

    // Fetch DNS and Safe Browsing evidence in background
    const host = extractHostname(normalizedUrl, 'url');
    const dnsEvidence = host ? await queryGoogleDnsOverHttps(host) : undefined;
    const safeBrowsingKey =
      runtimeSafeBrowsingKey ||
      (
        process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
        process.env.SAFE_BROWSING_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        ''
      ).trim();
    const safeBrowsingEvidence = await queryGoogleSafeBrowsing(normalizedUrl, safeBrowsingKey);

    // Give VirusTotal a moment to process (3.5 seconds)
    if (analysisId) {
      await new Promise((r) => setTimeout(r, 3500));
    }

    // Now attempt to fetch the URL report
    const vtUrlId = getVirusTotalUrlId(normalizedUrl);
    const reportResult = await callVirusTotal(`/urls/${vtUrlId}`, activeKey);

    if (reportResult.ok && reportResult.data) {
      const report = normalizeVtResponse(reportResult.data, normalizedUrl, 'url', false);
      report.dns_evidence = dnsEvidence;
      report.safe_browsing_evidence = safeBrowsingEvidence;
      const cacheKey = `url:standard:${normalizedUrl}`;
      setCachedReport(cacheKey, report);
      res.json({
        success: true,
        report,
        message: 'URL scanned successfully. Live threat intelligence report generated.',
      });
      return;
    }

    // If report is still in queue, provide honest queued status
    res.json({
      success: true,
      queued: true,
      analysisId,
      dnsEvidence,
      safeBrowsingEvidence,
      message: 'URL submitted to VirusTotal scanning queue. Analysis is currently running.',
    });
  } catch (err: any) {
    recordSanitizedError('SCAN_ERROR', err?.message || 'Error submitting scan');
    res.status(500).json({
      error: 'SCAN_ERROR',
      message: 'Failed to complete URL analysis submission.',
    });
  }
});

// POST /api/owner/test-safebrowsing (Owner tests Google Safe Browsing connectivity)
let lastSafeBrowsingTestResult: any = null;
app.post('/api/owner/test-safebrowsing', requireOwnerAuth, async (req: Request, res: Response): Promise<void> => {
  const activeSbKey =
    runtimeSafeBrowsingKey ||
    (
      process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
      process.env.SAFE_BROWSING_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    ).trim();
  const startTime = Date.now();

  if (!activeSbKey || activeSbKey === 'MY_SAFE_BROWSING_API_KEY') {
    lastSafeBrowsingTestResult = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      message: 'GOOGLE_SAFE_BROWSING_API_KEY is not configured on the server.',
      latencyMs: 0,
    };
    res.json(lastSafeBrowsingTestResult);
    return;
  }

  try {
    const testResult = await queryGoogleSafeBrowsing('https://google.com/', activeSbKey);
    const latencyMs = Date.now() - startTime;

    if (testResult.status === 'safe' || testResult.status === 'threat_found') {
      lastSafeBrowsingTestResult = {
        timestamp: new Date().toISOString(),
        status: 'ok',
        statusCode: 200,
        message: `Successfully connected to Google Safe Browsing API v4. Latency: ${latencyMs}ms.`,
        latencyMs,
      };
    } else {
      lastSafeBrowsingTestResult = {
        timestamp: new Date().toISOString(),
        status: 'failed',
        statusCode: testResult.status === 'error' ? 401 : 429,
        message: testResult.message,
        latencyMs,
      };
    }
  } catch {
    lastSafeBrowsingTestResult = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      message: 'Could not contact Google Safe Browsing endpoint.',
      latencyMs: Date.now() - startTime,
    };
  }

  res.json(lastSafeBrowsingTestResult);
});

// POST /api/owner/test-api (Owner tests VirusTotal connectivity)
app.post('/api/owner/test-api', requireOwnerAuth, async (req: Request, res: Response): Promise<void> => {
  const activeKey = runtimeApiKey || (process.env.VIRUSTOTAL_API_KEY || '').trim();
  const startTime = Date.now();

  if (!activeKey || activeKey === 'MY_VIRUSTOTAL_API_KEY') {
    lastApiTestResult = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      category: 'MISSING_KEY',
      message: 'VIRUSTOTAL_API_KEY is not configured on the server.',
      latencyMs: 0,
    };
    res.json(lastApiTestResult);
    return;
  }

  try {
    // Perform standard harmless IP test lookup on Cloudflare DNS 1.1.1.1
    const result = await callVirusTotal('/ip_addresses/1.1.1.1', activeKey);
    const latencyMs = Date.now() - startTime;

    if (result.ok) {
      lastApiTestResult = {
        timestamp: new Date().toISOString(),
        status: 'ok',
        statusCode: result.status,
        category: 'CONNECTED',
        message: `Successfully connected to VirusTotal API v3. Latency: ${latencyMs}ms.`,
        latencyMs,
      };
    } else {
      lastApiTestResult = {
        timestamp: new Date().toISOString(),
        status: 'failed',
        statusCode: result.status,
        category: result.status === 401 ? 'INVALID_KEY' : result.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM_ERROR',
        message: `Connection test failed with HTTP status ${result.status}.`,
        latencyMs,
      };
    }
  } catch (err: any) {
    lastApiTestResult = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      category: 'NETWORK_ERROR',
      message: 'Could not reach VirusTotal API host.',
      latencyMs: Date.now() - startTime,
    };
  }

  res.json(lastApiTestResult);
});

// GET /api/owner/diagnostics (Owner views server health, errors, API quota)
app.get('/api/owner/diagnostics', requireOwnerAuth, (req: Request, res: Response): void => {
  const activeKey = runtimeApiKey || (process.env.VIRUSTOTAL_API_KEY || '').trim();
  const hasApiKey = Boolean(activeKey && activeKey !== 'MY_VIRUSTOTAL_API_KEY');
  const now = Date.now();

  // Clean active visitors count
  let activeVisitorCount = 0;
  for (const [id, lastSeen] of activeVisitors.entries()) {
    if (now - lastSeen <= 90000) {
      activeVisitorCount++;
    } else {
      activeVisitors.delete(id);
    }
  }

  requestTimestamps = requestTimestamps.filter((ts) => now - ts < 60000);

  const activeSbKey =
    runtimeSafeBrowsingKey ||
    (
      process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
      process.env.SAFE_BROWSING_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    ).trim();
  const hasSafeBrowsingKey = Boolean(activeSbKey && activeSbKey !== 'MY_SAFE_BROWSING_API_KEY');

  const diagnostics: OwnerDiagnostics = {
    serverStatus: recentSanitizedErrors.length > 5 ? 'degraded' : 'healthy',
    uptimeSeconds: Math.floor((now - serverStartTime) / 1000),
    hasApiKey,
    keyMasked: hasApiKey ? `${activeKey.slice(0, 4)}••••••••${activeKey.slice(-4)}` : undefined,
    hasSafeBrowsingKey,
    safeBrowsingKeyMasked: hasSafeBrowsingKey
      ? `${activeSbKey.slice(0, 4)}••••••••${activeSbKey.slice(-4)}`
      : undefined,
    lastApiTest: lastApiTestResult,
    lastSafeBrowsingTest: lastSafeBrowsingTestResult,
    recentErrors: recentSanitizedErrors,
    activeVisitorCount,
    requestsThisMinute: requestTimestamps.length,
    cacheEntryCount: reportCache.size,
  };

  res.json(diagnostics);
});

// ---------------------------------------------------------------------------
// 4. SPA CLIENT HOSTING & FALLBACK
// ---------------------------------------------------------------------------

function resolveProductionDist(): { distDir: string; indexPath: string; exists: boolean } {
  // Check candidate locations for the built client bundle across different hosting structures
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, 'dist'),
    path.resolve(__dirname, '..', 'dist'),
    path.resolve(process.cwd(), '..', 'dist'),
  ];

  for (const candidate of candidates) {
    const candidateIndex = path.join(candidate, 'index.html');
    if (fs.existsSync(candidateIndex)) {
      return { distDir: candidate, indexPath: candidateIndex, exists: true };
    }
  }

  // Fallback default
  const defaultDir = path.resolve(process.cwd(), 'dist');
  const defaultIndex = path.join(defaultDir, 'index.html');
  return { distDir: defaultDir, indexPath: defaultIndex, exists: fs.existsSync(defaultIndex) };
}

async function startServer() {
  const httpServer = http.createServer(app);

  // 404 handler for unmatched API routes (prevents API queries from falling through into HTML static routes)
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'ENDPOINT_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const { distDir, exists } = resolveProductionDist();

    if (exists) {
      console.log(`[TRUST//CHECK] Serving production client bundle from: ${distDir}`);
      app.use(express.static(distDir));
    } else {
      console.warn(`[TRUST//CHECK] Production client bundle not found at candidate paths. Checked: ${distDir}`);
    }

    app.get('*', (req: Request, res: Response) => {
      // Re-verify dist location in case build finished after server start
      const current = resolveProductionDist();
      if (current.exists) {
        res.sendFile(current.indexPath, (err) => {
          if (err && !res.headersSent) {
            console.error('[TRUST//CHECK] Error serving index.html:', err.message);
            res.status(500).send('Error serving frontend application.');
          }
        });
      } else {
        res.status(200).type('text/html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TRUST//CHECK — Service Active</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; background: #F5F2EA; color: #111827; padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 80vh; margin: 0; }
      .card { background: #FFFFFF; border: 1px solid #D8DCE2; border-radius: 12px; padding: 32px; max-width: 540px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      h1 { font-size: 20px; font-weight: 800; margin: 0 0 12px; color: #111827; }
      p { font-size: 14px; color: #697386; line-height: 1.6; margin: 0 0 12px; }
      code { background: #F5F2EA; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>TRUST//CHECK Backend Operational</h1>
      <p>The Express threat intelligence server is running on port ${PORT}.</p>
      <p>Frontend assets were not found at <code>dist/index.html</code>. In Render or production hosts, ensure your build command is set to <code>npm run build</code>.</p>
      <p>All API endpoints remain fully functional at <code>/api/*</code>.</p>
    </div>
  </body>
</html>`);
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[TRUST//CHECK] Real Website Security Tool running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TRUST//CHECK] Server initialization error:', err);
  process.exit(1);
});
