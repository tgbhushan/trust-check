/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCode,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  Info,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileQuestion,
  HelpCircle,
  Hash,
} from 'lucide-react';
import {
  isSupportedFileType,
  validateFileSize,
  formatFileSize,
  detectDoubleExtensionRisk,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../utils/fileSecurity.ts';
import type { UnifiedReport } from '../types/index.ts';
import { ResultsDashboard } from './ResultsDashboard.tsx';
import { DEMO_SCENARIOS } from '../data/demoScenarios.ts';

interface FileCheckerProps {
  onInvestigateHash: (hash: string) => Promise<UnifiedReport | null>;
  isLoading: boolean;
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Preset test files for safe evaluation
const PRESET_FILE_SAMPLES = [
  {
    name: 'Trojan.Stealer.exe',
    size: 2457600,
    hash: '2c2446132bb3522f741b7c06d3b8e23807768323860f4178ab0f31e33ccfe2a8',
    type: 'Known InfoStealer Sample',
    desc: 'Simulated RedLine/Racoon credential-stealing executable binary',
  },
  {
    name: 'clean_receipt.pdf',
    size: 348160,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    type: 'Uncataloged File (Zero Detections)',
    desc: 'Clean benchmark payload showing the meaning of zero detections',
  },
  {
    name: 'urgent_invoice.pdf.exe',
    size: 1048576,
    hash: '8f3e5b1d9c2a4f6e8b0d1c3a5e7f9a2b4c6e8d0f1a3b5c7e9f0a2b4c6e8d0f1a',
    type: 'Double-Extension Masquerade Trap',
    desc: 'Demonstrates deceptive extension obfuscation (.pdf.exe)',
  },
];

export const FileChecker: React.FC<FileCheckerProps> = ({ onInvestigateHash, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [fileSha256, setFileSha256] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [doubleExtensionWarning, setDoubleExtensionWarning] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [report, setReport] = useState<UnifiedReport | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setSelectedFile(null);
    setFileSha256(null);
    setIsHashing(false);
    setDoubleExtensionWarning(null);
    setValidationError(null);
    setReport(null);
    setServiceError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setValidationError(null);
    setServiceError(null);
    setReport(null);

    // 1. Validate file format
    if (!isSupportedFileType(file.name)) {
      setValidationError(
        `Unsupported file extension "${file.name.slice(file.name.lastIndexOf('.')) || 'none'}". Supported types include: ${SUPPORTED_FILE_TYPES.map((t) => t.extension).join(', ')}.`
      );
      return;
    }

    // 2. Validate file size
    const sizeCheck = validateFileSize(file.size);
    if (!sizeCheck.valid) {
      setValidationError(sizeCheck.error || 'File exceeds safe size limits.');
      return;
    }

    // 3. Check for double extension masquerade risk
    const masqueradeCheck = detectDoubleExtensionRisk(file.name);
    if (masqueradeCheck.hasRisk) {
      setDoubleExtensionWarning(masqueradeCheck.warning || 'Potential deceptive file disguise detected.');
    } else {
      setDoubleExtensionWarning(null);
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    });

    // 4. Calculate SHA-256 locally in browser sandbox via Web Crypto API
    setIsHashing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hex = bufferToHex(hashBuffer);
      setFileSha256(hex);
    } catch {
      setValidationError('Failed to compute cryptographic hash locally. Please try again.');
    } finally {
      setIsHashing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLookup = async () => {
    if (!fileSha256) return;
    if (!hasConsented) {
      setValidationError('Please confirm consent before querying public threat intelligence databases.');
      return;
    }

    setValidationError(null);
    setServiceError(null);

    try {
      const res = await onInvestigateHash(fileSha256);
      if (res) {
        setReport(res);
      } else {
        setServiceError(
          'Service Unavailable: VirusTotal API is unconfigured on the server or public quota was exceeded. You can review verified simulated evidence or configure an API key in the Owner console.'
        );
      }
    } catch (err: any) {
      setServiceError(err?.message || 'Error occurred while contacting investigation service.');
    }
  };

  const handleSelectSample = (sample: typeof PRESET_FILE_SAMPLES[0]) => {
    setSelectedFile({
      name: sample.name,
      size: sample.size,
      type: 'sample/binary',
    });
    setFileSha256(sample.hash);
    setValidationError(null);
    setServiceError(null);
    setReport(null);

    const masqueradeCheck = detectDoubleExtensionRisk(sample.name);
    setDoubleExtensionWarning(masqueradeCheck.hasRisk ? masqueradeCheck.warning || null : null);
  };

  const handleLoadSampleReport = () => {
    const sample = DEMO_SCENARIOS.find((s) => s.indicatorType === 'file');
    if (sample) {
      setReport(sample.report);
      setServiceError(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#2D7773] uppercase">
            <ShieldCheck className="w-4 h-4 text-[#2D7773]" />
            <span>Cryptographic File Investigation Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            Safe Local File Analysis & Hash Lookup
          </h2>
          <p className="text-sm text-[#697386] leading-relaxed">
            Upload files for safe, sandboxed inspection. Your browser computes a cryptographic SHA-256 fingerprint locally on your device. Only the hash is matched against threat intelligence databases—the actual file is <strong>never executed</strong> and its contents are <strong>never uploaded</strong>.
          </p>
        </div>

        {/* Privacy Safeguards Pill Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[#D8DCE2] text-xs">
          <div className="flex items-start gap-2.5 p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
            <Lock className="w-4 h-4 text-[#2D7773] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#111827] block">Local SHA-256 Digest</span>
              <span className="text-[#697386] text-[11px] leading-tight block mt-0.5">
                Calculated strictly in your browser memory via Web Crypto API.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
            <Eye className="w-4 h-4 text-[#D5A64A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#111827] block">Zero File Execution</span>
              <span className="text-[#697386] text-[11px] leading-tight block mt-0.5">
                Files are never opened, run, or executed on any machine.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2]">
            <ShieldAlert className="w-4 h-4 text-[#C94C4C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#111827] block">Consent-Gated Lookup</span>
              <span className="text-[#697386] text-[11px] leading-tight block mt-0.5">
                Threat-intelligence query requires your explicit confirmation.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Upload / Hash Workspace */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#111827]">
            Select or Drop a File to Analyze
          </h3>
          {selectedFile && (
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 text-xs text-[#697386] hover:text-[#111827] font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Selection</span>
            </button>
          )}
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#D8DCE2] hover:border-[#2D7773] bg-[#F5F2EA]/50 hover:bg-[#F5F2EA] rounded-2xl p-8 text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".exe,.dll,.msi,.pdf,.docx,.xlsx,.zip,.rar,.7z,.apk,.js,.vbs,.bat,.iso,.dmg"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#D8DCE2] group-hover:border-[#2D7773] flex items-center justify-center text-[#2D7773] shadow-xs mb-4 transition-colors">
            <Upload className="w-7 h-7" />
          </div>

          <p className="text-base font-bold text-[#111827]">
            Drag & drop your file here, or <span className="text-[#2D7773] underline">browse files</span>
          </p>

          <p className="text-xs text-[#697386] mt-2 max-w-lg mx-auto">
            Supported file formats: Windows Executables (.exe, .dll, .msi), Documents (.pdf, .docx, .xlsx), Archives (.zip, .rar, .7z), Scripts (.js, .vbs, .bat), Disk Images (.iso, .dmg), Android (.apk).
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#D8DCE2] rounded-full text-[11px] font-mono text-[#697386]">
            <span>Maximum size: 25 MB</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">100% Private Local Digest</span>
          </div>
        </div>

        {/* Safe Sample Files */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono font-bold text-[#697386] uppercase tracking-wider block">
            Or test with verified research samples:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_FILE_SAMPLES.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="text-left p-3 rounded-lg border border-[#D8DCE2] bg-[#F5F2EA] hover:bg-[#EBE7DC] transition-colors group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-xs text-[#111827] truncate">
                    {sample.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#697386] shrink-0">
                    {formatFileSize(sample.size)}
                  </span>
                </div>
                <span className="text-[11px] text-[#2D7773] font-semibold block truncate">
                  {sample.type}
                </span>
                <span className="text-[10px] text-[#697386] block mt-1 line-clamp-1">
                  {sample.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-900">
            <AlertTriangle className="w-4 h-4 text-[#C94C4C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Validation Warning</span>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Double Extension Masquerade Alert */}
        {doubleExtensionWarning && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-amber-900 mb-1">
                Deceptive File Extension Warning
              </span>
              <p className="leading-relaxed">{doubleExtensionWarning}</p>
              <p className="mt-2 text-[11px] text-amber-800">
                Threat actors often name malicious software like <code>invoice.pdf.exe</code> knowing that Windows default settings hide the final <code>.exe</code> extension.
              </p>
            </div>
          </div>
        )}

        {/* Selected File Details & Calculated Hash */}
        {selectedFile && (
          <div className="p-5 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D8DCE2]">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-[#2D7773]" />
                <div>
                  <span className="font-bold text-sm text-[#111827] block font-mono">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-[#697386]">
                    Size: {formatFileSize(selectedFile.size)} · Type: {selectedFile.type}
                  </span>
                </div>
              </div>

              {isHashing ? (
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#D5A64A]">
                  <span className="w-2 h-2 rounded-full bg-[#D5A64A] animate-ping" />
                  <span>Computing SHA-256...</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-mono font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Digest Computed</span>
                </div>
              )}
            </div>

            {/* SHA-256 Display */}
            {fileSha256 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#697386] flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#2D7773]" />
                    <span>Cryptographic SHA-256 Fingerprint:</span>
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(fileSha256)}
                    className="text-[11px] font-mono text-[#2D7773] hover:underline"
                  >
                    Copy Hash
                  </button>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#D8DCE2] font-mono text-xs text-[#111827] break-all select-all">
                  {fileSha256}
                </div>
              </div>
            )}

            {/* Informed Consent Checkbox */}
            <div className="p-4 bg-white rounded-lg border border-[#D8DCE2] space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-0.5 rounded border-[#D8DCE2] text-[#2D7773] focus:ring-[#2D7773]"
                />
                <div className="text-xs text-[#111827] leading-relaxed">
                  <span className="font-bold block">
                    Informed Threat Intelligence Query Consent
                  </span>
                  <span>
                    I confirm that I want to query public threat intelligence databases using this file's <strong>SHA-256 hash only</strong>. I understand that only the 64-character hash is sent to the security service, while the file contents remain strictly local on my machine.
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleLookup}
                disabled={isLoading || isHashing || !fileSha256}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Checking VirusTotal Hash Database...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#D5A64A]" />
                    <span>Query Threat Intelligence for Hash</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLoadSampleReport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[#FFFFFF] hover:bg-[#F5F2EA] border border-[#D8DCE2] text-[#111827] font-semibold text-xs rounded-xl transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D5A64A]" />
                <span>View Sample Malware Telemetry Report</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Unavailable or Quota Notice */}
      {serviceError && (
        <div className="p-6 bg-[#FFFFFF] border border-amber-300 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#111827]">
                Live Threat Intelligence Service Notice
              </h4>
              <p className="text-xs text-[#697386] leading-relaxed">
                {serviceError}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[#D8DCE2]">
            <button
              onClick={handleLoadSampleReport}
              className="px-4 py-2 bg-[#111827] text-white rounded-lg text-xs font-semibold hover:bg-[#2D7773] transition-colors"
            >
              Explore Verified Trojan.Stealer Demonstration Report
            </button>
          </div>
        </div>
      )}

      {/* Hash Lookup vs Actual File Scan Educational Disclosure */}
      <div className="bg-[#111827] text-white rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D5A64A] uppercase">
          <Info className="w-4 h-4" />
          <span>Security Architecture & Methodology Note</span>
        </div>
        <h3 className="text-lg font-bold">
          Hash Lookup vs. File Scan: What Do These Results Mean?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">
              1. What this tool does (Cryptographic Hash Query)
            </h4>
            <p>
              When you drop a file, TRUST//CHECK calculates its exact mathematical fingerprint (SHA-256) inside your browser. It asks threat-intelligence repositories: <em>"Has any antivirus engine seen this exact hash before?"</em>
            </p>
            <p>
              If a match exists, you see historic detections without uploading your private document or executable.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">
              2. The limitations (Why zero detections is not proof of safety)
            </h4>
            <p>
              If an attacker changes a single byte or recompiles source code, the SHA-256 hash completely changes. A novel or customized attack will return <strong>"No Detections Reported"</strong> because security vendors haven't cataloged that specific binary yet.
            </p>
            <p className="text-amber-300 font-medium">
              Never execute suspicious files simply because a hash lookup returns zero detections.
            </p>
          </div>
        </div>
      </div>

      {/* Results Report Section */}
      {report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">
              Threat Intelligence Evidence Report
            </h3>
            <span className="text-xs font-mono text-[#697386]">
              {report.is_live ? 'Live Threat Intelligence' : 'Interactive Demonstration'}
            </span>
          </div>

          <ResultsDashboard
            report={report}
            onReset={resetAll}
          />
        </div>
      )}
    </div>
  );
};
