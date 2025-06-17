
import React from 'react';
import { ProducerOfWeek } from './ProducerOfWeek';

class ProducerOfWeekErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ProducerOfWeek component error (non-critical):', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card/60 border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">
            Featured producer temporarily unavailable
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ProducerOfWeekWrapper() {
  return (
    <ProducerOfWeekErrorBoundary>
      <ProducerOfWeek />
    </ProducerOfWeekErrorBoundary>
  );
}
