import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="glass-panel p-8 max-w-md w-full flex flex-col items-center gap-6 shadow-2xl rounded-2xl border border-rose-900/50">
            <div className="bg-rose-950/30 border border-rose-800 p-4 rounded-full">
              <AlertTriangle className="h-12 w-12 text-rose-500 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Ocurrió un error inesperado</h1>
            <p className="text-xs text-gray-400">
              {this.state.error?.message || 'Error de renderizado de componente React.'}
            </p>
            <Button 
              onClick={this.handleReset} 
              className="w-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 font-bold"
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar Aplicación
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
