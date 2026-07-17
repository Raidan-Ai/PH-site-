import React, { createContext, useContext, useState, useEffect, useId } from 'react';

// Define breakpoint thresholds matching Tailwind standards
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type DeviceTier = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';

interface ResponsiveLayoutContextType {
  width: number;
  height: number;
  tier: DeviceTier;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

const ResponsiveLayoutContext = createContext<ResponsiveLayoutContextType | undefined>(undefined);

/**
 * Custom hook to consume the responsive layout context state.
 */
export const useResponsiveLayout = () => {
  const context = useContext(ResponsiveLayoutContext);
  if (!context) {
    throw new Error('useResponsiveLayout must be used within a ResponsiveLayoutProvider');
  }
  return context;
};

interface ResponsiveLayoutProviderProps {
  children: React.ReactNode;
}

/**
 * Global or local provider that tracks window sizing with debouncing
 * and a ResizeObserver for stable responsive state tracking.
 */
export const ResponsiveLayoutProvider: React.FC<ResponsiveLayoutProviderProps> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use ResizeObserver on document.body to track size changes reliably,
    // including inside iframes, tabs, and sidebars.
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // fallback to window size in case of layout constraints
        setDimensions({
          width: width || window.innerWidth,
          height: height || window.innerHeight,
        });
      }
    });

    resizeObserver.observe(document.body);

    const handleWindowResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const { width, height } = dimensions;

  // Compute Device Tier matching typical screens
  let tier: DeviceTier = 'desktop';
  if (width < BREAKPOINTS.md) {
    tier = 'mobile';
  } else if (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg) {
    tier = 'tablet';
  } else if (width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl) {
    tier = 'desktop';
  } else {
    tier = 'large-desktop';
  }

  const value: ResponsiveLayoutContextType = {
    width,
    height,
    tier,
    isMobile: tier === 'mobile',
    isTablet: tier === 'tablet',
    isDesktop: tier === 'desktop',
    isLargeDesktop: tier === 'large-desktop',
  };

  return (
    <ResponsiveLayoutContext.Provider value={value}>
      {children}
    </ResponsiveLayoutContext.Provider>
  );
};

interface ResponsiveLayoutWrapperProps {
  children: React.ReactNode;
  /** Custom mobile padding override (default 'p-4') */
  mobilePadding?: string;
  /** Custom mobile outer gap override (default 'gap-4') */
  mobileGap?: string;
  /** Clean selector to target specific children (e.g., '.bento-item' or '.custom-grid-item') */
  targetSelector?: string;
  /** Boolean to enable strict cell column-span override to single col list on mobile */
  forceSingleColumnMobile?: boolean;
}

/**
 * A highly resilient Layout Decorator/Wrapper component.
 * It injects optimized overrides for CSS grid structures, bento cards,
 * padding boundaries, and margins on mobile devices to prevent any scaling breakages.
 */
export const ResponsiveLayoutWrapper: React.FC<ResponsiveLayoutWrapperProps> = ({
  children,
  mobilePadding = '16px',
  mobileGap = '16px',
  targetSelector = '.bento-item',
  forceSingleColumnMobile = true,
}) => {
  const { isMobile } = useResponsiveLayout();
  const wrapperId = useId().replace(/:/g, '-');

  // We write an on-the-fly customized styles injector that applies deep overrides ONLY below this wrapper
  // on mobile, ensuring nested custom grid layouts, bento frames, and cards get corrected seamlessly.
  const generateStyles = () => {
    return `
      @media (max-width: 767px) {
        /* Optimize any container padding under this wrapper */
        .rl-wrapper-${wrapperId} {
          padding-left: ${mobilePadding} !important;
          padding-right: ${mobilePadding} !important;
        }

        /* Force any nested grid and bento wrappers to single column and comfortable compact gap */
        .rl-wrapper-${wrapperId} .bento-grid, 
        .rl-wrapper-${wrapperId} .grid-cols-2,
        .rl-wrapper-${wrapperId} .grid-cols-3,
        .rl-wrapper-${wrapperId} .grid-cols-4,
        .rl-wrapper-${wrapperId} .md\\:grid-cols-4,
        .rl-wrapper-${wrapperId} .lg\\:grid-cols-3,
        .rl-wrapper-${wrapperId} .lg\\:grid-cols-4 {
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          gap: ${mobileGap} !important;
        }

        /* Override specific column span overrides so cards sit cleanly at 100% width */
        ${forceSingleColumnMobile ? `
          .rl-wrapper-${wrapperId} [class*="col-span-"], 
          .rl-wrapper-${wrapperId} [class*="md:col-span-"],
          .rl-wrapper-${wrapperId} [class*="lg:col-span-"],
          .rl-wrapper-${wrapperId} [class*="sm:col-span-"] {
            grid-column: span 1 / span 1 !important;
          }
        ` : ''}

        /* Optimize targets (like bento items or custom cards) padding & roundness */
        .rl-wrapper-${wrapperId} ${targetSelector},
        .rl-wrapper-${wrapperId} .bento-item {
          padding: 20px !important;
          border-radius: 20px !important;
        }

        /* Balance large vertical padding sections so mobile users don't have to scroll excessively */
        .rl-wrapper-${wrapperId} .py-32,
        .rl-wrapper-${wrapperId} .py-24,
        .rl-wrapper-${wrapperId} .py-20,
        .rl-wrapper-${wrapperId} .py-16 {
          padding-top: 2rem !important;
          padding-bottom: 2rem !important;
        }

        .rl-wrapper-${wrapperId} .pt-32, .rl-wrapper-${wrapperId} .pt-24 {
          padding-top: 2.5rem !important;
        }

        .rl-wrapper-${wrapperId} .pb-32, .rl-wrapper-${wrapperId} .pb-24 {
          padding-bottom: 2.5rem !important;
        }

        /* Resize overly dramatic section title text to be compact yet premium */
        .rl-wrapper-${wrapperId} .text-5xl,
        .rl-wrapper-${wrapperId} .text-6xl,
        .rl-wrapper-${wrapperId} .text-7xl {
          font-size: 1.875rem !important; /* 30px */
          line-height: 2.25rem !important;
          letter-spacing: -0.025em !important;
        }

        .rl-wrapper-${wrapperId} .text-4xl {
          font-size: 1.5rem !important; /* 24px */
          line-height: 2rem !important;
        }

        .rl-wrapper-${wrapperId} .text-2xl,
        .rl-wrapper-${wrapperId} .text-3xl {
          font-size: 1.25rem !important; /* 20px */
          line-height: 1.75rem !important;
        }

        /* Clean up dense structural elements */
        .rl-wrapper-${wrapperId} .gap-20,
        .rl-wrapper-${wrapperId} .gap-16,
        .rl-wrapper-${wrapperId} .gap-12 {
          gap: 1.5rem !important;
        }
      }
    `;
  };

  // We also recursively rewrite React children props in real-time to strip
  // conflicting layout/padding classes on mobile to prevent static CSS clashes.
  // This is a highly defensive API wrapper that covers both runtime JS rendering and pure CSS overrides.
  const tweakChildrenForMobile = (nodes: React.ReactNode): React.ReactNode => {
    if (!isMobile) return nodes;

    return React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;

      const props = child.props as any;
      let newClassName = props.className || '';

      // If this child is a grid or card, rewrite redundant spacing or grid spans
      if (newClassName) {
        // Strip out excessive padding classes and replace with compact padding
        if (newClassName.includes('p-8') || newClassName.includes('p-10') || newClassName.includes('p-12') || newClassName.includes('p-[48px]')) {
          newClassName = newClassName
            .replace(/\bp-8\b/g, 'p-5')
            .replace(/\bp-10\b/g, 'p-5')
            .replace(/\bp-12\b/g, 'p-5')
            .replace(/\bp-16\b/g, 'p-5')
            .replace(/\bp-20\b/g, 'p-5')
            .replace(/\bp-\[48px\]\b/g, 'p-5');
        }

        // Strip out excessive margins
        if (newClassName.includes('mb-20') || newClassName.includes('mb-24') || newClassName.includes('mb-32')) {
          newClassName = newClassName
            .replace(/\bmb-20\b/g, 'mb-8')
            .replace(/\bmb-24\b/g, 'mb-8')
            .replace(/\bmb-32\b/g, 'mb-12');
        }

        // Tweak large rounded borders so they fit gracefully
        if (newClassName.includes('rounded-[40px]') || newClassName.includes('rounded-[48px]') || newClassName.includes('rounded-[64px]')) {
          newClassName = newClassName
            .replace(/\brounded-\[40px\]\b/g, 'rounded-2xl')
            .replace(/\brounded-\[48px\]\b/g, 'rounded-2xl')
            .replace(/\brounded-\[64px\]\b/g, 'rounded-3xl');
        }
      }

      // Recursively optimize nested children
      const nextChildren = props.children ? tweakChildrenForMobile(props.children) : undefined;

      return React.cloneElement(child, {
        ...props,
        className: newClassName,
        children: nextChildren,
      });
    });
  };

  return (
    <div id={`rl-wrapper-${wrapperId}`} className={`rl-wrapper-${wrapperId} w-full`}>
      <style dangerouslySetInnerHTML={{ __html: generateStyles() }} />
      {tweakChildrenForMobile(children)}
    </div>
  );
};

interface ResponsiveLayoutDecoratorProps {
  children: React.ReactNode;
}

/**
 * High-utility component to wrap any page or layout block.
 * Ensures the nested elements automatically get context access and
 * applies layout adjustments in an extremely reliable manner.
 */
export const ResponsiveLayoutDecorator: React.FC<ResponsiveLayoutDecoratorProps> = ({ children }) => {
  return (
    <ResponsiveLayoutProvider>
      <ResponsiveLayoutWrapper>
        {children}
      </ResponsiveLayoutWrapper>
    </ResponsiveLayoutProvider>
  );
};
