/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Search,
  Server,
  Calendar,
  Lock,
  Globe,
  FileText,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { UnifiedReport, AssessmentCategory } from '../types/index.ts';

interface ResultsDashboardProps {
  report: UnifiedReport;
  onRequestRescan?: (url: string) => Promise<void>;
  isRescanning?: boolean;
  onReset?: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  report,
  onRequestRescan,
  isRescanning,
}) => {
  const [copied, setCopied] = useState(false);
  const [engineFilter, setEngineFilter] = useState<'all' | 'flagged' | 'harmless'>('all');
  const [engineSearch, setEngineSearch] = useState('');
  const [showMetadata, setShowMetadata] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(report.indicator);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAssessmentConfig = (category: AssessmentCategory) => {
    switch (category) {
      case 'malicious':
        return {
          title: 'Malicious Indicators Found',
          bgColor: 'bg-[#C94C4C]/10',
          borderColor: 'border-[#C94C4C]/30',
          textColor: 'text-[#C94C4C]',
          icon: ShieldAlert,
          badgeText: 'MALICIOUS DETECTIONS FOUND',
        };
      case 'suspicious':
        return {
          title: 'Suspicious Findings',
          bgColor: 'bg-[#D5A64A]/10',
          borderColor: 'border-[#D5A64A]/30',
          textColor: 'text-[#D5A64A]',
          icon: AlertTriangle,
          badgeText: 'SUSPICIOUS FINDINGS',
        };
      case 'conflicting':
        return {
          title: 'Conflicting Evidence: Isolated Vendor Detection',
          bgColor: 'bg-[#D5A64A]/10',
          borderColor: 'border-[#D5A64A]/40',
          textColor: 'text-[#D5A64A]',
          icon: AlertTriangle,
          badgeText: 'CONFLICTING EVIDENCE: ONE VENDOR FLAGGED',
        };
      case 'no_detections':
        return {
          title: 'No Detections Reported',
          bgColor: 'bg-[#2D7773]/10',
          borderColor: 'border-[#2D7773]/30',
          textColor: 'text-[#2D7773]',
          icon: CheckCircle2,
          badgeText: 'NO DETECTIONS REPORTED',
        };
      case 'inconclusive':
      default:
        return {
          title: 'Inconclusive',
          bgColor: 'bg-[#697386]/10',
          borderColor: 'border-[#697386]/30',
          textColor: 'text-[#697386]',
          icon: HelpCircle,
          badgeText: 'INCONCLUSIVE EVIDENCE',
        };
    }
  };

  const config = getAssessmentConfig(report.assessment);
  const AssessmentIcon = config.icon;

  const totalEngines =
    (report.stats.malicious || 0) +
    (report.stats.suspicious || 0) +
    (report.stats.harmless || 0) +
    (report.stats.undetected || 0);

  // Filter engines
  const filteredEngines = report.engines.filter((eng) => {
    const matchesSearch =
      eng.engine_name.toLowerCase().includes(engineSearch.toLowerCase()) ||
      (eng.result && eng.result.toLowerCase().includes(engineSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (engineFilter === 'flagged') {
      return eng.category === 'malicious' || eng.category === 'suspicious';
    }
    if (engineFilter === 'harmless') {
      return eng.category === 'harmless' || eng.category === 'undetected';
    }
    return true;
  });

  // Sort engines so flagged detections (malicious, then suspicious) appear prominently at the top
  const sortedEngines = [...filteredEngines].sort((a, b) => {
    const priority: Record<string, number> = { malicious: 1, suspicious: 2, harmless: 3, undetected: 4 };
    const pA = priority[a.category] || 5;
    const pB = priority[b.category] || 5;
    if (pA !== pB) return pA - pB;
    return a.engine_name.localeCompare(b.engine_name);
  });

  const flaggedEngines = report.engines.filter(
    (e) => e.category === 'malicious' || e.category === 'suspicious'
  );

  return (
    <div className="space-y-6">
      {/* SIMULATED DATA WATERMARK BANNER (When running demo/simulation) */}
      {report.is_simulated && (
        <div className="bg-[#111827] text-white p-3.5 rounded-xl border border-[#D5A64A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D5A64A]" />
            <strong className="tracking-wide uppercase font-mono text-[#D5A64A]">
              SIMULATED DATA — NOT A LIVE SECURITY CHECK
            </strong>
          </div>
          <span className="text-[#D8DCE2] text-[11px]">
            Synthesized scenario for educational & presentation demonstrations. Zero external requests emitted.
          </span>
        </div>
      )}

      {/* 1. Executive Summary Card */}
      <div className={`p-6 sm:p-8 rounded-xl border ${config.borderColor} ${config.bgColor} bg-opacity-40`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded ${config.bgColor} ${config.textColor}`}>
                {config.badgeText}
              </span>
              <span className="text-xs text-[#697386]">·</span>
              <span className="text-xs uppercase font-semibold tracking-wider text-[#697386]">
                {report.indicator_type.toUpperCase()} EVIDENCE
              </span>
              <span className="text-xs text-[#697386]">·</span>
              <span className="text-xs text-[#697386]">{report.provider}</span>
            </div>

            <div className="flex items-center gap-3">
              <AssessmentIcon className={`w-8 h-8 ${config.textColor} shrink-0`} />
              <div>
                <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
                  {config.title}
                </h2>
                {report.assessment === 'conflicting' && (
                  <p className="text-xs font-semibold text-[#D5A64A] mt-0.5">
                    Notice: 1 security vendor flagged this URL while other vendors report no detections. This isolated flag is displayed below for independent verification.
                  </p>
                )}
                {report.assessment === 'no_detections' && (
                  <p className="text-xs font-bold text-[#C94C4C] mt-0.5">
                    Critical notice: Zero reported detections does NOT prove that a destination is safe.
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-[#111827]/90 leading-relaxed max-w-3xl">
              {report.assessment_summary}
            </p>

            {/* Indicator Details & Copy Tool */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#D8DCE2] rounded-lg font-mono text-xs text-[#111827]">
                <span className="font-semibold text-[#697386]">Target:</span>
                <span className="select-all break-all">{report.raw_indicator_masked}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[#697386] hover:text-[#111827] ml-1 p-0.5"
                  title="Copy indicator"
                  aria-label="Copy indicator"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#2D7773]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {report.permalink && (
                <a
                  href={report.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFFFFF] border border-[#D8DCE2] rounded-lg text-xs font-medium text-[#697386] hover:text-[#111827] transition-colors"
                >
                  <span>VirusTotal Record</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Timestamp */}
              <span className="text-xs text-[#697386] ml-auto font-mono">
                Report Time: {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </span>
            </div>
          </div>

          {/* Quick Rescan CTA if URL */}
          {report.indicator_type === 'url' && onRequestRescan && !report.is_simulated && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => onRequestRescan(report.indicator)}
                disabled={isRescanning}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#111827] bg-[#FFFFFF] hover:bg-[#F5F2EA] border border-[#D8DCE2] rounded-lg shadow-2xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#2D7773] ${isRescanning ? 'animate-spin' : ''}`} />
                <span>{isRescanning ? 'Submitting Re-scan...' : 'Request Fresh Scan'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Multi-Provider Pipeline Availability Status Strip */}
        {report.provider_availability && (
          <div className="mt-5 pt-4 border-t border-[#D8DCE2]/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#697386]">
                Threat Intelligence Provider Coverage:
              </span>
              <span className="text-[10px] text-[#697386]">Independent Verification Streams</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Google Public DNS */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono ${
                  report.provider_availability.googleDns.status === 'resolved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : report.provider_availability.googleDns.status === 'nxdomain'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-[#F5F2EA] border-[#D8DCE2] text-[#697386]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  DNS:{' '}
                  {report.provider_availability.googleDns.status === 'resolved'
                    ? 'Resolved'
                    : report.provider_availability.googleDns.status === 'nxdomain'
                    ? 'Non-Existent (NXDOMAIN)'
                    : report.provider_availability.googleDns.status.toUpperCase()}
                </span>
              </div>

              {/* Google Safe Browsing */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono ${
                  report.provider_availability.safeBrowsing.status === 'safe'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : report.provider_availability.safeBrowsing.status === 'threat_found'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  Safe Browsing:{' '}
                  {report.provider_availability.safeBrowsing.status === 'safe'
                    ? 'No Threats Listed'
                    : report.provider_availability.safeBrowsing.status === 'threat_found'
                    ? 'Threat Found'
                    : report.provider_availability.safeBrowsing.status === 'not_configured'
                    ? 'Unconfigured'
                    : 'Unavailable'}
                </span>
              </div>

              {/* VirusTotal */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono ${
                  report.provider_availability.virusTotal.status === 'available'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : report.provider_availability.virusTotal.status === 'not_found'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : report.provider_availability.virusTotal.status === 'rate_limited'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-[#F5F2EA] border-[#D8DCE2] text-[#697386]'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>
                  VirusTotal:{' '}
                  {report.provider_availability.virusTotal.status === 'available'
                    ? `Active (${report.engines.length} Engines)`
                    : report.provider_availability.virusTotal.status === 'not_found'
                    ? 'Unindexed (404)'
                    : report.provider_availability.virusTotal.status === 'rate_limited'
                    ? `Quota Reached (${report.provider_availability.virusTotal.retryAfterSeconds || 15}s wait)`
                    : report.provider_availability.virusTotal.status === 'unconfigured'
                    ? 'Unconfigured'
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Limitations & Uncertainty Banner */}
        <div className="mt-6 pt-5 border-t border-[#D8DCE2]/60 text-xs text-[#697386] space-y-1">
          <span className="font-semibold text-[#111827] block mb-1">
            Forensic Scope & Inherent Limitations:
          </span>
          <ul className="list-disc pl-4 space-y-0.5">
            {report.limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Multi-Source Evidence Verification: Google Public DNS & Google Safe Browsing (Separate Evidence Sources) */}
      {(report.dns_evidence || report.safe_browsing_evidence) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
              <span>Multi-Source Security Verification</span>
            </h3>
            <span className="text-[11px] text-[#697386]">
              Independent verification sources
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source A: Google Public DNS over HTTPS */}
            {report.dns_evidence && (
              <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2D7773]" />
                    <span className="font-bold text-xs text-[#111827]">
                      Google Public DNS over HTTPS (DoH)
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      report.dns_evidence.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : report.dns_evidence.status === 'nxdomain'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {report.dns_evidence.status === 'resolved'
                      ? 'RESOLVED (NOERROR)'
                      : report.dns_evidence.status === 'nxdomain'
                      ? 'NON-EXISTENT (NXDOMAIN)'
                      : report.dns_evidence.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#697386] leading-relaxed">
                  {report.dns_evidence.message}
                </p>

                {report.dns_evidence.ipAddresses && report.dns_evidence.ipAddresses.length > 0 && (
                  <div className="p-2.5 bg-[#F5F2EA] rounded-lg font-mono text-[11px] text-[#111827] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#697386] block">
                      Active IP Addresses (A Records):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.dns_evidence.ipAddresses.map((ip) => (
                        <span key={ip} className="px-2 py-0.5 bg-white border border-[#D8DCE2] rounded text-xs font-semibold">
                          {ip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Source B: Google Safe Browsing Lookup API v4 */}
            {report.safe_browsing_evidence && (
              <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#2D7773]" />
                    <span className="font-bold text-xs text-[#111827]">
                      Google Safe Browsing (API v4)
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      report.safe_browsing_evidence.status === 'threat_found'
                        ? 'bg-red-100 text-red-800'
                        : report.safe_browsing_evidence.status === 'safe'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {report.safe_browsing_evidence.status === 'threat_found'
                      ? 'THREAT LISTED'
                      : report.safe_browsing_evidence.status === 'safe'
                      ? 'NO THREATS LISTED'
                      : report.safe_browsing_evidence.status === 'not_configured'
                      ? 'NOT CONFIGURED'
                      : 'STATUS PENDING'}
                  </span>
                </div>

                <p className="text-xs text-[#697386] leading-relaxed">
                  {report.safe_browsing_evidence.message}
                </p>

                {report.safe_browsing_evidence.matches && report.safe_browsing_evidence.matches.length > 0 && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-900 space-y-1">
                    <span className="font-bold block uppercase text-[10px]">Identified Threat Matches:</span>
                    {report.safe_browsing_evidence.matches.map((m, i) => (
                      <div key={i} className="font-mono">
                        • {m.threatType} on {m.platformType}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Detection Cards (4-Column Tabular Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Malicious */}
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#697386] mb-1">
            <span className="font-medium">Malicious</span>
            <span className="w-2 h-2 rounded-full bg-[#C94C4C]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#111827] tabular-nums">
            {report.stats.malicious}
          </div>
          <p className="text-[11px] text-[#697386] mt-1">Confirmed blacklists & malware signatures</p>
        </div>

        {/* Suspicious */}
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#697386] mb-1">
            <span className="font-medium">Suspicious</span>
            <span className="w-2 h-2 rounded-full bg-[#D5A64A]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#111827] tabular-nums">
            {report.stats.suspicious}
          </div>
          <p className="text-[11px] text-[#697386] mt-1">Heuristic warnings & anomalous traits</p>
        </div>

        {/* Harmless */}
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#697386] mb-1">
            <span className="font-medium">Harmless</span>
            <span className="w-2 h-2 rounded-full bg-[#2D7773]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#111827] tabular-nums">
            {report.stats.harmless}
          </div>
          <p className="text-[11px] text-[#697386] mt-1">Vendors evaluating destination as clean</p>
        </div>

        {/* Undetected */}
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#697386] mb-1">
            <span className="font-medium">Undetected</span>
            <span className="w-2 h-2 rounded-full bg-[#D8DCE2]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#111827] tabular-nums">
            {report.stats.undetected}
          </div>
          <p className="text-[11px] text-[#697386] mt-1">No opinion / signature absent</p>
        </div>
      </div>

      {/* Engine Detection Bar */}
      {totalEngines > 0 && (
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#697386]">
            <span>ENGINE CONSENSUS DISTRIBUTION</span>
            <span>{totalEngines} Participating Vendors</span>
          </div>
          <div className="h-3 w-full bg-[#F5F2EA] rounded-full overflow-hidden flex">
            {report.stats.malicious > 0 && (
              <div
                style={{ width: `${(report.stats.malicious / totalEngines) * 100}%` }}
                className="bg-[#C94C4C] h-full"
                title={`Malicious: ${report.stats.malicious}`}
              />
            )}
            {report.stats.suspicious > 0 && (
              <div
                style={{ width: `${(report.stats.suspicious / totalEngines) * 100}%` }}
                className="bg-[#D5A64A] h-full"
                title={`Suspicious: ${report.stats.suspicious}`}
              />
            )}
            {report.stats.harmless > 0 && (
              <div
                style={{ width: `${(report.stats.harmless / totalEngines) * 100}%` }}
                className="bg-[#2D7773] h-full"
                title={`Harmless: ${report.stats.harmless}`}
              />
            )}
            {report.stats.undetected > 0 && (
              <div
                style={{ width: `${(report.stats.undetected / totalEngines) * 100}%` }}
                className="bg-[#D8DCE2] h-full"
                title={`Undetected: ${report.stats.undetected}`}
              />
            )}
          </div>
        </div>
      )}

      {/* 3. Technical Metadata (Collapsible) */}
      {report.technical_metadata && (
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F5F2EA]/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#2D7773]" />
              <h3 className="text-sm font-bold text-[#111827]">
                Observed Technical Metadata & Infrastructure
              </h3>
            </div>
            {showMetadata ? (
              <ChevronUp className="w-4 h-4 text-[#697386]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#697386]" />
            )}
          </button>

          {showMetadata && (
            <div className="px-6 pb-6 pt-2 border-t border-[#D8DCE2] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              {report.technical_metadata.asn && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                  <span className="text-[#697386] block text-[10px] uppercase">Autonomous System</span>
                  <span className="font-bold text-[#111827]">{report.technical_metadata.asn}</span>
                  {report.technical_metadata.as_owner && (
                    <span className="block text-[11px] text-[#697386] truncate">
                      {report.technical_metadata.as_owner}
                    </span>
                  )}
                </div>
              )}

              {report.technical_metadata.country && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                  <span className="text-[#697386] block text-[10px] uppercase">Country Origin</span>
                  <span className="font-bold text-[#111827]">{report.technical_metadata.country}</span>
                </div>
              )}

              {report.technical_metadata.registrar && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                  <span className="text-[#697386] block text-[10px] uppercase">Domain Registrar</span>
                  <span className="font-bold text-[#111827] truncate block">
                    {report.technical_metadata.registrar}
                  </span>
                </div>
              )}

              {report.technical_metadata.creation_date && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                  <span className="text-[#697386] block text-[10px] uppercase">Registration Date</span>
                  <span className="font-bold text-[#111827]">{report.technical_metadata.creation_date}</span>
                </div>
              )}

              {report.technical_metadata.file_size && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                  <span className="text-[#697386] block text-[10px] uppercase">Payload Size</span>
                  <span className="font-bold text-[#111827]">
                    {(report.technical_metadata.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              {report.technical_metadata.file_type && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                  <span className="text-[#697386] block text-[10px] uppercase">File Type</span>
                  <span className="font-bold text-[#111827] truncate block">
                    {report.technical_metadata.file_type}
                  </span>
                </div>
              )}

              {report.technical_metadata.sha256 && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] md:col-span-2 lg:col-span-3">
                  <span className="text-[#697386] block text-[10px] uppercase">SHA-256 Fingerprint</span>
                  <span className="font-bold text-[#111827] break-all select-all">
                    {report.technical_metadata.sha256}
                  </span>
                </div>
              )}

              {report.technical_metadata.last_dns_records && report.technical_metadata.last_dns_records.length > 0 && (
                <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] md:col-span-2 lg:col-span-3">
                  <span className="text-[#697386] block text-[10px] uppercase mb-1">
                    Recorded DNS Resolutions (Passive)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {report.technical_metadata.last_dns_records.map((dns, idx) => (
                      <div key={idx} className="bg-white p-1.5 rounded border border-[#D8DCE2] text-[11px]">
                        <span className="text-[#2D7773] font-bold mr-1">{dns.type}:</span>
                        <span className="text-[#111827]">{dns.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Relationships / Infrastructure (Expanded Mode) */}
      {report.relationships && (
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-6 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2D7773]" />
            <h3 className="text-sm font-bold text-[#111827]">
              Related Infrastructure & Graph Evidence
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {report.relationships.related_ips && report.relationships.related_ips.length > 0 && (
              <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                <span className="text-[#697386] block text-[10px] uppercase mb-1">Resolving IP Addresses</span>
                <ul className="space-y-1">
                  {report.relationships.related_ips.map((ip, i) => (
                    <li key={i} className="text-[#111827] font-semibold">{ip}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.relationships.related_domains && report.relationships.related_domains.length > 0 && (
              <div className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
                <span className="text-[#697386] block text-[10px] uppercase mb-1">Associated Domains</span>
                <ul className="space-y-1">
                  {report.relationships.related_domains.map((dom, i) => (
                    <li key={i} className="text-[#111827] font-semibold truncate">{dom}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Engine Verdicts Table */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#D8DCE2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Security Vendor Verdicts & Classifications
            </h3>
            <p className="text-xs text-[#697386] mt-0.5">
              Individual scanner detections, threat classifications, and detection methods.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="inline-flex p-0.5 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] text-xs">
              <button
                type="button"
                onClick={() => setEngineFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  engineFilter === 'all' ? 'bg-white text-[#111827] shadow-xs font-semibold' : 'text-[#697386]'
                }`}
              >
                All ({report.engines.length})
              </button>
              <button
                type="button"
                onClick={() => setEngineFilter('flagged')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  engineFilter === 'flagged' ? 'bg-white text-[#C94C4C] shadow-xs font-semibold' : 'text-[#697386]'
                }`}
              >
                Flagged ({report.stats.malicious + report.stats.suspicious})
              </button>
              <button
                type="button"
                onClick={() => setEngineFilter('harmless')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  engineFilter === 'harmless' ? 'bg-white text-[#2D7773] shadow-xs font-semibold' : 'text-[#697386]'
                }`}
              >
                Harmless ({report.stats.harmless})
              </button>
            </div>

            {/* Engine Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendor..."
                value={engineSearch}
                onChange={(e) => setEngineSearch(e.target.value)}
                className="h-8 pl-7 pr-3 text-xs bg-[#F5F2EA] border border-[#D8DCE2] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D7773]"
              />
              <Search className="w-3.5 h-3.5 text-[#697386] absolute left-2 top-2.5" />
            </div>
          </div>
        </div>

        {/* Isolated Vendor Detection Highlight Callout (Requirement 3, 4, 5) */}
        {report.assessment === 'conflicting' && flaggedEngines.length > 0 && (
          <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Isolated Vendor Detection Details ({flaggedEngines.length} Flagged / {totalEngines} Evaluated)</span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Conflicting evidence: One or isolated security vendor(s) flagged this target while {report.stats.harmless} vendors reported harmless and {report.stats.undetected} reported undetected. This detection is preserved with its engine name, classification, and method for independent verification, and is not automatically dismissed as a false positive:
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
              {flaggedEngines.map((f, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-950 font-semibold shadow-2xs">
                  <span className="text-[#111827]">{f.engine_name}:</span>
                  <span className="text-[#C94C4C] uppercase">{f.result || f.category}</span>
                  <span className="text-[11px] text-[#697386] font-normal">({f.method || 'signature'})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F2EA] text-[#697386] font-mono uppercase text-[10px] sticky top-0 border-b border-[#D8DCE2]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Security Engine</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Reported Threat / Classification</th>
                <th className="py-2.5 px-4 font-semibold">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8DCE2]/60">
              {sortedEngines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#697386]">
                    No engines matching the selected filter.
                  </td>
                </tr>
              ) : (
                sortedEngines.map((eng, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F2EA]/40 transition-colors font-mono">
                    <td className="py-2.5 px-4 font-medium text-[#111827]">
                      {eng.engine_name}
                    </td>
                    <td className="py-2.5 px-4">
                      {eng.category === 'malicious' && (
                        <span className="text-[#C94C4C] font-semibold">Malicious</span>
                      )}
                      {eng.category === 'suspicious' && (
                        <span className="text-[#D5A64A] font-semibold">Suspicious</span>
                      )}
                      {eng.category === 'harmless' && (
                        <span className="text-[#2D7773]">Harmless</span>
                      )}
                      {eng.category === 'undetected' && (
                        <span className="text-[#697386]">Undetected</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#111827]">
                      {eng.result || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-[#697386] text-[11px]">
                      {eng.method || 'signature'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Actionable Next Steps */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-6 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-[#111827]">
          Recommended Protective Actions
        </h3>
        {report.assessment === 'malicious' || report.assessment === 'suspicious' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#111827]">
            <div className="p-3 bg-[#C94C4C]/5 border border-[#C94C4C]/20 rounded-lg">
              <span className="font-bold text-[#C94C4C] block mb-1">1. Do Not Enter Passwords</span>
              <span>Never type credentials, MFA codes, or personal identifiers into this indicator destination.</span>
            </div>
            <div className="p-3 bg-[#C94C4C]/5 border border-[#C94C4C]/20 rounded-lg">
              <span className="font-bold text-[#C94C4C] block mb-1">2. Abort Executable Downloads</span>
              <span>Do not open or execute files downloaded from this source. Check hash fingerprints first.</span>
            </div>
            <div className="p-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-lg">
              <span className="font-bold text-[#111827] block mb-1">3. Verify Origin Independently</span>
              <span>Contact the purported service provider through official telephone or domain bookmarks.</span>
            </div>
            <div className="p-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-lg">
              <span className="font-bold text-[#111827] block mb-1">4. Remediate If Exposed</span>
              <span>If credentials were typed, immediately change your password on the genuine site and revoke active sessions.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#111827]">
            <div className="p-3 bg-[#2D7773]/5 border border-[#2D7773]/20 rounded-lg">
              <span className="font-bold text-[#2D7773] block mb-1">Maintain Active Vigilance</span>
              <span>Zero reports means no known detections exist in current threat feeds. Staging phishing links often remain undetected in their first 24 hours.</span>
            </div>
            <div className="p-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-lg">
              <span className="font-bold text-[#111827] block mb-1">Check Contextual Signals</span>
              <span>Assess whether the email or message arrived unexpectedly, demanded rapid urgency, or promised unrealistic incentives.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
