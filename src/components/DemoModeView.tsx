/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Globe, Binary, FileCode, Layers, HelpCircle, Clock } from 'lucide-react';
import { DEMO_SCENARIOS, DemoScenario } from '../data/demoScenarios.ts';
import { ResultsDashboard } from './ResultsDashboard.tsx';
import type { UnifiedReport } from '../types/index.ts';

interface DemoModeViewProps {
  onSelectScenario: (scenario: DemoScenario) => void;
  activeReport: UnifiedReport | null;
  onReset: () => void;
  onOpenPresentation: () => void;
}

export const DemoModeView: React.FC<DemoModeViewProps> = ({
  onSelectScenario,
  activeReport,
  onReset,
  onOpenPresentation,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEMO_SCENARIOS[0].id);

  const handleRunScenario = (scenario: DemoScenario) => {
    setSelectedScenarioId(scenario.id);
    onSelectScenario(scenario);
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'url':
        return Globe;
      case 'domain':
        return Layers;
      case 'ip':
        return Binary;
      case 'file':
        return FileCode;
      default:
        return Globe;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#D5A64A]/10 border border-[#D5A64A]/30 text-xs font-mono font-bold text-[#D5A64A] mb-2 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D5A64A]" />
              <span>Offline Threat Simulation Environment</span>
            </div>
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
              Pre-Configured Investigative Scenarios
            </h2>
            <p className="text-xs text-[#697386] mt-1 leading-relaxed max-w-2xl">
              Zero internet access, API keys, or external credentials required. Test every investigation flow and edge case safely in an isolated demonstration sandbox.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenPresentation}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-[#1E293B] rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              Launch 60s Presentation
            </button>
            {activeReport && (
              <button
                type="button"
                onClick={onReset}
                className="px-3 py-2 text-xs font-medium text-[#697386] hover:text-[#111827] border border-[#D8DCE2] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
            )}
          </div>
        </div>

        {/* 7 Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {DEMO_SCENARIOS.map((scenario) => {
            const Icon = getScenarioIcon(scenario.indicatorType);
            const isSelected = selectedScenarioId === scenario.id;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleRunScenario(scenario)}
                className={`p-4 rounded-xl text-left border transition-all space-y-2 flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#2D7773] bg-[#2D7773]/5 ring-1 ring-[#2D7773]'
                    : 'border-[#D8DCE2] bg-[#F5F2EA]/40 hover:bg-[#F5F2EA] hover:border-[#697386]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#697386] flex items-center gap-1">
                      <Icon className="w-3.5 h-3.5 text-[#2D7773]" />
                      <span>{scenario.indicatorType.toUpperCase()}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        scenario.report.assessment === 'malicious'
                          ? 'bg-[#C94C4C]/10 text-[#C94C4C] font-bold'
                          : scenario.report.assessment === 'suspicious'
                          ? 'bg-[#D5A64A]/10 text-[#D5A64A] font-bold'
                          : scenario.report.assessment === 'no_detections'
                          ? 'bg-[#2D7773]/10 text-[#2D7773] font-bold'
                          : 'bg-[#697386]/10 text-[#697386] font-bold'
                      }`}
                    >
                      {scenario.report.assessment.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#111827]">
                    {scenario.title}
                  </h4>
                  <p className="text-[11px] text-[#697386] line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#D8DCE2]/60 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#697386] truncate max-w-[170px]">
                    {scenario.indicator}
                  </span>
                  <span className="text-[#2D7773] font-semibold flex items-center gap-1">
                    <span>Inspect</span>
                    <Play className="w-3 h-3 fill-current" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Scenario Results */}
      {activeReport ? (
        <ResultsDashboard report={activeReport} />
      ) : (
        <div className="bg-[#FFFFFF] border border-[#D8DCE2] p-8 rounded-xl text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-[#697386] mx-auto" />
          <h3 className="text-base font-bold text-[#111827]">
            Select an Offline Scenario Above
          </h3>
          <p className="text-xs text-[#697386] max-w-md mx-auto leading-relaxed">
            Choose any of the 7 simulated cases (phishing URL, suspicious typosquatting domain, C2 IP, ransomware hash, clean archive, or inconclusive 404) to examine full threat telemetry.
          </p>
        </div>
      )}
    </div>
  );
};
