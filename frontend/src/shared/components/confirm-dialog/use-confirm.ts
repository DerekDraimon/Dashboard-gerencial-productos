import { useContext } from 'react';
import { ConfirmContext, type Confirm } from './confirm-context';

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used inside ConfirmProvider');
  }
  return confirm;
}
