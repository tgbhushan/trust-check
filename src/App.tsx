/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, MainNavTab } from './components/Header.tsx';
import { GuidedInvestigation } from './components/GuidedInvestigation.tsx';
import { EvidenceTool } from './components/EvidenceTool.tsx';
import { FileChecker } from './components/FileChecker.tsx';
import { ScamEducation } from './components/ScamEducation.tsx';
import { AboutView } from './components/AboutView.tsx';
import { OwnerControlCenter } from './components/OwnerControlCenter.tsx';
import { SessionHistoryDrawer } from './components/SessionHistoryDrawer.tsx';
import { DEMO_SCENARIOS } from './data/demoScenarios.ts';
import { Shield, Lock, ExternalLink } from 'lucide-react';
import { apiUrl, isStaticHostingWithoutBackend } from './utils/api.ts';
import { validateReportTarget } from './utils/indicators.ts';
import type {
  UnifiedReport,
  IndicatorType,
  InvestigationMode,
  HistoryEntry,
  InvestigationResult,
} from './types/index.ts';

function isOwnerRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    path === '/owner' ||
    path.startsWith('/owner/') ||
    path.endsWith('/owner') ||
    path.endsWith('/owner/') ||
    hash === '#owner' ||
    hash.includes('owner') ||
    params.get('role') === 'owner' ||
    params.get('view') === 'owner'
  );
}

export default function App() {
  const [isOwnerView, setIsOwnerView] = useState<boolean>(isOwnerRoute);
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  const [activeReport, setActiveReport] = useState<UnifiedReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Send anonymous visitor session heartbeat for operator telemetry
  useEffect(() => {
    if (isOwnerView) return;
    const sendHeartbeat = async () => {
      try {
        let sessionId = localStorage.getItem('trustcheck_visitor_id');
        if (!sessionId) {
          sessionId = `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          localStorage.setItem('trustcheck_visitor_id', sessionId);
        }
        await fetch(apiUrl('/api/session/heartbeat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // Silently tolerate
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [isOwnerView]);

  // Synchronize route changes
  useEffect(() => {
    const handlePopState = () => {
      setIsOwnerView(isOwnerRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateToOwner = () => {
    setIsOwnerView(true);
    try {
      window.history.pushState(null, '', '#owner');
    } catch {
      // Fallback
    }
  };

  const navigateToPublicSite = (tab: MainNavTab = 'home') => {
    setIsOwnerView(false);
    setActiveTab(tab);
    try {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // Fallback
    }
  };

  // Live investigation handler (called from Website Checker)
  const handleInvestigateLive = async (
    indicator: string,
    type: IndicatorType,
    mode: InvestigationMode
  ): Promise<InvestigationResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/investigate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicator,
          indicatorType: type,
          mode,
          userConsented: true,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.report) {
        const report = data.report;
        const targetValidation = validateReportTarget(indicator, report.indicator, type);
        if (!targetValidation.valid) {
          return {
            status: 409,
            message: targetValidation.reason || 'Received report did not match active investigation target.',
          };
        }
        const newEntry: HistoryEntry = {
          id: `hist-${Date.now()}`,
          indicator: report.raw_indicator_masked,
          indicator_type: report.indicator_type,
          assessment: report.assessment,
          timestamp: report.timestamp,
          is_live: true,
          is_simulated: false,
          stats: report.stats,
        };
        setHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
        return { report, dnsEvidence: data.report?.dns_evidence, safeBrowsingEvidence: data.report?.safe_browsing_evidence };
      }

      if (data.notFound) {
        return {
          notFound: true,
          canSubmitScan: data.canSubmitScan,
          indicator: data.indicator || indicator,
          indicatorType: type,
          message: data.message || 'No existing report was found. The safety of this website could not be determined.',
          dnsEvidence: data.dnsEvidence,
          safeBrowsingEvidence: data.safeBrowsingEvidence,
        };
      }

      let failureMessage = data.message || `Query failed with status ${response.status}.`;
      if (response.status === 404 && isStaticHostingWithoutBackend()) {
        failureMessage =
          'Static GitHub Pages Deployment: Live server-side VirusTotal & Google Safe Browsing API feeds require an active backend server (secret keys cannot be embedded in static client bundles). All client-side forensic tools (URL analysis, SHA-256 integrity calculator, verified demonstration telemetry, and educational scam labs) are fully operational.';
      }

      return {
        status: response.status,
        message: failureMessage,
        dnsEvidence: data.dnsEvidence,
        safeBrowsingEvidence: data.safeBrowsingEvidence,
      };
    } catch {
      const isStatic = isStaticHostingWithoutBackend();
      return {
        status: 503,
        message: isStatic
          ? 'Static GitHub Pages Deployment: Live server-side threat intelligence lookups require a backend server. Configure VITE_API_URL or run the full-stack server on Render/Railway. You can explore verified sample threat telemetry and client-side analysis below.'
          : 'Could not contact backend investigation service.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // URL scanning handler (called from Website Checker when submitting unindexed URL)
  const handleScanUrlLive = async (
    url: string,
    userConsented: boolean
  ): Promise<{ report?: UnifiedReport; queued?: boolean; message?: string; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/scan-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, userConsented }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.report) {
        const report = data.report;
        const newEntry: HistoryEntry = {
          id: `hist-${Date.now()}`,
          indicator: report.raw_indicator_masked,
          indicator_type: report.indicator_type,
          assessment: report.assessment,
          timestamp: report.timestamp,
          is_live: true,
          is_simulated: false,
          stats: report.stats,
        };
        setHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
        setActiveReport(report);
        return { report, message: data.message };
      }
      return data;
    } catch {
      return { error: 'Could not connect to URL scanning service.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Hash investigation handler (called from File Checker)
  const handleInvestigateHash = async (hash: string): Promise<UnifiedReport | null> => {
    const res = await handleInvestigateLive(hash, 'file', 'standard');
    return res.report || null;
  };

  // History selection
  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    const demoMatch = DEMO_SCENARIOS.find((s) => s.report.raw_indicator_masked === entry.indicator);
    if (demoMatch) {
      setActiveReport(demoMatch.report);
      setActiveTab('website-checker');
    }
  };

  // ---------------------------------------------------------------------------
  // ROUTE A: PRIVATE OWNER AREA (/owner)
  // ---------------------------------------------------------------------------
  if (isOwnerView) {
    return <OwnerControlCenter onBackToSite={() => navigateToPublicSite('home')} />;
  }

  // ---------------------------------------------------------------------------
  // ROUTE B: PUBLIC WEBSITE
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2EA] text-[#111827]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onGoToOwner={navigateToOwner}
        historyCount={history.length}
      />

      {/* Main Public Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'home' && (
          <GuidedInvestigation
            onGoToWebsiteChecker={() => setActiveTab('website-checker')}
            onGoToFileChecker={() => setActiveTab('file-checker')}
            onGoToScamEducation={() => setActiveTab('learn-scams')}
          />
        )}

        {activeTab === 'website-checker' && (
          <EvidenceTool
            onInvestigateLive={handleInvestigateLive}
            onScanUrlLive={handleScanUrlLive}
            activeReport={activeReport}
            setActiveReport={setActiveReport}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'file-checker' && (
          <FileChecker
            onInvestigateHash={handleInvestigateHash}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'learn-scams' && <ScamEducation />}

        {activeTab === 'about' && <AboutView />}
      </main>

      {/* Modest Footer */}
      <footer className="border-t border-[#D8DCE2] bg-[#FFFFFF] py-6 text-xs text-[#697386]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-[#111827]">TRUST//CHECK</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>Created by Bhushan Kumar | Class 10th A | Academic Session 2026–2027</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('website-checker')}
              className="hover:text-[#111827] transition-colors"
            >
              Website Checker
            </button>
            <button
              onClick={() => setActiveTab('file-checker')}
              className="hover:text-[#111827] transition-colors"
            >
              File Checker
            </button>
            <button
              onClick={() => setActiveTab('learn-scams')}
              className="hover:text-[#111827] transition-colors"
            >
              Learn About Scams
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-[#111827] transition-colors"
            >
              About & Ethics
            </button>

            {/* Subtle Operator Console Link */}
            <button
              onClick={navigateToOwner}
              className="inline-flex items-center gap-1 text-[#697386] hover:text-[#111827] font-mono text-[11px] ml-2"
              title="Private Owner Control Center"
            >
              <Lock className="w-3 h-3 text-[#D5A64A]" />
              <span>Owner</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Session History Drawer */}
      <SessionHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
        onSelectHistoryEntry={handleSelectHistoryEntry}
      />
    </div>
  );
}
