import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f7faf7] text-slate-800 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-emerald-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto text-2xl font-bold">
              🌱
            </div>
            <h2 className="text-xl font-bold font-serif text-[#12372A]">
              Something went slightly off
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We encountered a minor display issue. Please reload the page to continue exploring ParyavaranSanrakshan.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-5 py-2.5 rounded-full bg-[#12372A] hover:bg-[#1b4332] text-white text-xs font-bold transition-all shadow-sm"
              >
                Return Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
