/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Globe,
  Network,
  Binary,
  FileCode,
  Search,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Info,
  X,
  Layers,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Upload,
} from 'lucide-react';
import type {
  IndicatorType,
  InvestigationMode,
  SensitiveCheckResult,
  UnifiedReport,
  InvestigationResult,
  GoogleDnsResult,
  GoogleSafeBrowsingResult,
} from '../types/index.ts';
import {
  validateUrl,
  validateDomain,
  validateIp,
  validateFileHash,
  detectSensitiveIndicators,
  validateReportTarget,
} from '../utils/indicators.ts';
import { DEMO_SCENARIOS } from '../data/demoScenarios.ts';
import { ResultsDashboard } from './ResultsDashboard.tsx';

interface EvidenceToolProps {
  onInvestigateLive: (
    indicator: string,
    type: IndicatorType,
    mode: InvestigationMode
  ) => Promise<InvestigationResult>;
  onScanUrlLive?: (
    url: string,
    userConsented: boolean
  ) => Promise<{ report?: UnifiedReport; queued?: boolean; message?: string; error?: string }>;
  activeReport: UnifiedReport | null;
  setActiveReport: (report: UnifiedReport | null) => void;
  isLoading: boolean;
}

const PRESET_EXAMPLES: Record<IndicatorType, Array<{ label: string; value: string; desc: string }>> = {
  url: [
    { label: 'google.com (Clean)', value: 'https://google.com', desc: 'Known portal with existing report' },
    { label: 'archive.org (Clean)', value: 'https://archive.org', desc: 'Non-profit digital library with existing report' },
    { label: 'Uncataloged URL (No Report)', value: 'https://unindexed-fresh-sample.example.org/portal', desc: 'Unindexed URL with no existing record' },
    { label: 'Token Test (Sensitive)', value: 'https://bank.example.com/reset?token=a8f9c2d1e0&auth=true', desc: 'Demonstrates sensitive indicator defense' },
  ],
  domain: [
    { label: 'wikipedia.org', value: 'wikipedia.org', desc: 'High reputation knowledge archive' },
    { label: 'crypto-airdrop.xyz', value: 'crypto-airdrop-bonus2026.example.org', desc: 'Simulated suspicious typosquatting domain' },
    { label: 'example.com', value: 'example.com', desc: 'IANA documentation domain' },
  ],
  ip: [
    { label: '1.1.1.1 (Cloudflare)', value: '1.1.1.1', desc: 'Public DNS resolver infrastructure' },
    { label: '198.51.100.88 (Offshore C2)', value: '198.51.100.88', desc: 'Offshore bulletproof hosting gateway' },
    { label: '192.168.1.1 (Private IP)', value: '192.168.1.1', desc: 'Private RFC 1918 test for SSRF defense' },
  ],
  file: [
    {
      label: 'Trojan.Stealer Hash',
      value: '2c2446132bb3522f741b7c06d3b8e23807768323860f4178ab0f31e33ccfe2a8',
      desc: 'Known InfoStealer executable SHA-256',
    },
    {
      label: 'Null SHA-256',
      value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      desc: 'Empty file 0-byte benchmark hash',
    },
  ],
};

export const EvidenceTool: React.FC<EvidenceToolProps> = ({
  onInvestigateLive,
  onScanUrlLive,
  activeReport,
  setActiveReport,
  isLoading,
}) => {
  const [indicatorType, setIndicatorType] = useState<IndicatorType>('url');
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<InvestigationMode>('standard');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sensitiveAlert, setSensitiveAlert] = useState<SensitiveCheckResult | null>(null);
  const [serviceError, setServiceError] = useState<{
    status?: number;
    message: string;
    canUseDemo?: boolean;
    dnsEvidence?: GoogleDnsResult;
    safeBrowsingEvidence?: GoogleSafeBrowsingResult;
  } | null>(null);

  // Dedicated Genuine 404 / Report-Not-Found State
  const [notFoundState, setNotFoundState] = useState<{
    indicator: string;
    indicatorType: IndicatorType;
    canSubmitScan: boolean;
    message: string;
    dnsEvidence?: GoogleDnsResult;
    safeBrowsingEvidence?: GoogleSafeBrowsingResult;
  } | null>(null);

  // Consent & Scan Submission State
  const [scanConsent, setScanConsent] = useState(false);
  const [isSubmittingScan, setIsSubmittingScan] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Investigation sequence tracker to prevent asynchronous race condition stale results
  const investigationSeqRef = useRef<number>(0);

  const handleTypeChange = (newType: IndicatorType) => {
    investigationSeqRef.current++;
    setIndicatorType(newType);
    setValidationError(null);
    setSensitiveAlert(null);
    setServiceError(null);
    setNotFoundState(null);
    setScanNotice(null);
    setActiveReport(null);
    setInputValue('');
  };

  const validateCurrentInput = () => {
    if (indicatorType === 'url') return validateUrl(inputValue);
    if (indicatorType === 'domain') return validateDomain(inputValue);
    if (indicatorType === 'ip') return validateIp(inputValue);
    if (indicatorType === 'file') return validateFileHash(inputValue);
    return { valid: false, error: 'Unknown indicator type.' };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentSeq = ++investigationSeqRef.current;
    setValidationError(null);
    setServiceError(null);
    setNotFoundState(null);
    setScanNotice(null);
    // CRITICAL: Immediately clear any active report from previous investigations to prevent stale display
    setActiveReport(null);

    const check = validateCurrentInput();
    if (!check.valid || !check.normalized) {
      setValidationError(check.error || 'Invalid input.');
      return;
    }

    // Sensitive check blocking
    const sens = detectSensitiveIndicators(check.normalized, indicatorType);
    if (sens.isSensitive) {
      setSensitiveAlert(sens);
      return;
    }

    // Execute live lookup
    const result = await onInvestigateLive(check.normalized, indicatorType, mode);

    // Prevent race conditions: discard response if user initiated another search while this request was in flight
    if (currentSeq !== investigationSeqRef.current) {
      return;
    }

    if (result.report) {
      // Ensure target URL and VirusTotal report data belong to the exact same investigation
      const targetValidation = validateReportTarget(check.normalized, result.report.indicator, indicatorType);
      if (!targetValidation.valid) {
        setServiceError({
          status: 409,
          message: targetValidation.reason || 'Received report did not match active target. Stale results blocked.',
          canUseDemo: false,
        });
        return;
      }
      setActiveReport(result.report);
      setNotFoundState(null);
      setServiceError(null);
    } else if (result.notFound) {
      setActiveReport(null);
      setNotFoundState({
        indicator: result.indicator || check.normalized,
        indicatorType,
        canSubmitScan: Boolean(result.canSubmitScan),
        message:
          result.message ||
          'No existing report was found. The safety of this website could not be determined.',
        dnsEvidence: result.dnsEvidence,
        safeBrowsingEvidence: result.safeBrowsingEvidence,
      });
      setServiceError(null);
    } else {
      setActiveReport(null);
      setNotFoundState(null);
      setServiceError({
        status: result.status,
        message: result.message || 'Threat intelligence query could not be completed.',
        canUseDemo: true,
        dnsEvidence: result.dnsEvidence,
        safeBrowsingEvidence: result.safeBrowsingEvidence,
      });
    }
  };

  const handleScanSubmit = async () => {
    if (!notFoundState?.indicator || !scanConsent || !onScanUrlLive) return;
    const currentSeq = ++investigationSeqRef.current;
    const targetUrl = notFoundState.indicator;
    setIsSubmittingScan(true);
    setScanNotice(null);
    try {
      const res = await onScanUrlLive(targetUrl, true);
      if (currentSeq !== investigationSeqRef.current) return;
      if (res.report) {
        const targetValidation = validateReportTarget(targetUrl, res.report.indicator, 'url');
        if (targetValidation.valid) {
          setActiveReport(res.report);
          setNotFoundState(null);
        }
      } else if (res.queued) {
        setScanNotice(res.message || 'URL submitted to VirusTotal queue. Analysis is running.');
      } else if (res.error) {
        setScanNotice(`Submission notice: ${res.error}`);
      }
    } catch {
      setScanNotice('Could not connect to URL scanning service.');
    } finally {
      setIsSubmittingScan(false);
    }
  };

  const handleLoadDemo = (scenarioType: IndicatorType) => {
    const demo = DEMO_SCENARIOS.find((s) => s.indicatorType === scenarioType) || DEMO_SCENARIOS[0];
    setActiveReport(demo.report);
    setServiceError(null);
    setNotFoundState(null);
    setValidationError(null);
  };

  const applySanitizedUrl = () => {
    if (sensitiveAlert?.sanitizedSuggestion) {
      setInputValue(sensitiveAlert.sanitizedSuggestion);
      setSensitiveAlert(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D7773] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-[#2D7773]" />
              <span>Multi-Source Threat Intelligence Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Website & Indicator Security Checker
            </h2>
          </div>
          {activeReport && (
            <button
              onClick={() => setActiveReport(null)}
              className="px-3 py-1.5 text-xs font-medium text-[#697386] hover:text-[#111827] border border-[#D8DCE2] rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Evidence</span>
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-3xl mb-6">
          Investigate suspicious URLs, domain names, public IP addresses, and SHA-256 file hashes against real threat-intelligence vendor signatures. Results distinguish live multi-engine intelligence from sample research demonstrations.
        </p>

        {/* Indicator Type Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#D8DCE2]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#697386] block mb-2">
              Select Indicator Type
            </span>
            <div className="inline-flex p-1 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
              <button
                type="button"
                onClick={() => handleTypeChange('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  indicatorType === 'url'
                    ? 'bg-[#111827] text-white shadow-xs font-semibold'
                    : 'text-[#697386] hover:text-[#111827]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('domain')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  indicatorType === 'domain'
                    ? 'bg-[#111827] text-white shadow-xs font-semibold'
                    : 'text-[#697386] hover:text-[#111827]'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Domain</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('ip')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  indicatorType === 'ip'
                    ? 'bg-[#111827] text-white shadow-xs font-semibold'
                    : 'text-[#697386] hover:text-[#111827]'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>IP Address</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('file')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  indicatorType === 'file'
                    ? 'bg-[#111827] text-white shadow-xs font-semibold'
                    : 'text-[#697386] hover:text-[#111827]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>File Hash</span>
              </button>
            </div>
          </div>

          {/* Scope Mode */}
          {(indicatorType === 'url' || indicatorType === 'domain') && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#697386] block mb-2">
                Analysis Scope
              </span>
              <div className="inline-flex p-1 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] text-xs">
                <button
                  type="button"
                  onClick={() => setMode('standard')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    mode === 'standard' ? 'bg-white text-[#111827] font-semibold shadow-xs' : 'text-[#697386]'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setMode('expanded')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    mode === 'expanded' ? 'bg-[#2D7773] text-white font-semibold shadow-xs' : 'text-[#697386]'
                  }`}
                >
                  Expanded Multi-Asset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setValidationError(null);
                setSensitiveAlert(null);
                setServiceError(null);
              }}
              placeholder={
                indicatorType === 'url'
                  ? 'https://suspicious-login-portal.example.com/auth'
                  : indicatorType === 'domain'
                  ? 'suspicious-domain-update.net'
                  : indicatorType === 'ip'
                  ? '198.51.100.23'
                  : '64-character SHA-256 hash (e.g. 2c2446132bb...)'
              }
              className="w-full h-12 pl-4 pr-32 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-xs sm:text-sm font-mono text-[#111827] placeholder:text-[#697386]/60 focus:outline-none focus:ring-2 focus:ring-[#2D7773]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-[#D5A64A]" />
                  <span>Investigate</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C94C4C] shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Sensitive Check Alert */}
          {sensitiveAlert && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-amber-900 block font-mono uppercase">
                    Sensitive Indicator Protected Prior to Query
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {sensitiveAlert.reason}
                  </p>
                </div>
              </div>

              {sensitiveAlert.sanitizedSuggestion && (
                <div className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="truncate">
                    <span className="text-[#697386] block text-[10px] uppercase">
                      Recommended Sanitized Target:
                    </span>
                    <span className="text-[#111827] font-semibold">
                      {sensitiveAlert.sanitizedSuggestion}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={applySanitizedUrl}
                    className="px-3 py-1.5 bg-[#2D7773] text-white rounded-md text-xs font-bold hover:bg-[#25635F] transition-colors shrink-0"
                  >
                    Use Sanitized Target
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Research Samples Bar */}
          <div className="pt-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#697386] block mb-2">
              Verified Sample Indicators:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_EXAMPLES[indicatorType].map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setInputValue(ex.value);
                    setValidationError(null);
                    setSensitiveAlert(null);
                    setServiceError(null);
                  }}
                  className="px-2.5 py-1 text-xs font-mono bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] rounded-md text-[#111827] transition-colors flex items-center gap-1.5 group"
                >
                  <span className="font-semibold">{ex.label}</span>
                  <span className="text-[#697386] text-[10px] font-sans group-hover:text-[#111827]">
                    ({ex.desc})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Genuine 404: No Report Found Banner with Separate Evidence Sources & Consent-Gated Analysis */}
      {notFoundState && (
        <div className="bg-white border border-[#D8DCE2] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-[#697386]" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-[#697386]">
                  VIRUSTOTAL: NO HISTORICAL REPORT FOUND
                </span>
                <span className="text-xs text-[#697386]">·</span>
                <span className="text-xs font-mono text-[#697386]">HTTP 404 Response</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                No existing report was found. The safety of this website could not be determined.
              </h3>
              <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-3xl">
                A VirusTotal HTTP 404 means <strong className="text-[#111827]">“No VirusTotal report found,”</strong> never <strong className="text-[#111827]">“Website does not exist.”</strong> VirusTotal only stores records for URLs that were previously submitted by security analysts or automated crawlers. Absence of detections is not evidence of safety.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F2EA] border border-[#D8DCE2] rounded-lg font-mono text-xs text-[#111827] mt-1">
                <span className="text-[#697386] font-semibold">Target URL:</span>
                <span className="select-all break-all">{notFoundState.indicator}</span>
              </div>
            </div>
          </div>

          {/* Multi-Source Evidence Sources for Uncataloged URL */}
          {(notFoundState.dnsEvidence || notFoundState.safeBrowsingEvidence) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111827]">
                  Independent Evidence Sources (Resolved in Real-Time)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source 1: Google Public DNS over HTTPS */}
                {notFoundState.dnsEvidence && (
                  <div className="p-4 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#2D7773]" />
                        <span className="font-bold text-xs text-[#111827]">Google Public DNS (DoH)</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          notFoundState.dnsEvidence.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : notFoundState.dnsEvidence.status === 'nxdomain'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {notFoundState.dnsEvidence.status === 'resolved'
                          ? 'RESOLVED (NOERROR)'
                          : notFoundState.dnsEvidence.status === 'nxdomain'
                          ? 'NON-EXISTENT (NXDOMAIN)'
                          : notFoundState.dnsEvidence.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-[#697386] leading-relaxed">
                      {notFoundState.dnsEvidence.message}
                    </p>

                    {notFoundState.dnsEvidence.ipAddresses && notFoundState.dnsEvidence.ipAddresses.length > 0 && (
                      <div className="text-[11px] font-mono text-[#111827] flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] uppercase font-bold text-[#697386] block w-full">
                          Resolved IPs:
                        </span>
                        {notFoundState.dnsEvidence.ipAddresses.map((ip) => (
                          <span key={ip} className="px-1.5 py-0.5 bg-white border border-[#D8DCE2] rounded text-xs">
                            {ip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Source 2: Google Safe Browsing Lookup API v4 */}
                {notFoundState.safeBrowsingEvidence && (
                  <div className="p-4 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#2D7773]" />
                        <span className="font-bold text-xs text-[#111827]">Google Safe Browsing (API v4)</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          notFoundState.safeBrowsingEvidence.status === 'threat_found'
                            ? 'bg-red-100 text-red-800'
                            : notFoundState.safeBrowsingEvidence.status === 'safe'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {notFoundState.safeBrowsingEvidence.status === 'threat_found'
                          ? 'THREAT LISTED'
                          : notFoundState.safeBrowsingEvidence.status === 'safe'
                          ? 'NO THREATS LISTED'
                          : notFoundState.safeBrowsingEvidence.status === 'not_configured'
                          ? 'NOT CONFIGURED'
                          : 'PENDING'}
                      </span>
                    </div>

                    <p className="text-xs text-[#697386] leading-relaxed">
                      {notFoundState.safeBrowsingEvidence.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option to submit URL for analysis with explicit consent */}
          {notFoundState.canSubmitScan && (
            <div className="p-5 sm:p-6 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-4">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-[#2D7773] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#111827]">
                    Request Live Analysis from VirusTotal
                  </h4>
                  <p className="text-xs text-[#697386] leading-relaxed">
                    Would you like to submit this URL to VirusTotal for an active scan by 70+ participating antivirus vendors?
                    Submitting this URL will cause VirusTotal crawlers to visit the destination and index the findings in public threat intelligence feeds.
                  </p>
                </div>
              </div>

              {/* Informed Consent Checkbox */}
              <label className="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-[#D8DCE2] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={scanConsent}
                  onChange={(e) => setScanConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[#D8DCE2] text-[#2D7773] focus:ring-[#2D7773]"
                />
                <span className="text-[#111827] leading-relaxed select-none">
                  <strong>Explicit Analysis Consent:</strong> I confirm and consent to submitting this URL to VirusTotal for active scanning.
                  I understand that this action adds the URL to public threat intelligence feeds. I verify that this URL contains no personal credentials, session tokens, or confidential passwords.
                </span>
              </label>

              {scanNotice && (
                <div className="p-3 bg-white rounded-lg border border-[#2D7773] text-xs text-[#2D7773] flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{scanNotice}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!scanConsent || isSubmittingScan}
                  onClick={handleScanSubmit}
                  className="px-4 py-2 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isSubmittingScan ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting to VirusTotal Engines...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5 text-[#D5A64A]" />
                      <span>Submit URL for Live Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Unavailable Banner (Honest status, no silent mock replacement) */}
      {serviceError && (
        <div className="bg-white border border-amber-300 rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 block">
                Outcome Verdict: Service Unavailable
              </span>
              <h3 className="text-base font-bold text-[#111827]">
                Threat Intelligence Service Notice
              </h3>
              <p className="text-xs text-[#697386] leading-relaxed">
                {serviceError.message}
              </p>
            </div>
          </div>

          {/* Multi-Source Evidence Sources Even When Primary VT Feed is Inactive */}
          {(serviceError.dnsEvidence || serviceError.safeBrowsingEvidence) && (
            <div className="space-y-3 pt-2 border-t border-[#D8DCE2]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111827]">
                  Independent Evidence Sources (Resolved in Real-Time)
                </h4>
                <span className="text-[11px] text-[#697386]">Live external queries</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source 1: Google Public DNS over HTTPS */}
                {serviceError.dnsEvidence && (
                  <div className="p-4 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#2D7773]" />
                        <span className="font-bold text-xs text-[#111827]">Google Public DNS (DoH)</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          serviceError.dnsEvidence.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : serviceError.dnsEvidence.status === 'nxdomain'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {serviceError.dnsEvidence.status === 'resolved'
                          ? 'RESOLVED (NOERROR)'
                          : serviceError.dnsEvidence.status === 'nxdomain'
                          ? 'NON-EXISTENT (NXDOMAIN)'
                          : serviceError.dnsEvidence.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-[#697386] leading-relaxed">
                      {serviceError.dnsEvidence.message}
                    </p>

                    {serviceError.dnsEvidence.ipAddresses && serviceError.dnsEvidence.ipAddresses.length > 0 && (
                      <div className="text-[11px] font-mono text-[#111827] flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] uppercase font-bold text-[#697386] block w-full">
                          Resolved IPs:
                        </span>
                        {serviceError.dnsEvidence.ipAddresses.map((ip) => (
                          <span key={ip} className="px-1.5 py-0.5 bg-white border border-[#D8DCE2] rounded text-xs">
                            {ip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Source 2: Google Safe Browsing Lookup API v4 */}
                {serviceError.safeBrowsingEvidence && (
                  <div className="p-4 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#2D7773]" />
                        <span className="font-bold text-xs text-[#111827]">Google Safe Browsing (API v4)</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          serviceError.safeBrowsingEvidence.status === 'threat_found'
                            ? 'bg-red-100 text-red-800'
                            : serviceError.safeBrowsingEvidence.status === 'safe'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {serviceError.safeBrowsingEvidence.status === 'threat_found'
                          ? 'THREAT LISTED'
                          : serviceError.safeBrowsingEvidence.status === 'safe'
                          ? 'NO THREATS LISTED'
                          : serviceError.safeBrowsingEvidence.status === 'not_configured'
                          ? 'NOT CONFIGURED'
                          : 'PENDING'}
                      </span>
                    </div>

                    <p className="text-xs text-[#697386] leading-relaxed">
                      {serviceError.safeBrowsingEvidence.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] text-xs text-[#111827] space-y-2">
            <span className="font-bold block font-mono">
              Integrity & Honesty Commitment:
            </span>
            <p className="text-[#697386] leading-relaxed">
              TRUST//CHECK never fabricates live results or secretly substitutes synthetic data for your requested indicator. When live threat feeds are unconfigured or rate-limited, you can examine verified demonstration scenarios or configure your server API key in the Owner console.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => handleLoadDemo(indicatorType)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111827] text-white rounded-lg text-xs font-semibold hover:bg-[#2D7773] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
                <span>Explore Verified Sample Threat Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Report Display */}
      {activeReport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">
              Investigation Evidence Report
            </h3>
            <span className="text-xs font-mono text-[#697386]">
              {activeReport.is_live ? 'Live Threat Intelligence' : 'Interactive Demo · Simulated Evidence'}
            </span>
          </div>

          <ResultsDashboard
            report={activeReport}
            onReset={() => setActiveReport(null)}
          />
        </div>
      )}
    </div>
  );
};
