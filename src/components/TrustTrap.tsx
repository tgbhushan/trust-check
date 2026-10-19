/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TrustTrapProps {
  onStartInvestigation?: () => void;
}

type InspectionLens = 'visual' | 'domain' | 'ssl' | 'evidence';

export const TrustTrap: React.FC<TrustTrapProps> = ({ onStartInvestigation }) => {
  const [activeLens, setActiveLens] = useState<InspectionLens>('visual');
  const [selectedGuess, setSelectedGuess] = useState<'siteA' | 'siteB' | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleGuess = (choice: 'siteA' | 'siteB') => {
    setSelectedGuess(choice);
    setRevealed(true);
  };

  const resetTrap = () => {
    setSelectedGuess(null);
    setRevealed(false);
    setActiveLens('visual');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Exhibit Header */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#D5A64A]/10 border border-[#D5A64A]/30 text-xs font-mono font-bold text-[#D5A64A] mb-2 uppercase">
              <span>[COMPETITION EXHIBIT · THE TRUST TRAP]</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Looks identical. Which one is the trap?
            </h2>
            <p className="text-xs sm:text-sm text-[#697386] mt-2 max-w-2xl leading-relaxed">
              Two digital banking portals. Both use modern typography, valid SSL padlocks, reassuring copy, and crisp branding. Inspect the clues and test your judgment.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {revealed && (
              <button
                type="button"
                onClick={resetTrap}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#111827] bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Exhibit</span>
              </button>
            )}
          </div>
        </div>

        {/* Inspection Lens Selector */}
        <div className="mt-6 pt-6 border-t border-[#D8DCE2] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">
            Inspection Lens:
          </span>
          <div className="inline-flex p-1 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] text-xs">
            <button
              type="button"
              onClick={() => setActiveLens('visual')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLens === 'visual'
                  ? 'bg-[#111827] text-white shadow-xs font-semibold'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              1. Visual Surface
            </button>
            <button
              type="button"
              onClick={() => setActiveLens('domain')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLens === 'domain'
                  ? 'bg-[#111827] text-white shadow-xs font-semibold'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              2. Domain Anatomy
            </button>
            <button
              type="button"
              onClick={() => setActiveLens('ssl')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLens === 'ssl'
                  ? 'bg-[#111827] text-white shadow-xs font-semibold'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              3. Padlock & SSL Reality
            </button>
            <button
              type="button"
              onClick={() => setActiveLens('evidence')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeLens === 'evidence'
                  ? 'bg-[#2D7773] text-white shadow-xs font-semibold'
                  : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              4. Security Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Website Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SITE A (Legitimate) */}
        <div
          className={`bg-[#FFFFFF] border rounded-xl overflow-hidden transition-all shadow-xs ${
            revealed && selectedGuess
              ? 'border-[#2D7773] ring-2 ring-[#2D7773]/30'
              : 'border-[#D8DCE2]'
          }`}
        >
          {/* Mock Browser Header */}
          <div className="bg-[#111827] px-4 py-3 border-b border-[#111827] flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C94C4C]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D5A64A]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D7773]" />
            </div>
            <div className="flex-1 bg-[#1E293B] rounded px-3 py-1 flex items-center gap-1.5 text-xs font-mono text-[#F5F2EA] truncate">
              <Lock className="w-3 h-3 text-[#2D7773] shrink-0" />
              <span className="truncate">https://www.valleymetro-creditunion.org/login</span>
            </div>
            <span className="text-[10px] font-mono text-[#D8DCE2] uppercase">Site A</span>
          </div>

          {/* Website Canvas */}
          <div className="p-6 bg-[#FAFAF8] space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8DCE2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#111827] text-white flex items-center justify-center font-bold text-xs font-mono">
                  VM
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#111827]">Valley Metro Credit Union</h4>
                  <span className="text-[10px] text-[#697386]">Community Financial Co-operative</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#2D7773] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>FDIC / NCUA Insured</span>
              </span>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-bold text-[#111827]">Member Sign In</h5>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-medium text-[#697386] block mb-1">
                    Username / Member ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value="j.doe@example.org"
                    className="w-full h-8 px-2.5 rounded border border-[#D8DCE2] bg-white text-xs font-mono text-[#111827]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#697386] block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    disabled
                    value="••••••••••••"
                    className="w-full h-8 px-2.5 rounded border border-[#D8DCE2] bg-white text-xs font-mono text-[#111827]"
                  />
                </div>
                <div className="pt-1">
                  <div className="w-full h-8 bg-[#111827] text-white rounded text-xs font-semibold flex items-center justify-center">
                    Access My Accounts
                  </div>
                </div>
              </div>
            </div>

            {/* Lens Findings for Site A */}
            <div className="p-3.5 bg-white rounded-lg border border-[#D8DCE2] text-xs font-mono space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#697386] block">
                Lens Analysis · Site A
              </span>
              {activeLens === 'visual' && (
                <p className="text-[#111827] text-[11px] leading-relaxed">
                  Clean editorial typography, standard corporate structure, official insured disclaimer, no emotional pressure.
                </p>
              )}
              {activeLens === 'domain' && (
                <p className="text-[#111827] text-[11px] leading-relaxed">
                  Registrable domain: <strong className="text-[#2D7773]">valleymetro-creditunion.org</strong>. Standard organizational top-level domain. Registered in 2004 (22 years of history).
                </p>
              )}
              {activeLens === 'ssl' && (
                <p className="text-[#111827] text-[11px] leading-relaxed">
                  SSL Status: <strong className="text-[#2D7773]">Valid RSA 2048-bit Certificate</strong>. Issued to Valley Metro Credit Union Inc.
                </p>
              )}
              {activeLens === 'evidence' && (
                <p className="text-[#2D7773] text-[11px] leading-relaxed font-bold">
                  VirusTotal Telemetry: 0 / 92 Engines Reported Malicious. Autonomous System: AS16509 (Amazon AWS Official Host).
                </p>
              )}
            </div>

            {/* Voting Button */}
            {!revealed && (
              <button
                type="button"
                onClick={() => handleGuess('siteA')}
                className="w-full py-2.5 text-xs font-bold text-[#111827] bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] rounded-lg transition-colors"
              >
                "I Think Site A Is The Trap"
              </button>
            )}

            {revealed && (
              <div className="p-3 rounded-lg bg-[#2D7773]/10 border border-[#2D7773]/30 text-xs text-[#2D7773] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="block font-bold">GENUINE WEBSITE</strong>
                  <span>This is the authentic domain with 22 years of legitimate operation.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SITE B (The Phishing Trap) */}
        <div
          className={`bg-[#FFFFFF] border rounded-xl overflow-hidden transition-all shadow-xs ${
            revealed && selectedGuess
              ? 'border-[#C94C4C] ring-2 ring-[#C94C4C]/30'
              : 'border-[#D8DCE2]'
          }`}
        >
          {/* Mock Browser Header */}
          <div className="bg-[#111827] px-4 py-3 border-b border-[#111827] flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C94C4C]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D5A64A]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D7773]" />
            </div>
            <div className="flex-1 bg-[#1E293B] rounded px-3 py-1 flex items-center gap-1.5 text-xs font-mono text-[#F5F2EA] truncate">
              <Lock className="w-3 h-3 text-[#2D7773] shrink-0" />
              <span className="truncate">https://valleymetro-creditun1on.secure-auth-portal.org/login</span>
            </div>
            <span className="text-[10px] font-mono text-[#D8DCE2] uppercase">Site B</span>
          </div>

          {/* Website Canvas */}
          <div className="p-6 bg-[#FAFAF8] space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8DCE2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#111827] text-white flex items-center justify-center font-bold text-xs font-mono">
                  VM
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#111827]">Valley Metro Credit Union</h4>
                  <span className="text-[10px] text-[#697386]">Community Financial Co-operative</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#2D7773] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>FDIC / NCUA Insured</span>
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-[#111827]">Member Sign In</h5>
                <span className="text-[10px] font-mono text-[#C94C4C] font-semibold bg-[#C94C4C]/10 px-1.5 py-0.5 rounded">
                  Session Expires in 04:59
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-medium text-[#697386] block mb-1">
                    Username / Member ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value="j.doe@example.org"
                    className="w-full h-8 px-2.5 rounded border border-[#D8DCE2] bg-white text-xs font-mono text-[#111827]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#697386] block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    disabled
                    value="••••••••••••"
                    className="w-full h-8 px-2.5 rounded border border-[#D8DCE2] bg-white text-xs font-mono text-[#111827]"
                  />
                </div>
                <div className="pt-1">
                  <div className="w-full h-8 bg-[#111827] text-white rounded text-xs font-semibold flex items-center justify-center">
                    Access My Accounts
                  </div>
                </div>
              </div>
            </div>

            {/* Lens Findings for Site B */}
            <div className="p-3.5 bg-white rounded-lg border border-[#D8DCE2] text-xs font-mono space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#697386] block">
                Lens Analysis · Site B
              </span>
              {activeLens === 'visual' && (
                <p className="text-[#111827] text-[11px] leading-relaxed">
                  Identical logo, identical fonts, same reassuring badge. However, notice the artificial countdown urgency: "Session expires in 04:59".
                </p>
              )}
              {activeLens === 'domain' && (
                <p className="text-[#C94C4C] text-[11px] leading-relaxed font-semibold">
                  TRAP: Notice the typosquatting (<code className="text-[#C94C4C] font-bold">creditun1on</code> with '1' instead of 'i') AND the true domain is <strong className="text-[#C94C4C]">secure-auth-portal.org</strong>!
                </p>
              )}
              {activeLens === 'ssl' && (
                <p className="text-[#111827] text-[11px] leading-relaxed">
                  SSL Status: <strong className="text-[#2D7773]">Valid Free Let's Encrypt Certificate</strong>. The padlock is 100% green and active! Proves the wire is encrypted, NOT the owner's honesty.
                </p>
              )}
              {activeLens === 'evidence' && (
                <p className="text-[#C94C4C] text-[11px] leading-relaxed font-bold">
                  VirusTotal Telemetry: 17 Security Vendors Classify As Phishing / Credential Harvester.
                </p>
              )}
            </div>

            {/* Voting Button */}
            {!revealed && (
              <button
                type="button"
                onClick={() => handleGuess('siteB')}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#C94C4C] hover:bg-[#B53E3E] rounded-lg transition-colors shadow-xs"
              >
                "I Think Site B Is The Trap"
              </button>
            )}

            {revealed && (
              <div className="p-3 rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/30 text-xs text-[#C94C4C] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="block font-bold">THE MALICIOUS TRAP IDENTIFIED</strong>
                  <span>A typosquatted credential harvester registered 3 days ago.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The Big Reveal / Competition Takeaway */}
      {revealed && (
        <div className="p-6 sm:p-8 rounded-xl bg-[#111827] text-[#F5F2EA] space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D5A64A] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>The 60-Second Competition Takeaway</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {selectedGuess === 'siteB'
              ? 'Correct! You spotted the subtle digital deception.'
              : 'Fooled by appearance? You are in good company.'}
          </h3>

          <p className="text-xs sm:text-sm text-[#D8DCE2] leading-relaxed max-w-3xl">
            Site B possessed a valid HTTPS padlock, high-resolution logos, and crisp responsive styling. Anyone can clone a website's visual frontend in under 5 minutes and generate a free SSL certificate automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-[#1E293B] border border-[#D8DCE2]/20 space-y-1">
              <span className="text-[#D5A64A] font-bold block">1. The Padlock Myth</span>
              <span className="text-[#D8DCE2] text-[11px]">
                The padlock only proves encryption in transit—it does not prove the website owner is honest.
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#1E293B] border border-[#D8DCE2]/20 space-y-1">
              <span className="text-[#D5A64A] font-bold block">2. Subdomain Confusion</span>
              <span className="text-[#D8DCE2] text-[11px]">
                The domain directly before the single slash <code className="text-white">/</code> is the real authority, not words in the subdomain.
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#1E293B] border border-[#D8DCE2]/20 space-y-1">
              <span className="text-[#D5A64A] font-bold block">3. Digital Evidence</span>
              <span className="text-[#D8DCE2] text-[11px]">
                Threat intelligence telemetry and WHOIS age beat visual design every single time.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
