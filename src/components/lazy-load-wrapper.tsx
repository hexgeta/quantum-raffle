import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { ReactNode } from 'react';

interface LazyLoadWrapperProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoadWrapper({
  children,
  className = '',
  threshold = 0,
  rootMargin = '100px'
}: LazyLoadWrapperProps) {
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  return (
    <div ref={targetRef} className={className}>
      {hasIntersected ? children : null}
    </div>
  );
} 