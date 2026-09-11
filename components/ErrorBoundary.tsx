"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#12161C] text-[#F6F4EF] font-ibm-sans">
          <div className="max-w-md w-full border border-[#222933] border-l-4 border-l-[#791F1F] bg-[#181E26] p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-sm bg-[#791F1F]/20 flex items-center justify-center text-[#791F1F]">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h2 className="text-base font-semibold tracking-tight text-[#F6F4EF]">
                System Interruption Encountered
              </h2>
            </div>
            <p className="text-sm text-[#8A99AD] mb-4 leading-relaxed">
              Something went wrong while rendering this operational view. The autonomous telemetry has logged this event. Please try refreshing to re-synchronize state.
            </p>
            {this.state.error?.message && (
              <div className="p-2.5 mb-4 rounded-sm bg-[#12161C] border border-[#222933] font-ibm-mono text-xs text-[#8A99AD] break-all">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm bg-[#F6F4EF] text-[#12161C] hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F6F4EF]"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              Re-synchronize Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
