import React, { useEffect, useRef, useState } from 'react';

export type RevealVariant =
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-depth'
  | 'blur-spread'
  | 'flip-up'
  | 'portal-expand';

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in ms
  variant?: RevealVariant;
  duration?: number; // duration in ms
};

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'slide-up',
  duration = 1050,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const lastScrollY = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (diff > 5) {
        setScrollDirection('down');
      } else if (diff < -5) {
        setScrollDirection('up');
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Compute creative transformation classes based on chosen variant and scroll direction
  const getTransformClasses = () => {
    if (isVisible) {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100 rotate-0 filter blur-0 [transform:perspective(1000px)_rotateX(0deg)_translateY(0px)] pointer-events-auto';
    }

    // Unrevealed state when scrolling DOWN
    if (scrollDirection === 'down') {
      switch (variant) {
        case 'slide-left':
          return 'opacity-0 -translate-x-16 -rotate-2 filter blur-md scale-[0.96] pointer-events-none';
        case 'slide-right':
          return 'opacity-0 translate-x-16 rotate-2 filter blur-md scale-[0.96] pointer-events-none';
        case 'zoom-depth':
          return 'opacity-0 scale-[0.88] translate-y-12 filter blur-lg pointer-events-none';
        case 'blur-spread':
          return 'opacity-0 filter blur-xl scale-[0.97] pointer-events-none';
        case 'flip-up':
          return 'opacity-0 [transform:perspective(1000px)_rotateX(18deg)_translateY(36px)] filter blur-sm pointer-events-none';
        case 'portal-expand':
          return 'opacity-0 scale-[0.92] translate-y-8 filter blur-md pointer-events-none';
        case 'slide-up':
        default:
          return 'opacity-0 translate-y-16 filter blur-sm scale-[0.98] pointer-events-none';
      }
    }

    // Unrevealed state when scrolling UP (gentle, elegant float-down settle)
    switch (variant) {
      case 'slide-left':
        return 'opacity-0 -translate-x-6 rotate-1 filter blur-0 scale-100 pointer-events-none';
      case 'slide-right':
        return 'opacity-0 translate-x-6 -rotate-1 filter blur-0 scale-100 pointer-events-none';
      case 'zoom-depth':
        return 'opacity-0 scale-[1.03] -translate-y-6 filter blur-0 pointer-events-none';
      case 'blur-spread':
        return 'opacity-0 filter blur-sm scale-100 pointer-events-none';
      case 'flip-up':
        return 'opacity-0 [transform:perspective(1000px)_rotateX(-10deg)_translateY(-16px)] filter blur-0 pointer-events-none';
      case 'portal-expand':
        return 'opacity-0 scale-[1.02] -translate-y-4 filter blur-0 pointer-events-none';
      case 'slide-up':
      default:
        return 'opacity-0 -translate-y-8 filter blur-0 scale-[1.01] pointer-events-none';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${isVisible ? delay : 0}ms`,
      }}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-transform ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
