import { createContext } from 'react';

export interface Notifier {
  success: (message: string) => void;
  error: (message: string) => void;
}

export const NotificationContext = createContext<Notifier | null>(null);
