/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AssessmentCategory,
  IndicatorType,
  SensitiveCheckResult,
  GoogleDnsResult,
  GoogleSafeBrowsingResult,
} from '../types/index.ts';

/**
 * VirusTotal API v3 URL identifier calculation.
 * According to official docs: The URL identifier is the SHA-256 hash or the base64 representation
 * of the URL without '=' padding characters (URL-safe base64: replace '+' with '-', '/' with '_', strip '=').
 */
export function getVirusTotalUrlId(rawUrl: string): string {
  // Normalize whitespace
  const trimmed = rawUrl.trim();
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(trimmed, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  // Browser fallback
  const base64 = btoa(unescape(encodeURIComponent(trimmed)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Validates whether a string is a standard public HTTP or HTTPS URL.
 * Rejects embedded credentials (user:pass@host) to protect authentication data.
 */
export function validateUrl(input: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty.' };
  }
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length of 2048 characters.' };
  }

  // Auto-prepend https:// if user entered hostname with path or www.
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    if (candidate.startsWith('//')) {
      candidate = 'https:' + candidate;
    } else {
      candidate = 'https://' + candidate;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }
    if (parsed.username || parsed.password) {
      return { valid: false, error: 'URLs with embedded user credentials (user:pass@) are blocked for safety.' };
    }
    if (!parsed.hostname || parsed.hostname.includes(' ') || !parsed.hostname.includes('.')) {
      return { valid: false, error: 'URL must contain a valid domain name with an extension (e.g., example.com).' };
    }
    return { valid: true, normalized: parsed.href };
  } catch {
    return { valid: false, error: 'Malformed URL format.' };
  }
}

/**
 * Validates and normalizes a domain name (FQDN).
 * Rejects URLs entered into domain mode and rejects bare IP addresses.
 */
export function validateDomain(input: string): { valid: boolean; normalized?: string; error?: string } {
  let trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Domain cannot be empty.' };
  }

  // Remove leading protocol and trailing slashes if accidentally included
  trimmed = trimmed.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/:\d+$/, '');

  // Check if it's an IP address
  if (validateIp(trimmed).valid) {
    return { valid: false, error: 'An IP address was entered. Please select the "IP Address" indicator type.' };
  }

  // Validate domain format (RFC 1035 / RFC 1123)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (!domainRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid domain format. Example: "example.com" or "sub.example.org".' };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validates IPv4 or IPv6 addresses.
 */
export function validateIp(input: string): { valid: boolean; normalized?: string; isPrivate?: boolean; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'IP address cannot be empty.' };
  }

  // IPv4 regex with range check (0-255)
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 basic regex
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  const isIpv4 = ipv4Regex.test(trimmed);
  const isIpv6 = ipv6Regex.test(trimmed);

  if (!isIpv4 && !isIpv6) {
    return { valid: false, error: 'Invalid IPv4 or IPv6 format.' };
  }

  // Check for RFC 1918 and loopback addresses
  let isPrivate = false;
  if (isIpv4) {
    const parts = trimmed.split('.').map(Number);
    if (
      parts[0] === 10 || // 10.0.0.0/8
      parts[0] === 127 || // 127.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
      (parts[0] === 169 && parts[1] === 254) // 169.254.0.0/16 Link-local
    ) {
      isPrivate = true;
    }
  } else if (isIpv6) {
    const lower = trimmed.toLowerCase();
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
      isPrivate = true;
    }
  }

  return { valid: true, normalized: trimmed, isPrivate };
}

/**
 * Validates SHA-256 file hashes (64 hex characters).
 */
export function validateFileHash(input: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'File hash cannot be empty.' };
  }

  // Strict SHA-256 check
  const sha256Regex = /^[a-f0-9]{64}$/;
  if (!sha256Regex.test(trimmed)) {
    return {
      valid: false,
      error: 'Please provide a valid 64-character hexadecimal SHA-256 hash. MD5 or SHA-1 can be converted or submitted via SHA-256.',
    };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Sensitive parameter and internal infrastructure heuristic detector.
 * Prevents unintentional disclosure of auth tokens, reset links, session cookies, and private hosts.
 */
const SENSITIVE_PARAM_KEYWORDS = [
  'token',
  'access_token',
  'auth',
  'authentication',
  'session',
  'sessionid',
  'session_id',
  'reset',
  'password_reset',
  'key',
  'apikey',
  'api_key',
  'signature',
  'sig',
  'password',
  'passwd',
  'jwt',
  'id_token',
  'secret',
  'bearer',
  'code',
  'oauth_token',
  'verification_code',
];

export function detectSensitiveIndicators(indicator: string, type: IndicatorType): SensitiveCheckResult {
  const trimmed = indicator.trim();

  if (type === 'ip') {
    const ipCheck = validateIp(trimmed);
    if (ipCheck.valid && ipCheck.isPrivate) {
      return {
        isSensitive: true,
        reason: 'This is a private/internal IP address (RFC 1918/Loopback). Querying private infrastructure risks exposing internal network topology.',
        detectedTokens: ['Internal/Private RFC 1918 IP'],
      };
    }
    return { isSensitive: false, reason: '', detectedTokens: [] };
  }

  if (type === 'domain') {
    if (trimmed.endsWith('.local') || trimmed.endsWith('.internal') || trimmed === 'localhost') {
      return {
        isSensitive: true,
        reason: 'Internal domain suffix detected. Querying internal hosts exposes local network naming conventions.',
        detectedTokens: ['Internal host name'],
      };
    }
    return { isSensitive: false, reason: '', detectedTokens: [] };
  }

  if (type === 'url') {
    try {
      let urlStr = trimmed;
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'https://' + urlStr;
      }
      const parsed = new URL(urlStr);

      // Check for private host
      const hostIp = validateIp(parsed.hostname);
      if (
        (hostIp.valid && hostIp.isPrivate) ||
        parsed.hostname === 'localhost' ||
        parsed.hostname.endsWith('.local') ||
        parsed.hostname.endsWith('.internal')
      ) {
        return {
          isSensitive: true,
          reason: 'The URL points to an internal or loopback host. Never query private infrastructure on public threat intelligence networks.',
          detectedTokens: ['Private hostname/IP in URL'],
        };
      }

      // Check query parameters
      const detectedTokens: string[] = [];
      const sanitizedUrl = new URL(parsed.href);

      for (const [key] of parsed.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        for (const keyword of SENSITIVE_PARAM_KEYWORDS) {
          if (lowerKey === keyword || lowerKey.includes(keyword)) {
            detectedTokens.push(key);
            sanitizedUrl.searchParams.delete(key);
            break;
          }
        }
      }

      // Check path segments for obvious tokens (e.g. /reset/a1b2c3d4e5f6g7h8i9j0)
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      for (const seg of pathSegments) {
        if (seg.length >= 32 && /^[a-zA-Z0-9_\-\.]+$/.test(seg)) {
          detectedTokens.push(`path segment: ${seg.substring(0, 8)}...`);
        }
      }

      if (detectedTokens.length > 0) {
        return {
          isSensitive: true,
          reason: `Potential authentication tokens, session credentials, or reset keys detected (${detectedTokens.join(', ')}). Submitting this URL could expose your active session or login credentials to VirusTotal and its community.`,
          detectedTokens,
          sanitizedSuggestion: sanitizedUrl.href,
        };
      }
    } catch {
      // If unparseable, let standard validation handle it
    }
  }

  return { isSensitive: false, reason: '', detectedTokens: [] };
}

/**
 * Determines assessment category strictly from available evidence.
 * - Multiple independent vendor detections (malicious >= 2) indicate corroborated threat consensus.
 * - Single isolated detection (malicious === 1 or isolated suspicious with clean engines) indicates conflicting evidence.
 * - Multiple suspicious findings without confirmed malicious signatures indicate suspicious.
 * - Zero detections across active reporting engines indicates no_detections.
 * - Missing data or zero evaluating engines indicates inconclusive.
 * Never describes a target as definitively malicious solely because a single vendor flags it.
 */
export function calculateAssessmentCategory(stats?: {
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
}): AssessmentCategory {
  if (!stats) return 'inconclusive';
  const mal = Number(stats.malicious || 0);
  const susp = Number(stats.suspicious || 0);
  const harmless = Number(stats.harmless || 0);
  const undet = Number(stats.undetected || 0);
  const total = mal + susp + harmless + undet;

  if (total === 0) return 'inconclusive';

  // 2 or more independent malicious detections corroborate a definitive threat verdict
  if (mal >= 2) return 'malicious';

  // Exactly 1 malicious detection among evaluating engines:
  // Must NOT be labeled as definitively malicious, but must NOT be dismissed as clean either.
  if (mal === 1) {
    return 'conflicting';
  }

  // 2 or more suspicious findings indicate elevated anomaly
  if (susp >= 2) return 'suspicious';

  // Exactly 1 suspicious detection among clean/unflagged engines is also isolated/conflicting
  if (susp === 1) {
    if (harmless + undet >= 1) {
      return 'conflicting';
    }
    return 'suspicious';
  }

  if (harmless > 0 || undet > 0) return 'no_detections';
  return 'inconclusive';
}

/**
 * Normalizes and compares two indicators to determine whether they refer
 * to the exact same investigation target.
 */
export function areIndicatorsEquivalent(a: string, b: string, type: IndicatorType): boolean {
  if (!a || !b) return false;
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  if (type === 'url') {
    try {
      const uA = new URL(cleanA.startsWith('http') ? cleanA : `https://${cleanA}`);
      const uB = new URL(cleanB.startsWith('http') ? cleanB : `https://${cleanB}`);
      if (uA.hostname !== uB.hostname) return false;
      const pathA = uA.pathname.replace(/\/+$/, '') || '/';
      const pathB = uB.pathname.replace(/\/+$/, '') || '/';
      if (pathA !== pathB) return false;
      return uA.search === uB.search;
    } catch {
      return cleanA.replace(/\/+$/, '') === cleanB.replace(/\/+$/, '');
    }
  }

  if (type === 'domain') {
    const dA = cleanA.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
    const dB = cleanB.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
    return dA === dB;
  }

  return cleanA === cleanB;
}

/**
 * Validates that a threat intelligence report belongs to the active investigation target
 * to prevent stale or cross-query result pollution.
 */
export function validateReportTarget(
  targetIndicator: string,
  reportIndicator: string,
  type: IndicatorType
): { valid: boolean; reason?: string } {
  if (!targetIndicator || !reportIndicator) {
    return { valid: false, reason: 'Missing indicator reference in investigation verification.' };
  }
  if (!areIndicatorsEquivalent(targetIndicator, reportIndicator, type)) {
    return {
      valid: false,
      reason: `Report indicator "${reportIndicator}" does not match active investigation target "${targetIndicator}". Stale results blocked.`,
    };
  }
  return { valid: true };
}

export interface MultiProviderVerdictInput {
  stats?: {
    malicious?: number;
    suspicious?: number;
    harmless?: number;
    undetected?: number;
  };
  engines?: Array<{
    engine_name: string;
    category: string;
    result?: string | null;
    method?: string;
  }>;
  safeBrowsingEvidence?: GoogleSafeBrowsingResult;
  dnsEvidence?: GoogleDnsResult;
}

export interface MultiProviderVerdictOutput {
  assessment: AssessmentCategory;
  assessment_summary: string;
  warnings: string[];
}

/**
 * Combines independent threat intelligence telemetry across VirusTotal, Google Safe Browsing,
 * and Google Public DNS according to strict evidentiary standards:
 * 1. Never describe a URL as definitively malicious solely because one vendor flags it.
 * 2. Keep provider results and statistics strictly independent without mutating source feeds.
 * 3. Use qualified verdict "Conflicting evidence: one vendor flagged this URL" when evidence is limited or contradictory.
 * 4. Require 2+ independent vendor detections or corroborating cross-provider detections for a definitive "malicious" assessment.
 */
export function evaluateMultiProviderVerdict(input: MultiProviderVerdictInput): MultiProviderVerdictOutput {
  const { stats, engines = [], safeBrowsingEvidence, dnsEvidence } = input;
  const mal = Number(stats?.malicious || 0);
  const susp = Number(stats?.suspicious || 0);
  const harmless = Number(stats?.harmless || 0);
  const undet = Number(stats?.undetected || 0);
  const vtTotal = mal + susp + harmless + undet;
  const hasVtData = vtTotal > 0;

  const isSbThreat = safeBrowsingEvidence?.status === 'threat_found';
  const isSbSafe = safeBrowsingEvidence?.status === 'safe';
  const sbThreatTypes =
    safeBrowsingEvidence?.matches?.map((m) => m.threatType).join(', ') || 'Known Threat';

  const warnings: string[] = [];

  const flaggedEngines = engines.filter(
    (e) => e.category === 'malicious' || e.category === 'suspicious'
  );
  const flaggedDetail =
    flaggedEngines
      .map((f) => `${f.engine_name}: ${f.result || f.category}`)
      .join(', ') || `${mal + susp} vendor(s)`;

  let assessment: AssessmentCategory = 'inconclusive';
  let assessment_summary = '';

  // 1. Multiple independent detections:
  // Corroborated when 2+ VT engines flag malicious, OR when VT has detection and Safe Browsing corroborates.
  if (mal >= 2) {
    assessment = 'malicious';
    if (isSbThreat) {
      warnings.push(`Google Safe Browsing flagged active threat matches (${sbThreatTypes}).`);
      assessment_summary = `Multiple independent threat intelligence providers (VirusTotal engines and Google Safe Browsing) confirm malicious indicators for this target (${sbThreatTypes}). Treat as dangerous.`;
    } else {
      assessment_summary = `Multiple independent security vendors (${mal}) report confirmed malicious indicators for this item. Treat it as potentially dangerous and verify it independently before interacting with it.`;
    }
  } else if (isSbThreat && (mal === 1 || susp >= 1)) {
    assessment = 'malicious';
    warnings.push(`Google Safe Browsing flagged active threat matches (${sbThreatTypes}).`);
    assessment_summary = `Multiple independent threat intelligence providers (VirusTotal engine and Google Safe Browsing) confirm malicious indicators for this target (${sbThreatTypes}). Treat as dangerous.`;
  }
  // 2. Conflicting provider results:
  // - Safe Browsing flagged a threat, but VT evaluated with 0 malicious/suspicious detections
  else if (isSbThreat && hasVtData && mal === 0 && susp === 0) {
    assessment = 'conflicting';
    warnings.push(`Google Safe Browsing flagged active threat matches (${sbThreatTypes}).`);
    assessment_summary = `Conflicting provider evidence: Google Safe Browsing flagged active threat matches (${sbThreatTypes}), while ${harmless + undet} VirusTotal engines reported no detections. Treat this item with caution and verify independently.`;
  }
  // - Exactly 1 VT vendor flagged malicious among many clean engines:
  // Must NOT describe as definitively malicious, but must NOT dismiss as safe either.
  else if (hasVtData && mal === 1) {
    assessment = 'conflicting';
    warnings.push(
      'Conflicting evidence: an isolated vendor flagged this URL while other engines reported harmless/undetected. Verify independently before taking action.'
    );
    const sbMention = isSbSafe ? ' and Google Safe Browsing' : '';
    assessment_summary = `Conflicting evidence: 1 security vendor flagged this URL (${flaggedDetail}), while ${harmless} other vendors${sbMention} report no listed threats. This isolated detection is visible below and should neither be treated as definitive malware nor dismissed as safe without independent verification.`;
  }
  // - Isolated suspicious finding on VT
  else if (hasVtData && susp === 1 && harmless + undet >= 1) {
    assessment = 'conflicting';
    warnings.push(
      'Conflicting evidence: an isolated vendor flagged this URL as suspicious while other engines reported harmless/undetected.'
    );
    const sbMention = isSbSafe ? ' and Google Safe Browsing' : '';
    assessment_summary = `Conflicting evidence: 1 security vendor flagged this URL as suspicious (${flaggedDetail}), while ${harmless} other vendors${sbMention} report no listed threats. Displayed for independent verification.`;
  }
  // 3. Isolated Safe Browsing threat match when VT has no data or was unindexed
  else if (isSbThreat && !hasVtData) {
    assessment = 'malicious';
    warnings.push(`Google Safe Browsing flagged active threat matches (${sbThreatTypes}).`);
    assessment_summary = `Google Safe Browsing flags active threat matches for this target (${sbThreatTypes}). Treat as dangerous and avoid interacting.`;
  }
  // 4. Multiple suspicious findings on VT (susp >= 2)
  else if (susp >= 2) {
    assessment = 'suspicious';
    warnings.push('Suspicious indicators reported. Verify legitimacy independently through official contact channels.');
    assessment_summary = `Available threat intelligence reports suspicious indicators (${susp} vendors) for this item. Heuristic or reputation algorithms flag anomalous behavioral traits.`;
  }
  // 5. Clean across evaluating feeds
  else if ((hasVtData && harmless + undet > 0) || isSbSafe || dnsEvidence?.status === 'resolved') {
    assessment = 'no_detections';
    const activeFeeds: string[] = [];
    if (hasVtData) activeFeeds.push(`${harmless} VirusTotal vendor(s)`);
    if (isSbSafe) activeFeeds.push('Google Safe Browsing');
    if (dnsEvidence?.status === 'resolved') activeFeeds.push('Google Public DNS');
    assessment_summary = `No malicious or suspicious detections were reported across active feeds (${activeFeeds.join(', ')}). Critical notice: Zero reported detections does NOT prove that a destination is safe.`;
  } else {
    assessment = 'inconclusive';
    assessment_summary = 'Available threat intelligence data is inconclusive or incomplete. Absence of telemetry provides zero evidence of safety.';
  }

  // 6. Independent DNS cross-check:
  // NXDOMAIN indicates destination host does not exist. Keep DNS independent while adjusting overall verdict
  if (dnsEvidence?.status === 'nxdomain') {
    if (assessment !== 'malicious') {
      assessment = 'suspicious';
    }
    warnings.push(
      'Authoritative DNS confirms domain does not exist (NXDOMAIN). The destination cannot resolve to an active host.'
    );
    if (assessment === 'suspicious' && !assessment_summary.includes('NXDOMAIN')) {
      assessment_summary = `${assessment_summary} Authoritative DNS confirms domain does not exist (NXDOMAIN).`;
    }
  }

  return {
    assessment,
    assessment_summary: assessment_summary.trim(),
    warnings,
  };
}

/**
 * Safe display masking for sensitive or long indicators.
 */
export function maskIndicator(indicator: string, type: IndicatorType): string {
  if (type === 'file') {
    if (indicator.length === 64) {
      return `${indicator.substring(0, 8)}...${indicator.substring(56)}`;
    }
  }
  if (type === 'url') {
    try {
      const parsed = new URL(indicator.startsWith('http') ? indicator : 'https://' + indicator);
      if (parsed.search) {
        const maskedParams = new URLSearchParams();
        for (const [key, val] of parsed.searchParams.entries()) {
          const lower = key.toLowerCase();
          const isSecret = SENSITIVE_PARAM_KEYWORDS.some((kw) => lower.includes(kw));
          maskedParams.set(key, isSecret ? '••••••••' : val);
        }
        return `${parsed.origin}${parsed.pathname}?${decodeURIComponent(maskedParams.toString())}`;
      }
    } catch {
      // fallback
    }
  }
  return indicator;
}

/**
 * Extracts the hostname/domain from a URL or domain string.
 */
export function extractHostname(indicator: string, type: IndicatorType): string | null {
  if (type === 'domain') {
    return indicator.toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  }
  if (type === 'url') {
    try {
      const parsed = new URL(indicator.startsWith('http') ? indicator : 'https://' + indicator);
      return parsed.hostname.toLowerCase();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Resolves a hostname using Google Public DNS over HTTPS (DoH).
 * Distinguishes NXDOMAIN (Status 3) from success (Status 0), SERVFAIL (Status 2), and network timeouts/errors.
 */
export async function queryGoogleDnsOverHttps(domain: string): Promise<GoogleDnsResult> {
  const cleanDomain = domain.toLowerCase().trim().replace(/\.$/, '');
  const url = `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        status: 'error',
        statusCode: res.status,
        domain: cleanDomain,
        message: `Google Public DNS query returned HTTP ${res.status}`,
        queryTime: new Date().toISOString(),
      };
    }

    const data = await res.json();
    const status = data.Status; // RFC 8484 DNS response code

    if (status === 3) {
      // NXDOMAIN - Non-Existent Domain
      return {
        status: 'nxdomain',
        statusCode: 3,
        domain: cleanDomain,
        message: 'Domain does not exist in public DNS (NXDOMAIN). The hostname has no registered or active name server records.',
        queryTime: new Date().toISOString(),
      };
    }

    if (status === 0) {
      // NOERROR - Resolved successfully
      const answers = Array.isArray(data.Answer) ? data.Answer : [];
      const ipAddresses = answers.filter((a: any) => a.type === 1).map((a: any) => a.data); // Type 1 = A record
      const records = answers.map((a: any) => ({
        name: a.name || cleanDomain,
        type: a.type,
        TTL: a.TTL,
        data: a.data,
      }));

      return {
        status: 'resolved',
        statusCode: 0,
        domain: cleanDomain,
        ipAddresses,
        records,
        message: ipAddresses.length > 0
          ? `Domain successfully resolved to ${ipAddresses.length} IPv4 address${ipAddresses.length === 1 ? '' : 'es'}.`
          : 'Domain exists in public DNS (NOERROR), but has no active A records.',
        queryTime: new Date().toISOString(),
      };
    }

    if (status === 2) {
      return {
        status: 'servfail',
        statusCode: 2,
        domain: cleanDomain,
        message: 'DNS server failure (SERVFAIL). Upstream authoritative nameservers failed to respond.',
        queryTime: new Date().toISOString(),
      };
    }

    return {
      status: 'error',
      statusCode: status,
      domain: cleanDomain,
      message: `DNS resolution returned DNS status code ${status}.`,
      queryTime: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        status: 'timeout',
        domain: cleanDomain,
        message: 'Google Public DNS over HTTPS query timed out after 6 seconds.',
        queryTime: new Date().toISOString(),
      };
    }
    return {
      status: 'error',
      domain: cleanDomain,
      message: 'Failed to contact Google Public DNS over HTTPS service.',
      queryTime: new Date().toISOString(),
    };
  }
}

/**
 * Queries Google Safe Browsing Lookup API v4 for known threats on a URL.
 */
export async function queryGoogleSafeBrowsing(url: string, apiKey: string): Promise<GoogleSafeBrowsingResult> {
  const trimmedKey = (apiKey || '').trim();
  if (!trimmedKey || trimmedKey === 'MY_SAFE_BROWSING_API_KEY') {
    return {
      status: 'not_configured',
      configured: false,
      message: 'Google Safe Browsing API key not configured on server (Configurable in Owner Console).',
      queryTime: new Date().toISOString(),
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(trimmedKey)}`;
  const requestBody = {
    client: {
      clientId: 'trustcheck-security-tool',
      clientVersion: '1.2.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return {
        status: 'error',
        configured: true,
        message: `Google Safe Browsing credentials rejected (HTTP ${res.status}). Verify API key permissions in Google Cloud Console.`,
        queryTime: new Date().toISOString(),
      };
    }

    if (res.status === 429) {
      return {
        status: 'quota_exceeded',
        configured: true,
        message: 'Google Safe Browsing API rate quota exceeded. Try again later.',
        queryTime: new Date().toISOString(),
      };
    }

    if (!res.ok) {
      return {
        status: 'error',
        configured: true,
        message: `Google Safe Browsing returned HTTP status ${res.status}.`,
        queryTime: new Date().toISOString(),
      };
    }

    const data = await res.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];

    if (matches.length > 0) {
      return {
        status: 'threat_found',
        configured: true,
        matches: matches.map((m: any) => ({
          threatType: m.threatType,
          platformType: m.platformType,
          threatEntryType: m.threatEntryType,
          url: m.threat?.url || url,
        })),
        message: `Identified by Google Safe Browsing as: ${matches.map((m: any) => m.threatType).join(', ')}.`,
        queryTime: new Date().toISOString(),
      };
    }

    return {
      status: 'safe',
      configured: true,
      message: 'No matching threats found on Google Safe Browsing lists. (Safe Browsing flags active deceptive sites and malware; lack of listing does not guarantee complete safety.)',
      queryTime: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: 'error',
      configured: true,
      message: err?.name === 'AbortError' ? 'Google Safe Browsing query timed out.' : 'Failed to reach Google Safe Browsing API.',
      queryTime: new Date().toISOString(),
    };
  }
}

