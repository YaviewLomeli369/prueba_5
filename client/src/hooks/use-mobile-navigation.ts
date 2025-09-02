
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

export function useMobileNavigationCleanup() {
  const [location, setLocation] = useLocation();
  const isNavigatingRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const forceCleanup = useCallback(() => {
    if (!isMountedRef.current) return;
    
    try {
      // Clear all modal states
      document.body.classList.remove('modal-open', 'overflow-hidden');
      document.body.style.overflow = '';
      document.body.style.touchAction = 'auto';
      
      // Force close any open dialogs/modals
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });
      document.dispatchEvent(escapeEvent);
      
      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
      
      // Force repaint on mobile
      if (window.innerWidth <= 768) {
        document.documentElement.style.display = 'none';
        document.documentElement.offsetHeight; // Trigger reflow
        document.documentElement.style.display = '';
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }, []);

  const safeNavigate = useCallback((href: string, options?: { replace?: boolean }) => {
    if (isNavigatingRef.current || !isMountedRef.current) return;
    
    try {
      isNavigatingRef.current = true;
      
      // Immediate cleanup
      forceCleanup();
      
      // Small delay for mobile cleanup
      cleanupTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          if (options?.replace) {
            window.history.replaceState(null, '', href);
            setLocation(href);
          } else {
            setLocation(href);
          }
        }
        isNavigatingRef.current = false;
      }, 50);
      
    } catch (error) {
      console.error('Navigation error:', error);
      isNavigatingRef.current = false;
      window.location.href = href; // Fallback
    }
  }, [setLocation, forceCleanup]);

  // Enhanced mobile detection and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceCleanup();
      }
    };

    const handleBeforeUnload = () => {
      forceCleanup();
    };

    const handleTouchStart = () => {
      if (window.innerWidth <= 768) {
        document.body.style.touchAction = 'auto';
      }
    };

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        forceCleanup();
      }
    };

    // Mobile-specific event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      forceCleanup();
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('resize', handleResize);
    };
  }, [forceCleanup]);

  return {
    safeNavigate,
    isNavigating: isNavigatingRef.current,
    forceCleanup,
    isMounted: isMountedRef.current
  };
}
