
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useMobileNavigation() {
  const [location] = useLocation();

  useEffect(() => {
    // Clear any body styles that might interfere with navigation
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open', 'overflow-hidden');
    
    // Force a layout recalculation on mobile
    if (window.innerWidth <= 768) {
      const forceReflow = () => {
        document.body.offsetHeight;
        window.scrollTo(0, 0);
      };
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(forceReflow);
    }
  }, [location]);

  return { location };
}
