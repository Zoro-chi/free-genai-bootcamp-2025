'use client';

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary p-6 bg-white rounded-lg shadow-lg m-4 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="mb-4 text-gray-700">
            Sorry, an error occurred while rendering this component. Please try refreshing the page.
          </p>
          <details className="bg-gray-100 p-3 rounded-md">
            <summary className="cursor-pointer text-gray-600 font-medium mb-2">Error details</summary>
            <p className="text-red-500 text-sm">
              {this.state.error && this.state.error.toString()}
            </p>
            <div className="mt-2 bg-gray-900 text-gray-300 p-3 rounded-md text-xs overflow-auto">
              <pre>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
          </details>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
