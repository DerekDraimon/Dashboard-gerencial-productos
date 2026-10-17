import { useContext } from 'react';
import { NotificationContext, type Notifier } from './notification-context';

export function useNotify(): Notifier {
  const notifier = useContext(NotificationContext);
  if (!notifier) {
    throw new Error('useNotify must be used inside NotificationProvider');
  }
  return notifier;
}
