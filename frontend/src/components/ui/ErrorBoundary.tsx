import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Substitui o fallback padrão (útil para o nível raiz da aplicação). */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Captura erros de renderização dos filhos e mostra um fallback em vez de uma tela em branco.
 * Para resetar ao navegar, use `key={pathname}` no ponto de uso.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-warning" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">Algo deu errado nesta tela</p>
          <p className="text-xs text-text-muted">Tente novamente. Se o problema continuar, recarregue a página.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={this.handleRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
