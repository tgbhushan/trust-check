/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Eye,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Lightbulb,
} from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/demoScenarios.ts';
import { ResultsDashboard } from './ResultsDashboard.tsx';
import type { InvestigationClue, UnifiedReport } from '../types/index.ts';

interface GuidedInvestigationProps {
  onGoToWebsiteChecker: () => void;
  onGoToFileChecker: () => void;
  onGoToScamEducation: () => void;
}

const INITIAL_CLUES: InvestigationClue[] = [
  {
    id: 'clue-domain',
    label: 'Clue 1: Subdomain Hierarchy Trap',
    location: 'Address Bar',
    description:
      'The address begins with "apexbank-verification", but the actual registrable domain before the slash is "customer-portal-session99.org".',
    whyItMatters:
      'Anyone can purchase any domain and add subdomains like "paypal.com.attacker.org" to deceive people who only read the left side of the address.',
    isDiscovered: false,
  },
  {
    id: 'clue-urgency',
    label: 'Clue 2: Manufactured Urgency & Panic',
    location: 'Notice Banner',
    description:
      'A flashing warning states: "Your account will be permanently terminated in 08:32 minutes unless you verify your password right now."',
    whyItMatters:
      'Urgency suppresses critical thinking. Legitimate institutions do not delete bank accounts on 8-minute countdown timers.',
    isDiscovered: false,
  },
  {
    id: 'clue-padlock',
    label: 'Clue 3: The Padlock Illusion',
    location: 'HTTPS Lock Icon',
    description:
      'The browser shows a valid green lock and "https://", but the certificate was issued anonymously via a free automated authority 48 hours ago.',
    whyItMatters:
      'Encryption simply means the connection cannot be read by someone else on your Wi-Fi. It does not certify that the recipient is honest.',
    isDiscovered: false,
  },
  {
    id: 'clue-login',
    label: 'Clue 4: Unsolicited Credential Demand',
    location: 'Sign-In Form',
    description:
      'The prompt asks for full online banking password AND social security number / date of birth simultaneously on an unverified link.',
    whyItMatters:
      'Phishing pages attempt to harvest all authentication and identity factors in a single visit.',
    isDiscovered: false,
  },
];

export const GuidedInvestigation: React.FC<GuidedInvestigationProps> = ({
  onGoToWebsiteChecker,
  onGoToFileChecker,
  onGoToScamEducation,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [clues, setClues] = useState<InvestigationClue[]>(INITIAL_CLUES);
  const [activeClueDetail, setActiveClueDetail] = useState<InvestigationClue | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  const discoveredCount = clues.filter((c) => c.isDiscovered).length;

  const handleDiscoverClue = (id: string) => {
    setClues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isDiscovered: true } : c))
    );
    const found = clues.find((c) => c.id === id);
    if (found) setActiveClueDetail(found);
  };

  const simulationReport: UnifiedReport = DEMO_SCENARIOS[0].report;

  return (
    <div className="space-y-12">
      {/* 1. HERO SECTION & CENTRAL INTERACTIVE ELEMENT */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111827] text-[#F5F2EA] text-[11px] font-mono tracking-wider uppercase font-semibold">
            <span>AN INDEPENDENT DIGITAL INVESTIGATION PROJECT</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
            Would you trust a website just because it{' '}
            <span className="text-[#2D7773] underline decoration-[#D5A64A] decoration-2 underline-offset-4">
              looks trustworthy
            </span>
            ?
          </h1>
          <p className="text-sm sm:text-base text-[#697386] max-w-2xl mx-auto leading-relaxed">
            Investigate the clues. Challenge the appearance. Understand the evidence.
          </p>

          {/* Visual Sequence: Appearance -> Evidence -> Decision */}
          <div className="pt-2 flex items-center justify-center gap-2 sm:gap-4 text-xs font-mono font-bold">
            <span className="px-2.5 py-1 rounded bg-[#F5F2EA] border border-[#D8DCE2] text-[#111827]">
              01 APPEARANCE
            </span>
            <span className="text-[#697386]">→</span>
            <span className="px-2.5 py-1 rounded bg-[#2D7773]/10 border border-[#2D7773]/30 text-[#2D7773]">
              02 EVIDENCE
            </span>
            <span className="text-[#697386]">→</span>
            <span className="px-2.5 py-1 rounded bg-[#D5A64A]/10 border border-[#D5A64A]/30 text-[#111827]">
              03 DECISION
            </span>
          </div>
        </div>

        {/* Mock Browser Window Exhibit */}
        <div className="bg-[#FFFFFF] border-2 border-[#D8DCE2] rounded-2xl overflow-hidden shadow-md max-w-4xl mx-auto">
          {/* Browser Chrome Header */}
          <div className="bg-[#111827] px-4 py-3 border-b border-[#111827] flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C94C4C]" />
              <span className="w-3 h-3 rounded-full bg-[#D5A64A]" />
              <span className="w-3 h-3 rounded-full bg-[#2D7773]" />
            </div>
            {/* Interactive Address Bar */}
            <div
              onClick={() => handleDiscoverClue('clue-domain')}
              className="flex-1 bg-[#1E293B] hover:bg-[#253248] cursor-pointer transition-colors rounded-md px-3 py-1.5 flex items-center justify-between text-xs font-mono text-[#F5F2EA] group"
              title="Click to inspect this address"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDiscoverClue('clue-padlock');
                  }}
                  className="hover:scale-110 transition-transform p-0.5 rounded hover:bg-white/10"
                  title="Click padlock to inspect SSL certificate"
                >
                  <Lock className="w-3.5 h-3.5 text-[#2D7773] shrink-0" />
                </span>
                <span className="truncate">
                  https://apexbank-verification.
                  <strong className="text-[#D5A64A] underline decoration-dotted">
                    customer-portal-session99.org
                  </strong>
                  /auth/login
                </span>
              </div>
              <span className="text-[10px] text-[#D5A64A] font-sans font-semibold group-hover:underline">
                [Inspect URL]
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#D8DCE2] uppercase hidden sm:inline">
              EXHIBIT #A-42
            </span>
          </div>

          {/* Browser Page Body */}
          <div className="p-6 sm:p-8 bg-[#FAFAF8] space-y-6">
            {/* Urgent Warning Banner */}
            <div
              onClick={() => handleDiscoverClue('clue-urgency')}
              className="p-3.5 rounded-lg bg-[#C94C4C]/10 border border-[#C94C4C]/30 text-xs text-[#C94C4C] flex items-center justify-between cursor-pointer hover:bg-[#C94C4C]/15 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">
                  URGENT SECURITY NOTICE: Your session will expire in 08:32. Re-verify your credentials immediately.
                </span>
              </div>
              <span className="text-[11px] font-bold underline font-mono shrink-0 ml-2">
                [Inspect Urgency]
              </span>
            </div>

            {/* Portal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#111827] text-white flex items-center justify-center font-bold font-mono text-sm">
                  AB
                </div>
                <h3 className="text-xl font-bold text-[#111827] tracking-tight">
                  Apex National Financial
                </h3>
                <p className="text-xs text-[#697386] leading-relaxed">
                  Welcome to the Customer Identity Verification Gateway. To maintain access to your personal checking and savings accounts, please authenticate below.
                </p>
                <div className="pt-2 flex items-center gap-3 text-[11px] text-[#697386] font-mono">
                  <span className="flex items-center gap-1 text-[#2D7773]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>256-Bit SSL Encrypted</span>
                  </span>
                  <span>·</span>
                  <span>Federal Deposit Member</span>
                </div>
              </div>

              {/* Phishing Login Box */}
              <div
                onClick={() => handleDiscoverClue('clue-login')}
                className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-3 shadow-xs hover:border-[#D5A64A] cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">Secure Login</span>
                  <span className="text-[10px] text-[#D5A64A] font-mono font-semibold group-hover:underline">
                    [Inspect Form]
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-[#697386] block mb-1">
                      Account Username / SSN
                    </label>
                    <input
                      type="text"
                      disabled
                      value="john.doe@example.com"
                      className="w-full h-8 px-2.5 rounded border border-[#D8DCE2] text-xs font-mono bg-[#FAFAF8]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#697386] block mb-1">
                      Online Banking Password
                    </label>
                    <input
                      type="password"
                      disabled
                      value="••••••••••••"
                      className="w-full h-8 px-2.5 rounded border border-[#D8DCE2] text-xs font-mono bg-[#FAFAF8]"
                    />
                  </div>
                  <div className="w-full h-8 bg-[#111827] text-white rounded text-xs font-semibold flex items-center justify-center mt-2">
                    Verify & Unlock Account
                  </div>
                </div>
              </div>
            </div>

            {/* Clue Discovery Progress Bar inside the Browser */}
            <div className="p-3 bg-white rounded-lg border border-[#D8DCE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#2D7773]" />
                <span className="font-semibold text-[#111827]">
                  Investigation Clues Found: {discoveredCount} of {clues.length}
                </span>
                <span className="text-[#697386]">
                  (Click elements in the browser window above to uncover clues)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {clues.map((c) => (
                  <span
                    key={c.id}
                    className={`w-2.5 h-2.5 rounded-full ${
                      c.isDiscovered ? 'bg-[#2D7773]' : 'bg-[#D8DCE2]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Actions beneath Browser */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onGoToWebsiteChecker}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#111827] hover:bg-[#1E293B] rounded-xl shadow-xs transition-colors"
          >
            <span>CHECK A WEBSITE / URL</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onGoToFileChecker}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#111827] bg-[#FFFFFF] hover:bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#D5A64A]" />
            <span>CHECK A FILE SAFELY</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-[#2D7773] hover:underline"
          >
            <span>Inspect Guided Clues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. THE 5-STEP GUIDED CASE JOURNEY */}
      <section className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
        {/* Step Navigation Bar */}
        <div className="border-b border-[#D8DCE2] pb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#2D7773] uppercase tracking-wider block">
              Case File #2026-A42 · Step-by-Step Inquiry
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
              Guided Case Investigation
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStep(s)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                  activeStep === s
                    ? 'bg-[#111827] text-white shadow-xs'
                    : s < activeStep
                    ? 'bg-[#2D7773]/15 text-[#2D7773]'
                    : 'bg-[#F5F2EA] text-[#697386] hover:bg-[#EBE7DC]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: THE WEBSITE */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#697386] uppercase">
                STEP 1: THE WEBSITE · INITIAL OBSERVATION
              </span>
              <h3 className="text-2xl font-bold text-[#111827]">
                First impressions are engineered to deceive.
              </h3>
              <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-2xl">
                When you click an unexpected link from an SMS, email, or social post, what do you look at first? Most visitors notice colors, logos, and the padlock icon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-2">
                <span className="font-bold text-[#111827] block">1. The URL Inspection</span>
                <p className="text-[#697386] leading-relaxed">
                  Notice that the address looks like <code className="text-[#111827]">apexbank-verification...</code>, but contains a foreign domain in the root position.
                </p>
              </div>
              <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-2">
                <span className="font-bold text-[#111827] block">2. The Padlock Symbol</span>
                <p className="text-[#697386] leading-relaxed">
                  The green lock means traffic is encrypted, but provides zero guarantee regarding the entity operating the server.
                </p>
              </div>
              <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-2">
                <span className="font-bold text-[#111827] block">3. The Login Request</span>
                <p className="text-[#697386] leading-relaxed">
                  The page demands your password and private details directly upon landing, bypassing normal navigation.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <span>Continue to Step 2: Find the Clues</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIND THE CLUES */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#697386] uppercase">
                STEP 2: FIND THE CLUES · FORENSIC ANATOMY
              </span>
              <h3 className="text-2xl font-bold text-[#111827]">
                Uncover the warning signs hidden in plain sight.
              </h3>
              <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-2xl">
                Click each clue card to inspect why individual signals are important warning signs, but remember: no single clue is absolute proof on its own.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clues.map((clue) => (
                <div
                  key={clue.id}
                  onClick={() => handleDiscoverClue(clue.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    clue.isDiscovered
                      ? 'border-[#2D7773] bg-[#2D7773]/5'
                      : 'border-[#D8DCE2] bg-[#F5F2EA]/40 hover:bg-[#F5F2EA]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#697386]">
                      {clue.location}
                    </span>
                    {clue.isDiscovered ? (
                      <span className="text-[10px] font-mono text-[#2D7773] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>UNCOVERED</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#D5A64A] font-bold">
                        CLICK TO REVEAL
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#111827]">{clue.label}</h4>
                  <p className="text-xs text-[#697386] leading-relaxed">
                    {clue.description}
                  </p>
                  <div className="pt-2 border-t border-[#D8DCE2]/60 text-[11px] text-[#111827]">
                    <strong className="text-[#2D7773]">Why it matters: </strong>
                    {clue.whyItMatters}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 text-xs font-semibold text-[#697386] hover:text-[#111827]"
              >
                ← Back to Step 1
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <span>Continue to Step 3: Check the Evidence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHECK THE EVIDENCE */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#697386] uppercase">
                STEP 3: CHECK THE EVIDENCE · THREAT INTELLIGENCE
              </span>
              <h3 className="text-2xl font-bold text-[#111827]">
                What does independent digital telemetry say?
              </h3>
              <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-2xl">
                Beyond visual speculation, we query global security databases to see whether specialized antivirus and threat vendors have cataloged this indicator.
              </p>
            </div>

            {/* Embedded Evidence Report */}
            <ResultsDashboard report={simulationReport} />

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 text-xs font-semibold text-[#697386] hover:text-[#111827]"
              >
                ← Back to Step 2
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <span>Continue to Step 4: Make a Decision</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MAKE A DECISION */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#697386] uppercase">
                STEP 4: MAKE A DECISION · WHAT WOULD YOU DO?
              </span>
              <h3 className="text-2xl font-bold text-[#111827]">
                You have examined the clues and evidence. What is your call?
              </h3>
              <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-2xl">
                Choose the action you would take if you received this link in your personal inbox:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setSelectedDecision('proceed')}
                className={`p-5 rounded-xl border text-left transition-all space-y-2 ${
                  selectedDecision === 'proceed'
                    ? 'border-[#C94C4C] bg-[#C94C4C]/5 ring-2 ring-[#C94C4C]'
                    : 'border-[#D8DCE2] bg-[#F5F2EA]/40 hover:bg-[#F5F2EA]'
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#C94C4C] block uppercase">
                  Choice A
                </span>
                <h4 className="text-sm font-bold text-[#111827]">Proceed Carefully</h4>
                <p className="text-xs text-[#697386] leading-relaxed">
                  Log in since you have anti-virus software running on your computer.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDecision('verify')}
                className={`p-5 rounded-xl border text-left transition-all space-y-2 ${
                  selectedDecision === 'verify'
                    ? 'border-[#2D7773] bg-[#2D7773]/5 ring-2 ring-[#2D7773]'
                    : 'border-[#D8DCE2] bg-[#F5F2EA]/40 hover:bg-[#F5F2EA]'
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#2D7773] block uppercase">
                  Choice B (Recommended)
                </span>
                <h4 className="text-sm font-bold text-[#111827]">Verify Independently</h4>
                <p className="text-xs text-[#697386] leading-relaxed">
                  Close the tab. Open your banking app directly or call customer support on the back of your card.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDecision('leave')}
                className={`p-5 rounded-xl border text-left transition-all space-y-2 ${
                  selectedDecision === 'leave'
                    ? 'border-[#111827] bg-[#111827]/5 ring-2 ring-[#111827]'
                    : 'border-[#D8DCE2] bg-[#F5F2EA]/40 hover:bg-[#F5F2EA]'
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#111827] block uppercase">
                  Choice C
                </span>
                <h4 className="text-sm font-bold text-[#111827]">Leave Immediately</h4>
                <p className="text-xs text-[#697386] leading-relaxed">
                  Close the browser tab and report the sender address as junk.
                </p>
              </button>
            </div>

            {/* Decision Feedback */}
            {selectedDecision && (
              <div className="p-5 rounded-xl bg-[#F5F2EA] border border-[#D8DCE2] space-y-2 text-xs leading-relaxed text-[#111827]">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#2D7773]" />
                  <span className="font-bold text-sm">
                    {selectedDecision === 'verify'
                      ? 'Exceptional choice: Out-of-band verification is the gold standard.'
                      : selectedDecision === 'leave'
                      ? 'Safe instinct: When in doubt, stepping away prevents harm.'
                      : 'High risk: Antivirus software cannot prevent you from typing your password into an attacker’s form.'}
                  </span>
                </div>
                <p className="text-[#697386]">
                  {selectedDecision === 'proceed'
                    ? 'Even with antivirus or modern browsers, credential harvesting works because the victim voluntarily types their password into an attacker-controlled database. The computer is not "infected"—the credentials are simply given away.'
                    : 'By navigating to your institution independently via a known bookmarked app or telephone number, you break the attack chain completely. Attackers rely on keeping you inside their controlled channel.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 text-xs font-semibold text-[#697386] hover:text-[#111827]"
              >
                ← Back to Step 3
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#111827] hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <span>Continue to Step 5: The Bigger Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: THE BIGGER QUESTION */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#2D7773] uppercase">
                STEP 5: THE BIGGER QUESTION · PRIVACY & DIGITAL RIGHTS
              </span>
              <h3 className="text-2xl font-bold text-[#111827]">
                Why automated trust is a privacy issue.
              </h3>
              <p className="text-xs sm:text-sm text-[#697386] leading-relaxed max-w-2xl">
                Beyond avoiding phishing, this project explores how people evaluate truth online and why commercial scanning tools can create new privacy hazards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-2">
                <span className="font-bold text-[#111827] block">1. The Privacy Cost of Scanning</span>
                <p className="text-[#697386] leading-relaxed">
                  When users submit password-reset links, confidential documents, or unlisted meeting URLs to public threat scanners, those tokens are shared across public threat databases.
                </p>
              </div>
              <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-2">
                <span className="font-bold text-[#111827] block">2. The Flaw of "Safety Scores"</span>
                <p className="text-[#697386] leading-relaxed">
                  Commercial tools love to present "98% Safe" badges. But security is binary: an unknown zero-day phishing link will show 0 detections until the first victim is harmed.
                </p>
              </div>
            </div>

            <div className="p-6 bg-[#111827] text-white rounded-xl space-y-3">
              <h4 className="font-bold text-sm sm:text-base text-white">
                Final Investigation Takeaway
              </h4>
              <p className="text-xs sm:text-sm text-[#D8DCE2] leading-relaxed">
                "Looks real. But is it?" Online trust is an active, ongoing inquiry—not a badge to take for granted. Before you trust a link, investigate the evidence.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onGoToWebsiteChecker}
                  className="px-4 py-2 text-xs font-bold text-[#111827] bg-[#D5A64A] hover:bg-[#C99A3E] rounded-lg transition-colors"
                >
                  Inspect a Website in Website Checker →
                </button>
                <button
                  type="button"
                  onClick={onGoToFileChecker}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2D7773] hover:bg-[#25635F] rounded-lg transition-colors"
                >
                  Verify a Download in File Checker →
                </button>
                <button
                  type="button"
                  onClick={onGoToScamEducation}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E293B] hover:bg-[#253248] rounded-lg transition-colors"
                >
                  Learn Scam Tactics & Red Flags →
                </button>
              </div>
            </div>

            <div className="flex justify-start pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 text-xs font-semibold text-[#697386] hover:text-[#111827]"
              >
                ← Back to Step 4
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
