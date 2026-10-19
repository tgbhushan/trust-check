/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IndicatorType = 'url' | 'domain' | 'ip' | 'file';

export type AssessmentCategory =
  | 'malicious'
  | 'suspicious'
  | 'conflicting'
  | 'no_detections'
  | 'inconclusive';

export type InvestigationMode = 'standard' | 'expanded';

export interface EngineStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout?: number;
}

export interface EngineResult {
  engine_name: string;
  category: string; // 'malicious' | 'suspicious' | 'harmless' | 'undetected'
  result?: string | null;
  method?: string;
}

export interface TechnicalMetadata {
  asn?: string;
  as_owner?: string;
  country?: string;
  registrar?: string;
  creation_date?: string;
  last_dns_records?: Array<{ type: string; value: string; ttl?: number }>;
  jarm?: string;
  ssl_cert_issuer?: string;
  ssl_cert_subject?: string;
  ssl_cert_validity?: { not_before?: string; not_after?: string };
  sha256?: string;
  sha1?: string;
  md5?: string;
  file_size?: number;
  file_type?: string;
  meaningful_name?: string;
  times_submitted?: number;
  first_submission_date?: string;
  last_submission_date?: string;
  reputation?: number;
}

export interface UnifiedReport {
  id: string;
  indicator: string;
  raw_indicator_masked: string;
  indicator_type: IndicatorType;
  assessment: AssessmentCategory;
  assessment_summary: string;
  timestamp: string;
  is_live: boolean;
  is_simulated: boolean;
  provider: string;
  stats: EngineStats;
  engines: EngineResult[];
  categories?: Record<string, string>;
  tags?: string[];
  reputation?: number;
  permalink?: string;
  technical_metadata?: TechnicalMetadata;
  url_findings?: {
    final_url?: string;
    status_code?: number;
    title?: string;
  };
  domain_findings?: {
    domain?: string;
    registrar?: string;
    creation_date?: string;
    reputation?: number;
    stats?: EngineStats;
  };
  ip_findings?: {
    ip?: string;
    asn?: string;
    as_owner?: string;
    country?: string;
    stats?: EngineStats;
  };
  relationships?: {
    related_ips?: string[];
    related_domains?: string[];
    communicating_files?: string[];
    downloaded_files?: string[];
  };
  dns_evidence?: GoogleDnsResult;
  safe_browsing_evidence?: GoogleSafeBrowsingResult;
  provider_availability?: ProviderAvailability;
  limitations: string[];
  warnings: string[];
  scan_id?: string;
  scan_status?: 'queued' | 'in_progress' | 'completed';
}

export interface ProviderAvailability {
  virusTotal: {
    status: 'available' | 'not_found' | 'rate_limited' | 'unconfigured' | 'error' | 'timeout';
    message?: string;
    retryAfterSeconds?: number;
  };
  safeBrowsing: {
    status: 'safe' | 'threat_found' | 'not_configured' | 'error' | 'quota_exceeded' | 'timeout';
    message?: string;
  };
  googleDns: {
    status: 'resolved' | 'nxdomain' | 'servfail' | 'error' | 'timeout' | 'not_applicable';
    message?: string;
  };
}

export interface GoogleDnsResult {
  status: 'resolved' | 'nxdomain' | 'servfail' | 'error' | 'timeout';
  statusCode?: number;
  domain: string;
  ipAddresses?: string[];
  records?: Array<{ name: string; type: number; TTL: number; data: string }>;
  message: string;
  queryTime?: string;
}

export interface GoogleSafeBrowsingResult {
  status: 'safe' | 'threat_found' | 'not_configured' | 'error' | 'quota_exceeded';
  matches?: Array<{
    threatType: string;
    platformType: string;
    threatEntryType?: string;
    url?: string;
  }>;
  message: string;
  configured: boolean;
  queryTime?: string;
}

export interface SensitiveCheckResult {
  isSensitive: boolean;
  reason: string;
  detectedTokens: string[];
  sanitizedSuggestion?: string;
}

export interface InvestigationResult {
  report?: UnifiedReport;
  notFound?: boolean;
  canSubmitScan?: boolean;
  indicator?: string;
  indicatorType?: IndicatorType;
  dnsEvidence?: GoogleDnsResult;
  safeBrowsingEvidence?: GoogleSafeBrowsingResult;
  status?: number;
  message?: string;
}

export interface HistoryEntry {
  id: string;
  indicator: string;
  indicator_type: IndicatorType;
  assessment: AssessmentCategory;
  timestamp: string;
  is_live: boolean;
  is_simulated: boolean;
  stats: EngineStats;
}

export interface ApiStatus {
  hasApiKey: boolean;
  keyConfigured: boolean;
  rateLimit: {
    requestsThisMinute: number;
    maxPerMinute: number;
    resetInSeconds: number;
  };
}

export interface InvestigationClue {
  id: string;
  label: string;
  location: string;
  description: string;
  whyItMatters: string;
  isDiscovered: boolean;
}

export interface StudentProfile {
  name: string;
  school: string;
  competition: string;
  motivation: string;
}

export interface FileAnalysisState {
  file: File | null;
  fileName: string;
  fileSize: number;
  sha256: string;
  isCalculatingHash: boolean;
  isLookingUpReport: boolean;
  hasUserConsented: boolean;
  report: UnifiedReport | null;
  error: string | null;
  doubleExtensionWarning?: string;
}

export interface OwnerDiagnostics {
  serverStatus: 'healthy' | 'degraded' | 'error';
  uptimeSeconds: number;
  hasApiKey: boolean;
  keyMasked?: string;
  hasSafeBrowsingKey?: boolean;
  safeBrowsingKeyMasked?: string;
  lastApiTest?: {
    timestamp: string;
    status: 'ok' | 'failed';
    statusCode?: number;
    category?: string;
    message?: string;
    latencyMs?: number;
  };
  lastSafeBrowsingTest?: {
    timestamp: string;
    status: 'ok' | 'failed';
    statusCode?: number;
    message?: string;
    latencyMs?: number;
  };
  recentErrors: Array<{ timestamp: string; category: string; message: string }>;
  activeVisitorCount: number;
  requestsThisMinute: number;
  cacheEntryCount: number;
}
