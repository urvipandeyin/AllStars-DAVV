import { cn } from '@/lib/utils';

interface SkillBadgeProps {
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  size?: 'sm' | 'md';
}

const levelConfig = {
  Beginner: {
    label: '🌱 Beginner',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  Intermediate: {
    label: '🌿 Intermediate',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  Advanced: {
    label: '🌳 Advanced',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

export function SkillBadge({ level, size = 'md' }: SkillBadgeProps) {
  const config = levelConfig[level];
  
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
