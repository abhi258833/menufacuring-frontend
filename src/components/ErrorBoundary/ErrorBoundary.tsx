import React, { Component, ErrorInfo, ReactNode } from "react";
import "../../pages/error/animate.css";

interface Props {
  children?: ReactNode;
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
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <div className="stars" />
          <div className="twinkling" />
          <div className="clouds" />
          <div className="meteors" />
          <div className="error-card fade-in" style={{ maxWidth: '500px' }}>
            <h1 className="glow-text animate__animated animate__rubberBand" style={{ color: '#ff6b6b', textShadow: '0 0 20px #ff6b6b', fontSize: '5rem' }}>Oops!</h1>
            <h2 className="text-glow animate__animated animate__fadeInUp animate__delay-1s">
              Something went wrong
            </h2>
            <p className="animate__animated animate__fadeIn animate__delay-2s" style={{ margin: '1rem 0', color: '#ffedd2', fontSize: '0.9rem' }}>
              An unexpected error occurred in the application. Please try reloading the page.
            </p>
            {this.state.error && (
              <pre style={{ 
                background: 'rgba(0, 0, 0, 0.4)', 
                padding: '1rem', 
                borderRadius: '8px', 
                color: '#ff8a8a', 
                textAlign: 'left', 
                fontSize: '0.8rem',
                overflowX: 'auto',
                maxHeight: '150px'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div className="btn-group animate__animated animate__fadeInUp animate__delay-3s" style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="space-btn" 
                onClick={() => window.location.reload()}
                style={{ borderColor: '#ff6b6b', color: '#ff6b6b', boxShadow: '0 0 10px rgba(255, 107, 107, 0.5)' }}
              >
                🔄 Reload Page
              </button>
              <button className="space-btn secondary" onClick={() => window.location.href = "/"}>
                🏠 Go Home
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
