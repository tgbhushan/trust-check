/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
} from 'lucide-react';
import type { IndicatorType, InvestigationMode, SensitiveCheckResult } from '../types/index.ts';
import {
  validateUrl,
  validateDomain,
  validateIp,
  validateFileHash,
  detectSensitiveIndicators,
} from '../utils/indicators.ts';

interface IndicatorFormProps {
  onInvestigate: (indicator: string, type: IndicatorType, mode: InvestigationMode) => Promise<void>;
  isLoading: boolean;
  userConsented: boolean;
  setUserConsented: (consented: boolean) => void;
  onOpenDemoScenario: (scenarioId: string) => void;
  hasApiKey: boolean;
  onOpenSecretModal: () => void;
}

const PRESET_EXAMPLES: Record<IndicatorType, Array<{ label: string; value: string; desc: string }>> = {
  url: [
    { label: 'archive.org (Clean)', value: 'https://archive.org', desc: 'Established non-profit digital archive' },
    { label: 'Phish Simulation', value: 'https://security-verify-account.example-phish.net/login', desc: 'Simulated credential harvesting URL' },
    { label: 'Token Test', value: 'https://service.example.com/reset?token=a8f9c2d1e0&auth=true', desc: 'Demonstrates sensitive indicator blocking' },
  ],
  domain: [
    { label: 'wikipedia.org', value: 'wikipedia.org', desc: 'High reputation knowledge repository' },
    { label: 'crypto-airdrop.xyz', value: 'crypto-airdrop-bonus2026.example.org', desc: 'Simulated suspicious typosquatting domain' },
    { label: 'example.com', value: 'example.com', desc: 'IANA official documentation domain' },
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
      desc: 'Known InfoStealer executable hash',
    },
    {
      label: 'Null SHA-256',
      value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      desc: 'Empty file 0-byte benchmark hash',
    },
  ],
};

export const IndicatorForm: React.FC<IndicatorFormProps> = ({
  onInvestigate,
  isLoading,
  userConsented,
  setUserConsented,
  onOpenDemoScenario,
  hasApiKey,
  onOpenSecretModal,
}) => {
  const [indicatorType, setIndicatorType] = useState<IndicatorType>('url');
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<InvestigationMode>('standard');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sensitiveAlert, setSensitiveAlert] = useState<SensitiveCheckResult | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Evaluate sensitive indicators as user types
  useEffect(() => {
    if (!inputValue.trim()) {
      setValidationError(null);
      setSensitiveAlert(null);
      return;
    }
    const check = detectSensitiveIndicators(inputValue, indicatorType);
    if (check.isSensitive) {
      setSensitiveAlert(check);
    } else {
      setSensitiveAlert(null);
    }
  }, [inputValue, indicatorType]);

  const handleTypeChange = (newType: IndicatorType) => {
    setIndicatorType(newType);
    setValidationError(null);
    setSensitiveAlert(null);
    setInputValue('');
  };

  const validateCurrentInput = (): { valid: boolean; normalized?: string; error?: string } => {
    if (indicatorType === 'url') return validateUrl(inputValue);
    if (indicatorType === 'domain') return validateDomain(inputValue);
    if (indicatorType === 'ip') return validateIp(inputValue);
    if (indicatorType === 'file') return validateFileHash(inputValue);
    return { valid: false, error: 'Unknown indicator type.' };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

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

    // Check user consent
    if (!userConsented) {
      setPendingSubmit(true);
      setShowConsentModal(true);
      return;
    }

    await onInvestigate(check.normalized, indicatorType, mode);
  };

  const handleConfirmConsent = async () => {
    setUserConsented(true);
    setShowConsentModal(false);
    if (pendingSubmit) {
      setPendingSubmit(false);
      const check = validateCurrentInput();
      if (check.valid && check.normalized) {
        await onInvestigate(check.normalized, indicatorType, mode);
      }
    }
  };

  const applySanitizedUrl = () => {
    if (sensitiveAlert?.sanitizedSuggestion) {
      setInputValue(sensitiveAlert.sanitizedSuggestion);
      setSensitiveAlert(null);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs">
      {/* Indicator Type Segmented Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#D8DCE2]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#697386] block mb-2">
            Investigation Target
          </span>
          <div className="inline-flex p-1 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
            <button
              type="button"
              onClick={() => handleTypeChange('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                indicatorType === 'url'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('domain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                indicatorType === 'domain'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Domain</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('ip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                indicatorType === 'ip'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>IP Address</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('file')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                indicatorType === 'file'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>File Hash</span>
            </button>
          </div>
        </div>

        {/* Mode Selector (Standard vs Expanded) */}
        {(indicatorType === 'url' || indicatorType === 'domain') && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#697386] block mb-2">
              Investigation Scope
            </span>
            <div className="inline-flex p-1 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'standard'
                    ? 'bg-[#FFFFFF] text-[#111827] shadow-xs'
                    : 'text-[#697386] hover:text-[#111827]'
                }`}
              >
                <span>Standard (1 API call)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('expanded')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'expanded'
                    ? 'bg-[#2D7773] text-white shadow-xs'
                    : 'text-[#697386] hover:text-[#111827]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Expanded Multi-Asset</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="indicator-input" className="block text-sm font-semibold text-[#111827] mb-1.5">
            {indicatorType === 'url' && 'Website or Link URL'}
            {indicatorType === 'domain' && 'Fully Qualified Domain Name (FQDN)'}
            {indicatorType === 'ip' && 'IPv4 or IPv6 Public Host Address'}
            {indicatorType === 'file' && 'SHA-256 File Hash (64 hex characters)'}
          </label>
          <div className="relative">
            <input
              id="indicator-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                indicatorType === 'url'
                  ? 'e.g. https://example.com/path or https://archive.org'
                  : indicatorType === 'domain'
                  ? 'e.g. example.com or news.organization.org'
                  : indicatorType === 'ip'
                  ? 'e.g. 1.1.1.1 or 8.8.8.8'
                  : 'e.g. 2c2446132bb3522f741b7c06d3b8e23807768323860f4178ab0f31e33ccfe2a8'
              }
              className={`w-full h-12 pl-4 pr-10 rounded-lg border font-mono text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2D7773] ${
                validationError || sensitiveAlert
                  ? 'border-[#C94C4C] bg-[#C94C4C]/5 text-[#111827]'
                  : 'border-[#D8DCE2] bg-[#FFFFFF] text-[#111827]'
              }`}
              autoComplete="off"
              spellCheck="false"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-3 top-3.5 text-[#697386] hover:text-[#111827]"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-[#697386]">
            {indicatorType === 'url' && 'Query retrieves existing VirusTotal URL telemetry. Does not submit arbitrary web crawls.'}
            {indicatorType === 'domain' && 'Analyzes reputation, classifications, and reported domain-level telemetry.'}
            {indicatorType === 'ip' && 'Inspects autonomous system and reported abuse telemetry for public IP addresses.'}
            {indicatorType === 'file' && 'Lookup by cryptographic fingerprint. No local files are uploaded or executed.'}
          </p>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/30 text-xs text-[#C94C4C]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Input Format Invalid</span>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Sensitive Indicator Alert & Blocking Box */}
        {sensitiveAlert && (
          <div className="p-4 rounded-lg bg-[#D5A64A]/10 border border-[#D5A64A]/40 text-xs text-[#111827] space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#C94C4C] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#111827] text-sm block">
                  Sensitive Indicator Safeguard Triggered
                </span>
                <p className="text-[#697386] mt-1 leading-relaxed">
                  {sensitiveAlert.reason}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D5A64A]/30">
              {sensitiveAlert.sanitizedSuggestion && (
                <button
                  type="button"
                  onClick={applySanitizedUrl}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2D7773] hover:bg-[#256360] rounded-md transition-colors"
                >
                  Sanitize URL (Strip Auth Parameters)
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenDemoScenario('malicious-url')}
                className="px-3 py-1.5 text-xs font-semibold text-[#111827] bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] rounded-md transition-colors"
              >
                Inspect Safe Phishing Demo
              </button>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Preset Example Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[#697386] mr-1">Presets:</span>
            {PRESET_EXAMPLES[indicatorType].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setInputValue(preset.value);
                  setValidationError(null);
                }}
                className="px-2 py-1 text-[11px] font-mono rounded bg-[#F5F2EA] hover:bg-[#EBE7DC] text-[#111827] border border-[#D8DCE2] transition-colors"
                title={preset.desc}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Primary Investigation Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || Boolean(sensitiveAlert)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#111827] hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Investigating...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Investigate Evidence</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Missing API Key Guidance Banner (when not connected) */}
        {!hasApiKey && (
          <div className="mt-4 p-3 rounded-lg bg-[#F5F2EA] border border-[#D8DCE2] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#697386]">
              <Info className="w-4 h-4 text-[#D5A64A] shrink-0" />
              <span>
                VirusTotal API key not yet connected. Live queries will prompt connection or you can use complete{' '}
                <strong className="text-[#111827]">Demo Mode</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSecretModal}
              className="text-[#2D7773] hover:underline font-semibold whitespace-nowrap"
            >
              Setup Guide
            </button>
          </div>
        )}
      </form>

      {/* Mandatory Privacy & Dataset Consent Modal */}
      {showConsentModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-xs"
        >
          <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#2D7773]/10 text-[#2D7773] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Privacy & Threat Dataset Notice
                </h3>
                <p className="text-xs text-[#697386] mt-0.5">
                  VirusTotal Community Policy & Data Disclosure Warning
                </p>
              </div>
            </div>

            <div className="text-xs text-[#697386] space-y-2 bg-[#F5F2EA] p-3.5 rounded-lg border border-[#D8DCE2] leading-relaxed">
              <p className="font-semibold text-[#111827]">
                Live investigations send the selected indicator to VirusTotal.
              </p>
              <p>
                Queried or submitted indicators may be processed and added to the service's global
                dataset under its policies, accessible to security researchers and subscribers.
              </p>
              <p className="text-[#C94C4C] font-semibold">
                Do not submit private links, confidential infrastructure, authentication tokens,
                password-reset links, or private file hashes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConsentModal(false);
                  setPendingSubmit(false);
                }}
                className="px-4 py-2 text-xs font-medium text-[#697386] hover:text-[#111827] rounded-lg transition-colors"
              >
                Cancel Query
              </button>
              <button
                type="button"
                onClick={handleConfirmConsent}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2D7773] hover:bg-[#256360] rounded-lg shadow-xs transition-colors"
              >
                I Understand & Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
