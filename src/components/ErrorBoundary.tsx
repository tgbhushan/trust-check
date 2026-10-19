/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app exception in TRUST//CHECK:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-6 text-[#111827]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#D8DCE2] p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#C94C4C] mb-5">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F2EA] rounded-full border border-[#D8DCE2] text-xs font-mono text-[#697386] mb-3">
              <Shield className="w-3.5 h-3.5 text-[#2D7773]" />
              <span>INVESTIGATION SAFEGUARD</span>
            </div>

            <h2 className="text-xl font-bold text-[#111827] mb-2">
              Investigation Encountered an Anomaly
            </h2>

            <p className="text-sm text-[#697386] mb-6 leading-relaxed">
              TRUST//CHECK isolated an unexpected runtime state. Your session and device data remain completely safe.
            </p>

            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#2D7773] hover:bg-[#25635F] text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Investigation Desk</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
