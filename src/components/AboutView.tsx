/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  AlertTriangle,
  Fingerprint,
  ArrowRight,
  Eye,
  FileCheck,
  Search,
  ExternalLink,
} from 'lucide-react';

const PRINCIPLES = [
  { number: '01', title: 'Evidence before conclusions', desc: 'Display actual detection data and engine verdicts rather than simplified conclusions.' },
  { number: '02', title: 'Privacy before convenience', desc: 'Require explicit consent prior to external indicator disclosure; block sensitive URLs containing tokens.' },
  { number: '03', title: 'Real evidence before deceptive polish', desc: 'Never confuse clean visual design with safety. Digital thieves can clone modern interfaces in minutes.' },
  { number: '04', title: 'Transparency about uncertainty', desc: 'Clearly state that zero detections does NOT prove an item is safe, and that unindexed links return inconclusive 404s.' },
  { number: '05', title: 'Security controls implemented in code', desc: 'Rate limiting, RFC 1918 private IP blocking, credential stripping, and secret isolation are executed in code.' },
  { number: '06', title: 'Accessible explanations with technical rigor', desc: 'Translate complex telemetry into plain English without diluting engineering accuracy.' },
  { number: '07', title: 'No arbitrary safety percentages', desc: 'Prohibit fabricated scores like "98% Safe". Detection counts are forensic observations, not probabilities.' },
  { number: '08', title: 'No hidden submissions of user indicators', desc: 'Never transmit indicators in background pre-fetches; new active scans require separate explicit consent.' },
  { number: '09', title: 'Protection of user authentication credentials', desc: 'Sensitive reset tokens and auth cookies must be stripped before submitting URLs to public databases.' },
  { number: '10', title: 'No false claims about capability or deployment', desc: 'Distinguish between simulated and live telemetry; state exact quota and verification boundaries.' },
];

export const AboutView: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-12 max-w-4xl mx-auto text-[#111827]"
    >
      {/* 1. EDITORIAL HEADER & THESIS */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8DCE2]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C94C4C]" />
            <span className="text-xs font-mono font-bold text-[#2D7773] uppercase tracking-wider">
              INVESTIGATIVE BRIEF · ESSAY ON DIGITAL LEGITIMACY
            </span>
          </div>
          <span className="text-xs font-mono text-[#697386]">
            SESSION 2026–2027
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827] leading-tight">
            Looks real. Doesn't mean trustworthy.
          </h1>

          <p className="text-base sm:text-lg text-[#697386] leading-relaxed max-w-3xl">
            In modern cybersecurity, interface fidelity has been severed from server integrity. An attacker can clone an enterprise design system, register an ambiguous lookalike domain, and provision an automated 256-bit TLS certificate in under two minutes. Visual polish is zero proof of safety.
          </p>

          <p className="text-sm text-[#111827] leading-relaxed max-w-3xl">
            <strong>TRUST//CHECK</strong> was engineered as an independent digital investigation workspace to teach digital literacy, privacy rights, and forensic verification. Instead of asking users to blindly trust green padlocks or fabricated "safety scores," it deconstructs suspicious targets into observable evidence streams.
          </p>
        </div>
      </div>

      {/* 2. ORIGINAL TECHNICAL PIPELINE SVG/CSS ILLUSTRATION */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase font-bold text-[#2D7773] block mb-1">
              THE INVESTIGATION ARCHITECTURE
            </span>
            <h2 className="text-lg font-bold text-[#111827]">
              From Surface Appearance to Forensic Evidence
            </h2>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-[#697386] bg-[#F5F2EA] px-2.5 py-1 rounded border border-[#D8DCE2]">
            Tri-Source Pipeline
          </span>
        </div>

        {/* Technical Flow SVG Diagram */}
        <div className="p-4 sm:p-6 bg-[#111827] text-white rounded-xl border border-[#D8DCE2]/20 overflow-x-auto">
          <div className="min-w-[620px] py-2">
            <div className="grid grid-cols-3 gap-6 relative">
              {/* Connector Lines (SVG Background) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
                aria-hidden="true"
              >
                <line
                  x1="30%"
                  y1="50%"
                  x2="38%"
                  y2="50%"
                  stroke="#D5A64A"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <line
                  x1="62%"
                  y1="50%"
                  x2="70%"
                  y2="50%"
                  stroke="#2D7773"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Node 1: Surface Appearance */}
              <div className="relative z-10 bg-[#1e293b] border border-slate-700 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D5A64A] font-bold">01 // TARGET</span>
                  <Eye className="w-3.5 h-3.5 text-[#D5A64A]" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Surface Layer
                </h3>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Incoming link or file. Padlock, logos, and urgent countdowns designed to engineer trust.
                </p>
                <div className="pt-2 text-[10px] font-mono text-amber-300">
                  Status: Unverified Facade
                </div>
              </div>

              {/* Node 2: Deconstruction & Safeguards */}
              <div className="relative z-10 bg-[#1e293b] border border-slate-700 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#2D7773] font-bold">02 // SCRUB</span>
                  <Search className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Deconstruction
                </h3>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Private tokens stripped, RFC 1918 IPs blocked, and SHA-256 computed client-side.
                </p>
                <div className="pt-2 text-[10px] font-mono text-teal-300">
                  Status: Privacy Protected
                </div>
              </div>

              {/* Node 3: Independent Evidence Streams */}
              <div className="relative z-10 bg-[#1e293b] border border-slate-700 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">03 // PROOF</span>
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Evidence Streams
                </h3>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Google Public DNS (DoH) + Google Safe Browsing + 70+ VirusTotal vendor engines.
                </p>
                <div className="pt-2 text-[10px] font-mono text-emerald-300">
                  Status: Forensic Verdict
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. VISUAL CONTRAST: SUPERFICIAL SIGNALS VS VERIFIABLE EVIDENCE */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-[11px] font-mono uppercase font-bold text-[#C94C4C] block mb-1">
            THE DECEPTION GAP
          </span>
          <h2 className="text-lg font-bold text-[#111827]">
            Superficial Trust Signals vs. Verifiable Technical Evidence
          </h2>
          <p className="text-xs text-[#697386] mt-1">
            Why looking for "trust indicators" fails against modern adversarial engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Superficial Signals */}
          <div className="bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#D8DCE2]">
              <ShieldAlert className="w-4 h-4 text-[#C94C4C]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C94C4C]">
                Superficial Signals (Easily Fabricated)
              </h3>
            </div>

            <ul className="space-y-3 text-xs leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#C94C4C] shrink-0 mt-0.5">✕</span>
                <div>
                  <strong className="text-[#111827] block">The Browser Padlock:</strong>
                  <span className="text-[#697386]">
                    Indicates only that traffic in transit is encrypted with TLS. Attackers get free certificates in 60 seconds with Let's Encrypt.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#C94C4C] shrink-0 mt-0.5">✕</span>
                <div>
                  <strong className="text-[#111827] block">Cloned Enterprise Layouts:</strong>
                  <span className="text-[#697386]">
                    Tailwind CSS, SVG vector logos, and responsive grids can be scraped and redeployed verbatim within minutes.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#C94C4C] shrink-0 mt-0.5">✕</span>
                <div>
                  <strong className="text-[#111827] block">Manufactured Urgency:</strong>
                  <span className="text-[#697386]">
                    "Account suspended in 10 minutes" alerts are psychological exploits intended to bypass rational inspection.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#C94C4C] shrink-0 mt-0.5">✕</span>
                <div>
                  <strong className="text-[#111827] block">Subdomain Misdirection:</strong>
                  <span className="text-[#697386]">
                    Names like <code className="bg-white px-1 py-0.5 rounded border border-[#D8DCE2]">bank.com-verify.xyz</code> disguise the authoritative root domain on mobile screens.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Right: Verifiable Technical Evidence */}
          <div className="bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#D8DCE2]">
              <ShieldCheck className="w-4 h-4 text-[#2D7773]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D7773]">
                Verifiable Evidence (Forensic Proof)
              </h3>
            </div>

            <ul className="space-y-3 text-xs leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#2D7773] shrink-0 mt-0.5">✓</span>
                <div>
                  <strong className="text-[#111827] block">Authoritative DNS Resolution:</strong>
                  <span className="text-[#697386]">
                    Google Public DNS (DoH) determines whether a domain actually exists (NOERROR) or is non-existent (NXDOMAIN).
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#2D7773] shrink-0 mt-0.5">✓</span>
                <div>
                  <strong className="text-[#111827] block">Multi-Vendor Threat Telemetry:</strong>
                  <span className="text-[#697386]">
                    VirusTotal v3 and Google Safe Browsing aggregate verdicts from 70+ security vendors, exposing known threat actors.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#2D7773] shrink-0 mt-0.5">✓</span>
                <div>
                  <strong className="text-[#111827] block">Unindexed Provenance (Honest 404s):</strong>
                  <span className="text-[#697386]">
                    A 404 indicates an uncataloged URL—never that the website does not exist. Absence of detections is not evidence of safety.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#2D7773] shrink-0 mt-0.5">✓</span>
                <div>
                  <strong className="text-[#111827] block">Cryptographic Hash Fingerprints:</strong>
                  <span className="text-[#697386]">
                    SHA-256 hashes computed via Web Crypto API uniquely identify files without transmitting binary data to external servers.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. THE 10 PRINCIPLES OF DIGITAL EVIDENCE */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase font-bold text-[#2D7773] block mb-1">
              THE CONSTITUTION OF INQUIRY
            </span>
            <h2 className="text-lg font-bold text-[#111827]">
              The 10 Principles of Digital Evidence & Online Trust
            </h2>
          </div>
          <span className="text-xs font-mono text-[#697386]">
            Strict Code Execution
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map((p) => (
            <div
              key={p.number}
              className="p-3.5 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#2D7773]">
                  {p.number}
                </span>
                <span className="text-xs font-bold text-[#111827]">
                  {p.title}
                </span>
              </div>
              <p className="text-xs text-[#697386] leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. COMPACT PROJECT CREDIT & EXHIBITION FOOTER */}
      <div className="p-6 bg-[#FFFFFF] rounded-xl border border-[#D8DCE2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#697386]">
        <div className="space-y-1">
          <div className="font-bold text-[#111827] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2D7773]" />
            <span>TRUST//CHECK · Independent Investigation Workspace</span>
          </div>
          <p className="text-[11px]">
            Conceived and engineered by <strong>Bhushan Kumar</strong>, Class 10th A (Session 2026–2027) for the <em>Technology, Privacy & Digital Rights Exhibition</em>.
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right text-[11px] font-semibold text-[#2D7773]">
          “Investigate the evidence. Question the trust.”
        </div>
      </div>
    </motion.div>
  );
};
