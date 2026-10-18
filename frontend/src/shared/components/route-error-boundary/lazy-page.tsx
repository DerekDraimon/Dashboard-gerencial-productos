import { lazy, Suspense, useState, type ComponentType } from 'react';
import { LoadingState } from '../states';
import { RouteErrorBoundary } from './RouteErrorBoundary';

export function lazyPage(load: () => Promise<ComponentType>): ComponentType {
  const createPage = () => lazy(() => load().then((Page) => ({ default: Page })));
  // Shared so a loaded page is not imported again on every mount.
  let sharedPage = createPage();

  return function LazyPage() {
    const [Page, setPage] = useState(() => sharedPage);

    // React.lazy caches a rejected import forever, so a retry needs a fresh lazy component.
    const retry = () => {
      sharedPage = createPage();
      setPage(() => sharedPage);
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
