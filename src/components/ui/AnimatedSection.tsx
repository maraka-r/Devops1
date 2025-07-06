'use client';

import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn';
  delay?: number;
  duration?: number;
}

/**
 * Composant wrapper pour ajouter des animations au scroll aux sections
 */
export function AnimatedSection({ 
  children, 
  className = '',
  animation = 'fadeIn',
  delay = 0,
  duration = 600
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView({ 
    threshold: 0.1, 
    rootMargin: '-50px' 
  });

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out';
    const durationClass = `duration-${duration}`;
    
    if (!isInView) {
      switch (animation) {
        case 'fadeIn':
          return `${baseClasses} ${durationClass} opacity-0`;
        case 'slideUp':
          return `${baseClasses} ${durationClass} opacity-0 translate-y-8`;
        case 'slideInLeft':
          return `${baseClasses} ${durationClass} opacity-0 -translate-x-8`;
        case 'slideInRight':
          return `${baseClasses} ${durationClass} opacity-0 translate-x-8`;
        case 'scaleIn':
          return `${baseClasses} ${durationClass} opacity-0 scale-95`;
        default:
          return `${baseClasses} ${durationClass} opacity-0`;
      }
    }
    
    return `${baseClasses} ${durationClass} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div
      ref={ref}
      className={cn(getAnimationClasses(), className)}
      style={{
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

/**
 * Composant pour animer des éléments de liste avec un effet de cascade
 */
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  animation?: 'fadeIn' | 'slideUp' | 'slideInLeft';
}

export function StaggeredList({
  children,
  className = '',
  itemClassName = '',
  staggerDelay = 100,
  animation = 'slideUp'
}: StaggeredListProps) {
  const { ref, isInView } = useInView({ 
    threshold: 0.1, 
    rootMargin: '-50px' 
  });

  const getItemClasses = (index: number, isVisible: boolean) => {
    const baseClasses = 'transition-all duration-500 ease-out';
    
    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return `${baseClasses} opacity-0`;
        case 'slideUp':
          return `${baseClasses} opacity-0 translate-y-6`;
        case 'slideInLeft':
          return `${baseClasses} opacity-0 -translate-x-6`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-y-0 translate-x-0`;
  };

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            getItemClasses(index, isInView),
            itemClassName
          )}
          style={{
            transitionDelay: isInView ? `${index * staggerDelay}ms` : '0ms'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
