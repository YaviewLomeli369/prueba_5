import React, { useMemo } from "react";
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
  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  const isModuleActive = useMemo(() => {
    if (!config) return false;
    const configData = config.config as any;
    const modules = configData?.frontpage?.modulos || {};
    return modules[moduleKey]?.activo;
  }, [config, moduleKey]);

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return <LoadingPage />;
        }

        if (!isModuleActive) {
          return <NotFound />;
        }

        return <Component key={`${moduleKey}-${path}`} />;
      }}
    </Route>
  );
}