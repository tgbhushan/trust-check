/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Clock,
  Eye,
  Server,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Check,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import type { OwnerDiagnostics } from '../types/index.ts';
import { apiUrl } from '../utils/api.ts';

interface OwnerControlCenterProps {
  onBackToSite: () => void;
}

export const OwnerControlCenter: React.FC<OwnerControlCenterProps> = ({ onBackToSite }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Operator Data
  const [diagnostics, setDiagnostics] = useState<OwnerDiagnostics | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);

  // VirusTotal Key Configuration
  const [newApiKey, setNewApiKey] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [keyUpdateNotice, setKeyUpdateNotice] = useState<string | null>(null);

  // Testing VirusTotal Key
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);

  // Google Safe Browsing Key Configuration
  const [newSafeBrowsingKey, setNewSafeBrowsingKey] = useState('');
  const [isUpdatingSafeBrowsingKey, setIsUpdatingSafeBrowsingKey] = useState(false);
  const [safeBrowsingKeyNotice, setSafeBrowsingKeyNotice] = useState<string | null>(null);

  // Testing Google Safe Browsing Key
  const [isTestingSafeBrowsing, setIsTestingSafeBrowsing] = useState(false);
  const [safeBrowsingTestResult, setSafeBrowsingTestResult] = useState<any>(null);

  // PIN Change State
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeNotice, setPinChangeNotice] = useState<string | null>(null);

  // Active Tab in Owner Console
  const [activeTab, setActiveTab] = useState<'overview' | 'api-key' | 'safebrowsing' | 'health-errors' | 'security'>('overview');

  // Check existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch(apiUrl('/api/owner/status'));
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated);
          if (data.authenticated) {
            fetchDiagnostics();
          }
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Poll diagnostics periodically when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchDiagnostics, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    try {
      const res = await fetch(apiUrl('/api/owner/diagnostics'));
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
        if (data.lastApiTest) setApiTestResult(data.lastApiTest);
        if (data.lastSafeBrowsingTest) setSafeBrowsingTestResult(data.lastSafeBrowsingTest);
      }
    } catch {
      // Silently tolerate
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch(apiUrl('/api/owner/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPin('');
        setLockoutSeconds(null);
        fetchDiagnostics();
      } else {
        setAuthError(data.message || 'Authentication failed.');
        if (data.remainingSeconds) {
          setLockoutSeconds(data.remainingSeconds);
        }
      }
    } catch {
      setAuthError('Unable to connect to server authentication endpoint.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(apiUrl('/api/owner/logout'), { method: 'POST' });
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setDiagnostics(null);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingKey(true);
    setKeyUpdateNotice(null);
    try {
      const res = await fetch(apiUrl('/api/owner/api-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyUpdateNotice(data.message || 'API key updated.');
        setNewApiKey('');
        fetchDiagnostics();
      } else {
        setKeyUpdateNotice(`Error: ${data.message || 'Failed to update key.'}`);
      }
    } catch {
      setKeyUpdateNotice('Error communicating with server.');
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await fetch(apiUrl('/api/owner/test-api'), { method: 'POST' });
      const data = await res.json();
      setApiTestResult(data);
      fetchDiagnostics();
    } catch {
      setApiTestResult({
        status: 'failed',
        category: 'FETCH_ERROR',
        message: 'Could not contact backend test endpoint.',
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveSafeBrowsingKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSafeBrowsingKey(true);
    setSafeBrowsingKeyNotice(null);
    try {
      const res = await fetch(apiUrl('/api/owner/safebrowsing-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newSafeBrowsingKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSafeBrowsingKeyNotice(data.message || 'Google Safe Browsing key updated.');
        setNewSafeBrowsingKey('');
        fetchDiagnostics();
      } else {
        setSafeBrowsingKeyNotice(`Error: ${data.message || 'Failed to update key.'}`);
      }
    } catch {
      setSafeBrowsingKeyNotice('Error communicating with server.');
    } finally {
      setIsUpdatingSafeBrowsingKey(false);
    }
  };

  const handleTestSafeBrowsing = async () => {
    setIsTestingSafeBrowsing(true);
    setSafeBrowsingTestResult(null);
    try {
      const res = await fetch(apiUrl('/api/owner/test-safebrowsing'), { method: 'POST' });
      const data = await res.json();
      setSafeBrowsingTestResult(data);
      fetchDiagnostics();
    } catch {
      setSafeBrowsingTestResult({
        status: 'failed',
        message: 'Could not contact backend Safe Browsing test endpoint.',
      });
    } finally {
      setIsTestingSafeBrowsing(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      setPinChangeNotice('New PIN must be at least 4 digits.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/owner/setup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: currentPinInput,
          newPin: newPinInput,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPinChangeNotice('PIN successfully changed.');
        setCurrentPinInput('');
        setNewPinInput('');
        setIsChangingPin(false);
      } else {
        setPinChangeNotice(`Error: ${data.message || 'Failed to update PIN.'}`);
      }
    } catch {
      setPinChangeNotice('Could not connect to server.');
    }
  };

  // -------------------------------------------------------------------------
  // 1. LOGIN SCREEN (When Unauthenticated)
  // -------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex flex-col justify-center items-center p-4 text-[#111827]">
        <div className="max-w-md w-full bg-[#FFFFFF] border border-[#D8DCE2] rounded-2xl p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#111827] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-6 h-6 text-[#D5A64A]" />
            </div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2D7773] block">
              Website Operator Authentication
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              TRUST//CHECK Owner Console
            </h2>
            <p className="text-xs text-[#697386]">
              Private administration area for website maintenance, API key configuration, and system diagnostics.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#111827] mb-1.5">
                Owner PIN Code
              </label>
              <input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isLoggingIn || Boolean(lockoutSeconds)}
                className="w-full h-11 px-3.5 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#2D7773]"
                autoFocus
              />
              <span className="text-[10px] text-[#697386] font-mono block mt-1 text-center">
                Default competition session PIN: <strong>2026</strong>
              </span>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C94C4C] shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !pin.trim() || Boolean(lockoutSeconds)}
              className="w-full h-11 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Unlock Operator Console'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#D8DCE2] text-center">
            <button
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 text-xs text-[#697386] hover:text-[#111827] font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATED OWNER CONTROL CONSOLE
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F5F2EA] flex flex-col text-[#111827]">
      {/* Top Console Bar */}
      <header className="border-b border-[#D8DCE2] bg-[#FFFFFF] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center text-[#F5F2EA] shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#D5A64A]" />
              </div>
              <div>
                <span className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <span>TRUST//CHECK</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F5F2EA] rounded border border-[#D8DCE2] text-[#2D7773] font-semibold uppercase">
                    Operator Console
                  </span>
                </span>
                <span className="text-[10px] font-mono text-[#697386] block">
                  Private Administration & VirusTotal v3 Integration
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onBackToSite}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] rounded-lg text-xs font-semibold text-[#111827] transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#2D7773]" />
                <span>View Public Site</span>
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Console Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#D8DCE2] pb-3 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-[#697386] hover:text-[#111827] border border-[#D8DCE2]'
            }`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('api-key')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'api-key'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-[#697386] hover:text-[#111827] border border-[#D8DCE2]'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#D5A64A]" />
            <span>VirusTotal Integration</span>
          </button>
          <button
            onClick={() => setActiveTab('safebrowsing')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'safebrowsing'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-[#697386] hover:text-[#111827] border border-[#D8DCE2]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2D7773]" />
            <span>Google Safe Browsing & DNS</span>
          </button>
          <button
            onClick={() => setActiveTab('health-errors')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'health-errors'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-[#697386] hover:text-[#111827] border border-[#D8DCE2]'
            }`}
          >
            Sanitized Error Log ({diagnostics?.recentErrors?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'security'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-[#697386] hover:text-[#111827] border border-[#D8DCE2]'
            }`}
          >
            PIN & Session Security
          </button>
        </div>

        {/* ----------------- TAB 1: OVERVIEW & TELEMETRY ----------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#697386] flex items-center justify-between">
                  <span>Server Status</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <span className="text-xl font-bold text-[#111827] block font-mono">
                  {diagnostics?.serverStatus === 'healthy' ? 'Operational' : 'Attention Needed'}
                </span>
                <span className="text-[11px] text-[#697386] block">
                  Uptime: {Math.floor((diagnostics?.uptimeSeconds || 0) / 60)}m · Active: {diagnostics?.activeVisitorCount || 1}
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#697386]">
                  VirusTotal Key
                </span>
                <span className="text-xl font-bold block font-mono">
                  {diagnostics?.hasApiKey ? (
                    <span className="text-emerald-700">Configured</span>
                  ) : (
                    <span className="text-amber-700">Unconfigured</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-[#697386] block truncate">
                  {diagnostics?.keyMasked || 'No active server key'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#697386]">
                  Google Safe Browsing
                </span>
                <span className="text-xl font-bold block font-mono">
                  {diagnostics?.hasSafeBrowsingKey ? (
                    <span className="text-emerald-700">Configured</span>
                  ) : (
                    <span className="text-amber-700">Unconfigured</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-[#697386] block truncate">
                  {diagnostics?.safeBrowsingKeyMasked || 'Optional server API key'}
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#697386]">
                  Google Public DNS (DoH)
                </span>
                <span className="text-xl font-bold block font-mono text-emerald-700">
                  Active (RFC 8484)
                </span>
                <span className="text-[11px] text-[#697386] block">
                  Zero credentials required · Resolves domains
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#697386]">
                  Rate Limit Quota
                </span>
                <span className="text-xl font-bold text-[#111827] block font-mono">
                  {diagnostics?.requestsThisMinute || 0} / 4 req/min
                </span>
                <span className="text-[11px] text-[#697386] block">
                  Public tier rate limiter active
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#D8DCE2] space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#697386]">
                  Report Cache
                </span>
                <span className="text-xl font-bold text-[#111827] block font-mono">
                  {diagnostics?.cacheEntryCount || 0} cached
                </span>
                <span className="text-[11px] text-[#697386] block">
                  5-minute memory TTL
                </span>
              </div>
            </div>

            {/* Quick Actions & Live Test Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VT Test */}
              <div className="bg-white p-6 rounded-xl border border-[#D8DCE2] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">
                      VirusTotal API v3 Test
                    </h3>
                    <p className="text-[11px] text-[#697386] mt-0.5">
                      Harmless reference query (1.1.1.1).
                    </p>
                  </div>
                  <button
                    onClick={handleTestApi}
                    disabled={isTestingApi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white rounded-lg text-xs font-bold font-mono transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingApi ? 'animate-spin' : ''}`} />
                    <span>{isTestingApi ? 'Testing...' : 'Test VT'}</span>
                  </button>
                </div>
                {apiTestResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 font-mono ${
                      apiTestResult.status === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Status: {apiTestResult.status.toUpperCase()} ({apiTestResult.category})</span>
                      {apiTestResult.latencyMs !== undefined && (
                        <span>{apiTestResult.latencyMs}ms</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed">{apiTestResult.message}</p>
                  </div>
                )}
              </div>

              {/* Safe Browsing Test */}
              <div className="bg-white p-6 rounded-xl border border-[#D8DCE2] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">
                      Google Safe Browsing Test
                    </h3>
                    <p className="text-[11px] text-[#697386] mt-0.5">
                      Lookup API v4 threat match test.
                    </p>
                  </div>
                  <button
                    onClick={handleTestSafeBrowsing}
                    disabled={isTestingSafeBrowsing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white rounded-lg text-xs font-bold font-mono transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingSafeBrowsing ? 'animate-spin' : ''}`} />
                    <span>{isTestingSafeBrowsing ? 'Testing...' : 'Test GSB'}</span>
                  </button>
                </div>
                {safeBrowsingTestResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 font-mono ${
                      safeBrowsingTestResult.status === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Status: {safeBrowsingTestResult.status.toUpperCase()}</span>
                      {safeBrowsingTestResult.latencyMs !== undefined && (
                        <span>{safeBrowsingTestResult.latencyMs}ms</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed">{safeBrowsingTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: VIRUSTOTAL API CONFIGURATION ----------------- */}
        {activeTab === 'api-key' && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#D8DCE2] space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#111827]">
                Configure VirusTotal API v3 Credentials
              </h3>
              <p className="text-xs text-[#697386] mt-1 leading-relaxed max-w-2xl">
                Enter your free or enterprise VirusTotal API key. Keys are maintained strictly server-side in runtime memory and are <strong>never sent to the visitor's browser</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#111827] mb-1.5">
                  VirusTotal API Key (64 characters hex)
                </label>
                <input
                  type="password"
                  placeholder="Paste VirusTotal API key"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2D7773]"
                />
              </div>

              {keyUpdateNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-mono">
                  {keyUpdateNotice}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isUpdatingKey || !newApiKey.trim()}
                  className="px-5 py-2.5 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow-xs"
                >
                  {isUpdatingKey ? 'Saving Key...' : 'Update Server API Key'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewApiKey('');
                    handleSaveApiKey({ preventDefault: () => {} } as any);
                  }}
                  className="px-4 py-2.5 bg-white border border-[#D8DCE2] text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  Clear Key
                </button>
              </div>
            </form>

            <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] text-xs text-[#697386] space-y-2 max-w-xl">
              <span className="font-bold text-[#111827] block font-mono">
                How to obtain a free VirusTotal API key:
              </span>
              <ol className="list-decimal list-inside space-y-1">
                <li>Create a free community account at virustotal.com.</li>
                <li>Navigate to your user profile in the top-right menu.</li>
                <li>Click on "API Key" and copy the 64-character hexadecimal token.</li>
                <li>Paste it into the form above to activate live URL, domain, IP, and file lookups.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2B: GOOGLE SAFE BROWSING & DNS ----------------- */}
        {activeTab === 'safebrowsing' && (
          <div className="space-y-6">
            {/* Google Safe Browsing Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#D8DCE2] space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-[#2D7773]" />
                    <h3 className="text-lg font-bold text-[#111827]">
                      Google Safe Browsing Lookup API v4
                    </h3>
                  </div>
                  <p className="text-xs text-[#697386] leading-relaxed max-w-2xl">
                    Checks requested URLs against Google's constantly updated lists of unsafe web resources (Malware, Social Engineering / Phishing, Unwanted Software, and Harmful Applications).
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                      diagnostics?.hasSafeBrowsingKey
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {diagnostics?.hasSafeBrowsingKey ? 'KEY CONFIGURED' : 'KEY UNCONFIGURED'}
                  </span>
                  {diagnostics?.safeBrowsingKeyMasked && (
                    <span className="text-[10px] font-mono text-[#697386] block mt-1">
                      {diagnostics.safeBrowsingKeyMasked}
                    </span>
                  )}
                </div>
              </div>

              {/* API Key Form */}
              <form onSubmit={handleSaveSafeBrowsingKey} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[#111827] mb-1.5">
                    Google Cloud API Key (with Safe Browsing API enabled)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={newSafeBrowsingKey}
                    onChange={(e) => setNewSafeBrowsingKey(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2D7773]"
                  />
                </div>

                {safeBrowsingKeyNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-mono">
                    {safeBrowsingKeyNotice}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingSafeBrowsingKey || !newSafeBrowsingKey.trim()}
                    className="px-5 py-2.5 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow-xs"
                  >
                    {isUpdatingSafeBrowsingKey ? 'Saving Key...' : 'Save Safe Browsing Key'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSafeBrowsingKey('');
                      handleSaveSafeBrowsingKey({ preventDefault: () => {} } as any);
                    }}
                    className="px-4 py-2.5 bg-white border border-[#D8DCE2] text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Clear Key
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSafeBrowsing}
                    disabled={isTestingSafeBrowsing}
                    className="px-4 py-2.5 bg-[#F5F2EA] hover:bg-[#EBE7DC] border border-[#D8DCE2] text-[#111827] rounded-xl text-xs font-mono font-bold transition-colors ml-auto"
                  >
                    {isTestingSafeBrowsing ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </form>

              {safeBrowsingTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1 font-mono max-w-xl ${
                    safeBrowsingTestResult.status === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Result: {safeBrowsingTestResult.status.toUpperCase()}</span>
                    {safeBrowsingTestResult.latencyMs !== undefined && (
                      <span>Latency: {safeBrowsingTestResult.latencyMs}ms</span>
                    )}
                  </div>
                  <p className="leading-relaxed">{safeBrowsingTestResult.message}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="p-5 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] text-xs text-[#697386] space-y-3 max-w-2xl">
                <span className="font-bold text-[#111827] block font-mono">
                  How to obtain and configure a Google Safe Browsing API Key:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Visit <strong className="text-[#111827]">Google Cloud Console</strong> at <code className="px-1 py-0.5 bg-white rounded border border-[#D8DCE2]">console.cloud.google.com</code>.</li>
                  <li>Create a new Cloud Project or choose an existing one.</li>
                  <li>Open <strong className="text-[#111827]">APIs & Services → Library</strong> and search for <strong className="text-[#111827]">Safe Browsing API</strong> (Lookup API v4). Click <em>Enable</em>.</li>
                  <li>Navigate to <strong className="text-[#111827]">APIs & Services → Credentials</strong>, click <em>+ Create Credentials</em>, and select <em>API key</em>.</li>
                  <li>(Recommended) Edit the key to restrict API access specifically to the <em>Safe Browsing API</em>.</li>
                  <li>Paste the key into the input above and click <em>Save Safe Browsing Key</em>, or define <code className="px-1 py-0.5 bg-white rounded border border-[#D8DCE2]">GOOGLE_SAFE_BROWSING_API_KEY</code> in your server's <code className="px-1 py-0.5 bg-white rounded border border-[#D8DCE2]">.env</code> file.</li>
                </ol>
                <div className="pt-2 border-t border-[#D8DCE2] text-[11px]">
                  <strong>Quotas & Pricing:</strong> Google Safe Browsing Lookup API v4 is free for non-commercial projects and includes up to 10,000 queries per day without billing required.
                </div>
              </div>
            </div>

            {/* Google Public DNS over HTTPS Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#D8DCE2] space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#2D7773]" />
                <h3 className="text-lg font-bold text-[#111827]">
                  Google Public DNS over HTTPS (DoH)
                </h3>
              </div>
              <p className="text-xs text-[#697386] leading-relaxed max-w-2xl">
                TRUST//CHECK queries Google's official public DoH service (<code className="px-1 py-0.5 bg-[#F5F2EA] rounded border border-[#D8DCE2]">https://dns.google/resolve</code>) following RFC 8484 specifications to determine whether a queried domain exists and resolves.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#697386] block">Status</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono block">Active & Available</span>
                  <span className="text-[11px] text-[#697386]">Live DoH resolver</span>
                </div>
                <div className="p-3.5 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#697386] block">Credentials</span>
                  <span className="text-sm font-bold text-[#111827] font-mono block">Zero Required</span>
                  <span className="text-[11px] text-[#697386]">Open public resolver</span>
                </div>
                <div className="p-3.5 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#697386] block">RFC 8484 Codes</span>
                  <span className="text-sm font-bold text-[#111827] font-mono block">0 = NOERROR, 3 = NXDOMAIN</span>
                  <span className="text-[11px] text-[#697386]">Distinguishes non-existent domains</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: SANITIZED ERROR LOG ----------------- */}
        {activeTab === 'health-errors' && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#D8DCE2] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Sanitized Operational Error Log
                </h3>
                <p className="text-xs text-[#697386] mt-0.5">
                  Recent operational warnings and diagnostic events. Visitor IP addresses and full indicator query parameters are stripped for privacy.
                </p>
              </div>

              <button
                onClick={fetchDiagnostics}
                className="inline-flex items-center gap-1.5 text-xs text-[#2D7773] hover:underline font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            {diagnostics?.recentErrors && diagnostics.recentErrors.length > 0 ? (
              <div className="space-y-2 font-mono text-xs">
                {diagnostics.recentErrors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#111827] text-white rounded text-[10px] font-bold">
                        {err.category}
                      </span>
                      <span className="text-[#111827]">{err.message}</span>
                    </div>
                    <span className="text-[#697386] text-[11px] shrink-0">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] text-xs text-[#697386]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <span>No operational errors logged. All systems are operating smoothly.</span>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 4: PIN & SECURITY ----------------- */}
        {activeTab === 'security' && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#D8DCE2] space-y-6 max-w-xl">
            <div>
              <h3 className="text-lg font-bold text-[#111827]">
                Manage Owner Authentication PIN
              </h3>
              <p className="text-xs text-[#697386] mt-1 leading-relaxed">
                Update the PIN used to access this console. The PIN is hashed with PBKDF2 (10,000 rounds of SHA-256) and a unique cryptographic salt.
              </p>
            </div>

            <form onSubmit={handleChangePin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#111827] mb-1.5">
                  Current PIN
                </label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full h-10 px-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2D7773]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#111827] mb-1.5">
                  New PIN (Minimum 4 digits)
                </label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Enter new PIN"
                  className="w-full h-10 px-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2D7773]"
                />
              </div>

              {pinChangeNotice && (
                <div className="p-3 bg-[#F5F2EA] border border-[#D8DCE2] rounded-xl text-xs font-mono text-[#111827]">
                  {pinChangeNotice}
                </div>
              )}

              <button
                type="submit"
                disabled={!currentPinInput || !newPinInput}
                className="px-5 py-2.5 bg-[#2D7773] hover:bg-[#25635F] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow-xs"
              >
                Save New Owner PIN
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
