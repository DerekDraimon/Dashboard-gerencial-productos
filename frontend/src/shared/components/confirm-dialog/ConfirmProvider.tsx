import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfirmContext, type Confirm, type ConfirmOptions } from './confirm-context';

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((nextOptions) => {
    // Only one dialog at a time: a pending question is answered as cancelled.
    resolveRef.current?.(false);
    setOptions(nextOptions);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function answer(ok: boolean) {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    // Options stay set so the content does not vanish during the closing transition.
    setOpen(false);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmDialog
          {...options}
          open={open}
          onConfirm={() => answer(true)}
          onCancel={() => answer(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}
