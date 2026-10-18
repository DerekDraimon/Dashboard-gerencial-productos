import { lazy, Suspense, useState, type ComponentType } from 'react';
import { LoadingState } from '../states';
import { RouteErrorBoundary } from './RouteErrorBoundary';

export function lazyPage(load: () => Promise<ComponentType>): ComponentType {
  const createPage = () => lazy(() => load().then((Page) => ({ default: Page })));
  // React.lazy caches a rejected import forever, so a retry needs a fresh lazy component.
  let Page = createPage();

  return function LazyPage() {
    const [, setAttempt] = useState(0);

    const retry = () => {
      Page = createPage();
      setAttempt((attempt) => attempt + 1);
    };

    return (
      <RouteErrorBoundary onRetry={retry}>
        <Suspense fallback={<LoadingState />}>
          <Page />
        </Suspense>
      </RouteErrorBoundary>
    );
  };
}
