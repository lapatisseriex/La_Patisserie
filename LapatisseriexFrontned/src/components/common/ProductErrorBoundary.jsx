import React from 'react';
import { useNavigate } from 'react-router-dom';

class ProductErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProductErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
          <div className="text-center bg-white border border-gray-200 p-8 md:p-12 rounded-2xl shadow-xl max-w-md w-full">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              We encountered an error while loading the product. This might be due to a network issue or temporary server problem.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.state.retryCount < 3 && (
                <button
                  onClick={this.handleRetry}
                  className="bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition-colors rounded-lg text-sm"
                >
                  Try Again ({3 - this.state.retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="bg-black text-white px-6 py-3 font-medium hover:bg-gray-900 transition-colors rounded-lg text-sm"
              >
                Return Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks
export const ProductErrorBoundaryWrapper = ({ children }) => {
  return (
    <ProductErrorBoundary>
      {children}
    </ProductErrorBoundary>
  );
};

export default ProductErrorBoundary;