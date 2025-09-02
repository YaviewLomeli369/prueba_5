
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Heart, Search } from "lucide-react";
import type { SiteConfig, Product, ProductCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

export default function TiendaPrueba() {
  const { toast } = useToast();
  
  // Simple state management
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch data with minimal configuration
  const { data: config, isLoading: configLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/store/products"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const { data: categories } = useQuery<ProductCategory[]>({
    queryKey: ["/api/store/categories"],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Computed values
  const storeConfig = useMemo(() => {
    if (!config) return { isStoreEnabled: false, appearance: {} };
    
    const configData = config?.config as any;
    const modules = configData?.frontpage?.modulos || {};
    const appearance = configData?.appearance || {};
    
    return {
      isStoreEnabled: modules.tienda?.activo,
      appearance,
    };
  }, [config]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(p => {
      if (!p.isActive) return false;
      const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchesSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const availableCategories = useMemo(() => {
    return ["all", ...(categories?.map(cat => cat.id) || [])];
  }, [categories]);

  // Simple handlers
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    
    toast({
      title: "Producto agregado",
      description: `${product.name} fue agregado al carrito.`,
    });
  }, [toast]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        toast({ title: "Eliminado de favoritos" });
      } else {
        newFavorites.add(productId);
        toast({ title: "Agregado a favoritos" });
      }
      return newFavorites;
    });
  }, [toast]);

  const getCategoryName = useCallback((categoryId: string) => {
    if (categoryId === "all") return "Todas las categorías";
    return categories?.find(cat => cat.id === categoryId)?.name || categoryId;
  }, [categories]);

  // Loading state
  const isLoading = configLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Cargando tienda prueba...</h2>
            <p className="text-sm text-muted-foreground">Por favor espere.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!storeConfig.isStoreEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Tienda Prueba</h1>
          <p className="text-xl text-muted-foreground">La tienda no está disponible en este momento.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const { appearance } = storeConfig;

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundColor: appearance.backgroundColor || "inherit",
        color: appearance.textColor || "inherit",
        fontFamily: appearance.fontFamily || "inherit",
      }}
    >
      <SEOHead 
        title="Tienda Prueba - Productos en línea" 
        description="Página de tienda de prueba para verificar navegación móvil." 
      />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tienda Prueba</h1>
          <p className="text-xl text-muted-foreground">Versión de prueba para móviles</p>
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="outline">Total productos: {filteredProducts.length}</Badge>
            <Badge variant="outline">En carrito: {cart.length}</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map(catId => (
                <SelectItem key={catId} value={catId}>
                  {getCategoryName(catId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" 
                ? "No se encontraron productos que coincidan con los filtros." 
                : "Actualmente no tenemos productos en stock."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="h-full overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                  )}
                  {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      ¡Pocas unidades!
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Agotado
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 p-1"
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          favorites.has(product.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-gray-400"
                        }`} 
                      />
                    </Button>
                  </div>
                  {product.categoryId && (
                    <Badge variant="outline" className="w-fit">
                      {getCategoryName(product.categoryId)}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col">
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold text-primary">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.stock !== null && product.stock === 0}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
            <h4 className="font-semibold mb-2">Carrito ({cart.length} productos)</h4>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span className="truncate">{item.product.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>
                  ${cart.reduce((sum, item) => 
                    sum + ((item.product.price / 100) * item.quantity), 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
