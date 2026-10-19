/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Trash2, Clock, ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';
import type { HistoryEntry } from '../types/index.ts';

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
  onSelectHistoryEntry: (entry: HistoryEntry) => void;
}

export const SessionHistoryDrawer: React.FC<SessionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectHistoryEntry,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-[#111827]/50 backdrop-blur-xs"
    >
      <div className="bg-[#FFFFFF] border-l border-[#D8DCE2] w-full max-w-md h-full flex flex-col p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#D8DCE2]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2D7773]" />
            <h3 className="text-sm font-bold text-[#111827]">
              Session Investigation History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#697386] hover:text-[#111827]"
            aria-label="Close history drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-2 text-[11px] text-[#697386] flex items-center justify-between border-b border-[#D8DCE2]/60">
          <span>In-memory only · Cleared on tab close</span>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[#C94C4C] hover:underline flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#D8DCE2]/60 py-2">
          {history.length === 0 ? (
            <div className="text-center py-12 text-[#697386] text-xs">
              <Clock className="w-8 h-8 text-[#D8DCE2] mx-auto mb-2" />
              <span>No investigations in this session yet.</span>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  onSelectHistoryEntry(entry);
                  onClose();
                }}
                className="py-3 px-2 hover:bg-[#F5F2EA] rounded-lg cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono uppercase font-bold text-[#697386]">
                    {entry.indicator_type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {entry.is_simulated ? (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#D5A64A]/10 text-[#D5A64A] font-semibold">
                        DEMO
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1 rounded bg-[#2D7773]/10 text-[#2D7773] font-semibold">
                        LIVE
                      </span>
                    )}
                    <span className="text-[10px] text-[#697386] font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs font-semibold text-[#111827] truncate">
                  {entry.indicator}
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`font-semibold ${
                      entry.assessment === 'malicious'
                        ? 'text-[#C94C4C]'
                        : entry.assessment === 'suspicious'
                        ? 'text-[#D5A64A]'
                        : entry.assessment === 'no_detections'
                        ? 'text-[#2D7773]'
                        : 'text-[#697386]'
                    }`}
                  >
                    {entry.assessment.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[#697386]">·</span>
                  <span className="text-[#697386] font-mono text-[10px]">
                    {entry.stats.malicious} mal / {entry.stats.suspicious} susp / {entry.stats.harmless} clean
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
