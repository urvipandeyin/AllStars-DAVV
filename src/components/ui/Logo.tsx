import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizes = {
  sm: 'h-12',
  md: 'h-16',
  lg: 'h-20',
  xl: 'h-36',
  '2xl': 'h-52',
};

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="AllStars DAVV"
      className={cn('object-contain', sizes[size], className)}
    />
  );
}

// Minimal version for loading screens
export function LogoIcon({ size = 'lg', className }: { size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="AllStars DAVV"
      className={cn('object-contain animate-pulse', sizes[size], className)}
    />
  );
}
