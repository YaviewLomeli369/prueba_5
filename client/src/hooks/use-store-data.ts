
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SiteConfig, Product, ProductCategory } from "@shared/schema";

export function useStoreData() {
  // Optimized queries with better mobile handling
  const { data: config, isLoading: configLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 10 * 60 * 1000, // 10 minutes for config
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/store/products"],
    staleTime: 1 * 60 * 1000, // 1 minute for products
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
    enabled: !!config, // Only fetch if config is loaded
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<ProductCategory[]>({
    queryKey: ["/api/store/categories"],
    staleTime: 5 * 60 * 1000, // 5 minutes for categories
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
    enabled: !!config, // Only fetch if config is loaded
  });

  // Computed values with safe access
  const storeConfig = useMemo(() => {
    if (!config) return { isStoreEnabled: false, appearance: {} };
    
    try {
      const configData = config?.config as any;
      const modules = configData?.frontpage?.modulos || {};
      const appearance = configData?.appearance || {};
      
      return {
        isStoreEnabled: modules.tienda?.activo || false,
        appearance,
        modules
      };
    } catch (error) {
      console.warn("Error parsing store config:", error);
      return { isStoreEnabled: false, appearance: {} };
    }
  }, [config]);

  const availableCategories = useMemo(() => {
    if (!categories) return ["all"];
    return ["all", ...categories.map(cat => cat.id)];
  }, [categories]);

  const getCategoryName = useMemo(() => {
    return (categoryId: string) => {
      if (categoryId === "all") return "Todas las categorías";
      return categories?.find(cat => cat.id === categoryId)?.name || categoryId;
    };
  }, [categories]);

  return {
    // Data
    config,
    products: products || [],
    categories: categories || [],
    
    // Loading states
    isLoading: configLoading || productsLoading || categoriesLoading,
    configLoading,
    productsLoading,
    categoriesLoading,
    
    // Computed values
    storeConfig,
    availableCategories,
    getCategoryName,
    
    // Store status
    isStoreEnabled: storeConfig.isStoreEnabled,
    appearance: storeConfig.appearance,
  };
}
