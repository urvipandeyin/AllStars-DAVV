import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn('container mx-auto px-4 py-6 pb-24 md:pb-6', className)}>
      {children}
    </main>
  );
}
