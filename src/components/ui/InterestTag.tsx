import { cn } from '@/lib/utils';
import { INTEREST_COLORS } from '@/lib/constants';

interface InterestTagProps {
  interest: string;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export function InterestTag({ interest, size = 'md', removable, onRemove }: InterestTagProps) {
  const colorClass = INTEREST_COLORS[interest] || 'bg-muted text-muted-foreground border-border';
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-all',
        colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        removable && 'pr-1'
      )}
    >
      {interest}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
