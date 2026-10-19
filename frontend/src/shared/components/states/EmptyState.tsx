import InboxOutlined from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';
import { StateLayout } from './StateLayout';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon = <InboxOutlined />,
}: EmptyStateProps) {
  return (
    <StateLayout
      icon={icon}
      iconColors={{ bgcolor: 'tint.sage', color: 'text.primary' }}
      title={title}
      description={description}
      action={action}
    />
  );
}
