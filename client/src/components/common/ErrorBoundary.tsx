/**
 * DESI BOLT — React Error Boundary
 * Catches JavaScript runtime errors and renders a user-friendly recovery UI.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    console.error('[DESI BOLT ErrorBoundary] Uncaught React Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EAE4D9] shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#E63946] flex items-center justify-center mx-auto shadow-md shadow-red-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 font-heading">Something went wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface error occurred. Don't worry, your cart and session are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left">
                <p className="text-[11px] font-mono text-red-600 font-bold truncate">
                  {this.state.error.message || 'Unknown runtime error'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-[#1F2421] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-[#E63946] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#D62839] transition-all shadow-md shadow-red-500/20"
              >
                <Home className="w-4 h-4" />
                Back to Store
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
