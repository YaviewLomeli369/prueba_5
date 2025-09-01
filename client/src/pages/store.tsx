import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingCart, Heart, Search, Plus, Minus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteConfig, Product, ProductCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";
import { Spinner } from "@/components/ui/spinner";

export default function Store() {
  // --- Estados ---
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // --- Consultas ---
  const { data: config } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/store/products"],
  });

  const { data: categories } = useQuery<ProductCategory[]>({
    queryKey: ["/api/store/categories"],
  });

  // --- Mutación carrito ---
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const product = products?.find(p => p.id === productId);
      if (!product) throw new Error("Producto no encontrado");
      setCart(prev => {
        const existing = prev.find(item => item.product.id === productId);
        if (existing) {
          return prev.map(item =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
      return product;
    },
    onSuccess: (product) => {
      toast({
        title: "Producto agregado",
        description: `${product.name} fue agregado al carrito.`,
      });
    },
  });

  // --- Configuración tienda ---
  const configData = config?.config as any;
  const modules = configData?.frontpage?.modulos || {};
  const isStoreEnabled = modules.tienda?.activo;

  // --- Helpers ---
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        toast({ title: "Eliminado de favoritos", description: "Producto eliminado de tus favoritos" });
      } else {
        newFavorites.add(productId);
        toast({ title: "Agregado a favoritos", description: "Producto agregado a tus favoritos" });
      }
      return newFavorites;
    });
  };

  const getCategoryName = (categoryId: string) => {
    if (categoryId === "all") return "Todas las categorías";
    return categories?.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setProductQuantity(1);
  };

  const addToCartFromModal = () => {
    if (selectedProduct) {
      addToCartMutation.mutate({ productId: selectedProduct.id, quantity: productQuantity });
      setSelectedProduct(null);
      setProductQuantity(1);
    }
  };

  const availableCategories = ["all", ...(categories?.map(cat => cat.id) || [])];

  // --- Filtrado de productos con useMemo para optimización ---
  const filteredProducts = useMemo(() => {
    return products?.filter(p => {
      if (!p.isActive) return false;
      const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchesSearch =
        searchTerm === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      return matchesCategory && matchesSearch;
    }) || [];
  }, [products, selectedCategory, searchTerm]);

  const cartTotal = cart.reduce((sum, item) => sum + ((item.product.price / 100) * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    localStorage.setItem('checkoutItems', JSON.stringify(cart));
    setLocation("/checkout");
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Reset states when component unmounts (navigation away)
  useEffect(() => {
    return () => {
      setSelectedProduct(null);
      setIsCartOpen(false);
      setProductQuantity(1);
    };
  }, []);

  // Reset search and filters when products change
  useEffect(() => {
    if (products && products.length > 0) {
      const validCategories = categories?.map(cat => cat.id) || [];
      if (!validCategories.includes(selectedCategory) && selectedCategory !== "all") {
        setSelectedCategory("all");
      }
    }
  }, [products, categories]);

  // --- UI principal ---
  if (!isStoreEnabled) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnimatedSection>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Tienda</h1>
          <p className="text-xl text-muted-foreground">La tienda no está disponible en este momento.</p>
        </div>
      </AnimatedSection>
      <Footer />
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnimatedSection>
        <div className="container mx-auto px-4 py-16 flex flex-col items-center space-y-4">
          <Spinner size="lg" className="text-primary" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Cargando productos...</h2>
            <p className="text-sm text-muted-foreground">Por favor espere mientras cargamos la tienda.</p>
          </div>
        </div>
      </AnimatedSection>
      <Footer />
    </div>
  );

  const appearance = configData?.appearance || {};

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundColor: appearance.backgroundColor || "inherit",
        color: appearance.textColor || "inherit",
        fontFamily: appearance.fontFamily || "inherit",
      }}
    >
      <SEOHead title="Tienda - Productos en línea" description="Descubre nuestra colección de productos. Envío gratis en pedidos superiores a $500." />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header y filtros */}
        <AnimatedSection>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: appearance.textColor || "#111111", fontFamily: appearance.fontFamily || "inherit" }}>Tienda</h1>
              <p className="text-xl" style={{ color: appearance.textColor || "#666666", fontFamily: appearance.fontFamily || "inherit" }}>Descubre nuestra colección de productos</p>
            </div>

            {/* Botón Carrito */}
            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" /> Carrito ({cart.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Carrito de compras</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Tu carrito está vacío</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between space-x-4">
                          <div className="flex-1">
                            <h4 className="font-medium line-clamp-1">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${(item.product.price / 100).toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.product.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-semibold">
                            ${((item.product.price / 100) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button className="w-full" onClick={handleCheckout}>Proceder al Checkout</Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
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
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                {availableCategories.map(catId => (
                  <SelectItem key={catId} value={catId}>{getCategoryName(catId)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AnimatedSection>

        {/* Grid de productos */}
        <AnimatedSection delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <AnimatedSection key={product.id} delay={0.1 * (index % 8)}>
                <Card
                  className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => openProductModal(product)}
                >
                  <div className="relative">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
                      <Badge variant="destructive" className="absolute top-2 right-2">¡Pocas unidades!</Badge>
                    )}
                    {product.stock === 0 && (
                      <Badge variant="secondary" className="absolute top-2 right-2">Agotado</Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 p-1"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      >
                        <Heart className={`h-4 w-4 ${favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                      </Button>
                    </div>
                    {product.categoryId && <Badge variant="outline" className="w-fit">{getCategoryName(product.categoryId)}</Badge>}
                  </CardHeader>

                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-bold text-primary">${(product.price / 100).toFixed(2)}</span>
                      <Button
                        onClick={(e) => { e.stopPropagation(); addToCartMutation.mutate({ productId: product.id }); }}
                        disabled={(product.stock !== null && product.stock === 0) || addToCartMutation.isPending}
                        className="gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" /> Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* Modal Producto */}
        <Dialog 
          open={!!selectedProduct} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(null);
              setProductQuantity(1);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  {selectedProduct.images?.map((img, idx) => (
                    <img key={idx} src={img} alt={`${selectedProduct.name} ${idx + 1}`} className="w-full h-64 object-cover rounded-lg" />
                  ))}
                </div>
                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-primary">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">${(selectedProduct.price / 100).toFixed(2)}</span>
                      {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                        <span className="text-lg text-muted-foreground line-through">${(selectedProduct.comparePrice / 100).toFixed(2)}</span>
                      )}
                    </div>
                    {selectedProduct.categoryId && <Badge variant="outline">{getCategoryName(selectedProduct.categoryId)}</Badge>}
                    {selectedProduct.tags?.length > 0 && <div className="flex flex-wrap gap-1">{selectedProduct.tags.map((tag, idx) => <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>)}</div>}
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                    {selectedProduct.stock !== null && <p className="text-sm"><span className="font-medium">Stock disponible:</span> {selectedProduct.stock}</p>}
                  </div>

                  {/* Cantidad y agregar */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="sm" onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}><Minus className="h-4 w-4" /></Button>
                      <span className="px-4 py-2 border-x">{productQuantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setProductQuantity(selectedProduct.stock !== null ? Math.min(productQuantity + 1, selectedProduct.stock) : productQuantity + 1)
                        }
                        disabled={selectedProduct.stock !== null && productQuantity >= selectedProduct.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={addToCartFromModal} className="flex-1" disabled={(selectedProduct.stock !== null && selectedProduct.stock === 0) || addToCartMutation.isPending}>
                      <ShoppingCart className="h-4 w-4 mr-2" /> Agregar al carrito
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredProducts.length === 0 && (
          <AnimatedSection delay={0.2}>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all" ? "No se encontraron productos que coincidan con los filtros." : "Actualmente no tenemos productos en stock."}
              </p>
              {(searchTerm || selectedCategory !== "all") && (
                <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </AnimatedSection>
        )}
      </div>

      <Footer />
    </div>
  );
}
