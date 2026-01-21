import { cn } from '@/lib/utils';

interface LookingForBadgeProps {
  status: 'Team' | 'Collaborators' | 'Exploring';
  size?: 'sm' | 'md';
}

const statusConfig = {
  Team: {
    label: '🎯 Looking for Team',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  Collaborators: {
    label: '🤝 Looking for Collaborators',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  Exploring: {
    label: '🔍 Just Exploring',
    className: 'bg-accent/10 text-accent border-accent/20',
  },
};

export function LookingForBadge({ status, size = 'md' }: LookingForBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}
