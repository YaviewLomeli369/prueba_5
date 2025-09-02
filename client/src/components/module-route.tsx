
import React, { useMemo, useEffect, useRef } from "react";
import { Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LoadingPage } from "@/components/loading-page";
import NotFound from "@/pages/not-found";
import type { SiteConfig } from "@shared/schema";

interface ModuleRouteProps {
  path: string;
  component: React.ComponentType<any>;
  moduleKey: string;
}

export function ModuleRoute({ path, component: Component, moduleKey }: ModuleRouteProps) {
  const routeInstanceRef = useRef(`module-route-${moduleKey}-${Date.now()}`);
  const isMountedRef = useRef(true);
  
  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: 1,
    enabled: isMountedRef.current,
  });

  const isModuleActive = useMemo(() => {
    if (!config || !isMountedRef.current) return false;
    const configData = config.config as any;
    const modules = configData?.frontpage?.modulos || {};
    return modules[moduleKey]?.activo;
  }, [config, moduleKey]);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Enhanced navigation safety for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Cleanup any module-specific states when page becomes hidden
        document.body.classList.remove('modal-open', 'overflow-hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Route path={path}>
      {() => {
        if (!isMountedRef.current) {
          return null;
        }
        
        if (isLoading) {
          return <LoadingPage key={`${routeInstanceRef.current}-loading`} />;
        }

        if (!isModuleActive) {
          return <NotFound key={`${routeInstanceRef.current}-not-found`} />;
        }

        return <Component key={`${routeInstanceRef.current}-component-${moduleKey}`} />;
      }}
    </Route>
  );
}
