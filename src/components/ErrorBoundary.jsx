import { Component } from "react";

// A top-level safety net: if any component anywhere in the app throws
// during render (a bad API response shape, a third-party library like
// Leaflet failing on unexpected data, etc.), React would otherwise unmount
// the ENTIRE app and leave a blank white screen with no way to recover.
// This catches that, logs it, and shows a friendly retry screen instead -
// directly addressing the audit's "blank homepage" reliability concern.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-white">
          <div className="text-center max-w-sm">
            <p className="text-3xl mb-3">⚠️</p>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-6">
              This page hit an unexpected error. Refreshing usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-700 hover:bg-teal-800 transition text-white font-bold px-6 py-2.5 rounded-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
