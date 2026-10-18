import { Component, type ReactNode } from 'react';
import { ErrorState } from '../states';

export interface RouteErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface RouteErrorBoundaryState {
  error: unknown;
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  override state: RouteErrorBoundaryState = { error: null, hasError: false };

  static getDerivedStateFromError(error: unknown): RouteErrorBoundaryState {
    return { error, hasError: true };
  }

  private retry = () => {
    this.props.onRetry?.();
    this.setState({ error: null, hasError: false });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <ErrorState
        error={this.state.error}
        title="No pudimos cargar esta sección."
        onRetry={this.retry}
      />
    );
  }
}
