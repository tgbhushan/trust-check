/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import type { ApiStatus } from '../types/index.ts';

interface SecretSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: ApiStatus | null;
  onRefreshStatus: () => Promise<void>;
  onTestLiveQuery: () => Promise<void>;
  isTesting: boolean;
}

export const SecretSetupModal: React.FC<SecretSetupModalProps> = ({
  isOpen,
  onClose,
  apiStatus,
  onRefreshStatus,
  onTestLiveQuery,
  isTesting,
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTestResult(null);
    try {
      await onTestLiveQuery();
      setTestResult('Success: Live VirusTotal API connection verified.');
    } catch (err: any) {
      setTestResult(err.message || 'Test query failed.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/70 backdrop-blur-xs"
    >
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#D8DCE2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#111827] text-[#D5A64A] flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                VirusTotal API v3 Secret Configuration
              </h3>
              <p className="text-xs text-[#697386]">
                Secure Server-Side Credential Setup for Google AI Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#697386] hover:text-[#111827]"
            aria-label="Close setup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Box */}
        <div className="p-4 rounded-lg bg-[#F5F2EA] border border-[#D8DCE2] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111827]">Connection Status:</span>
            {apiStatus?.hasApiKey ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D7773]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configured & Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D5A64A]">
                <AlertCircle className="w-4 h-4" />
                <span>Awaiting Secret Configuration</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#697386] font-mono flex items-center justify-between">
            <span>Rate Limit Quota:</span>
            <span>
              {apiStatus?.rateLimit.requestsThisMinute ?? 0} / {apiStatus?.rateLimit.maxPerMinute ?? 4} req/min
            </span>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 text-xs text-[#111827]">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#697386]">
            Configuration Steps:
          </h4>
          <ol className="list-decimal pl-4 space-y-2 leading-relaxed text-[#697386]">
            <li>
              Log into{' '}
              <a
                href="https://www.virustotal.com/gui/join-us"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2D7773] hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                <span>VirusTotal</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and copy your personal API key from your profile page (free tier provides 4 req/min, 500 req/day).
            </li>
            <li>
              In Google AI Studio, open the top header / settings menu and click on{' '}
              <strong className="text-[#111827]">Secrets</strong>.
            </li>
            <li>
              Create a new secret with the exact name:{' '}
              <code className="text-[#111827] bg-[#F5F2EA] px-1.5 py-0.5 rounded border border-[#D8DCE2] font-mono font-bold">
                VIRUSTOTAL_API_KEY
              </code>
            </li>
            <li>Paste your key and save. Google AI Studio injects it into the server environment automatically.</li>
            <li>
              <em>Never paste your key into the chat or commit it to code repositories.</em>
            </li>
          </ol>
        </div>

        {/* Live Test Status & Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              testResult.includes('Success')
                ? 'bg-[#2D7773]/10 text-[#2D7773] border border-[#2D7773]/30'
                : 'bg-[#C94C4C]/10 text-[#C94C4C] border border-[#C94C4C]/30'
            }`}
          >
            {testResult}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D8DCE2]">
          <button
            type="button"
            onClick={onRefreshStatus}
            className="inline-flex items-center gap-1.5 text-xs text-[#697386] hover:text-[#111827] font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Environment Again</span>
          </button>

          <div className="flex items-center gap-2">
            {apiStatus?.hasApiKey && (
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2D7773] hover:bg-[#256360] rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Run Live Verification Query</span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1E293B] rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
