import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { SiteConfig } from "@shared/schema";

// Logo en imgs
import logoSvg from "/imgs/nova_logos_v_1.svg";
import logoSvg2 from "/imgs/nova_logos_v_2.svg";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShoppingCart, User, LogOut, Settings, Menu, X, Store, MessageCircle } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef(`navbar-${Date.now()}`);
  const isNavigatingRef = useRef(false);

  const { data: config } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const configData = config?.config as any;
  const modules = configData?.frontpage?.modulos || {};
  const appearance = configData?.appearance || {};

  const navItems = [
    { href: "/", label: "Inicio", always: true },
    { href: "/testimonials", label: "Testimonios", moduleKey: "testimonios" },
    { href: "/faqs", label: "FAQs", moduleKey: "faqs" },
    { href: "/contact", label: "Contacto", moduleKey: "contacto" },
    { href: "/store", label: "Tienda", moduleKey: "tienda" },
    { href: "/tienda-prueba", label: "Tienda Prueba", always: true },
    { href: "/blog", label: "Blog", moduleKey: "blog" },
    { href: "/reservations", label: "Reservas", moduleKey: "reservas" },
    { href: "/conocenos", label: "Conócenos", always: true },
    { href: "/servicios", label: "Servicios", always: true }
  ].filter(item => item.always || (item.moduleKey && modules[item.moduleKey]?.activo));

  // Enhanced navigation handler with proper cleanup
  const handleNavigation = useCallback((href: string, closeMenu = true) => {
    if (isNavigatingRef.current) return;

    try {
      isNavigatingRef.current = true;

      // Close mobile menu immediately
      if (closeMenu) {
        setIsMobileMenuOpen(false);
      }

      // Clear any modal states before navigation
      document.body.classList.remove('modal-open', 'overflow-hidden');
      document.body.style.overflow = '';

      // Handle navigation
      if (href === location) {
        // If same route, force refresh by adding timestamp
        const refreshHref = `${href}?refresh=${Date.now()}`;
        window.history.replaceState(null, '', href); // Clean URL
        setLocation(refreshHref);
        setTimeout(() => setLocation(href), 50);
      } else {
        setLocation(href);
      }

    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct navigation
      window.location.href = href;
    } finally {
      // Reset navigation flag after a delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);
    }
  }, [location, setLocation]);

  // Mobile menu cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMobileMenuOpen(false);
      document.body.classList.remove('modal-open', 'overflow-hidden');
      document.body.style.overflow = '';
    };
  }, []);

  // Enhanced link component with proper event handling
  const NavLink = useCallback(({ href, children, className, onClick }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <button
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick();
        handleNavigation(href);
      }}
      disabled={isNavigatingRef.current}
    >
      {children}
    </button>
  ), [handleNavigation]);

  return (
    <nav
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
      key={navRef.current}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                {appearance.logoUrl ? (
                  <img src={logoSvg} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {appearance.brandName?.charAt(0) || "S"}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-xl font-semibold text-gray-900">
                {appearance.brandName || "Sistema Modular"}
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <NavLink
                  key={`${item.href}-${navRef.current}`}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === item.href
                      ? "text-primary"
                      : "text-gray-700"
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Shopping Cart - Only show if store module is active */}
            {modules.tienda?.activo && (
              <NavLink href="/store">
                <Button variant="ghost" size="sm" className="pointer-events-none">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </NavLink>
            )}

            {/* Desktop Auth */}
            <div className="hidden sm:flex items-center space-x-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.role}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    {user?.role === "admin" || user?.role === "superuser" ? (
                      <DropdownMenuItem onClick={() => handleNavigation("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Administración</span>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <NavLink href="/login">
                    <Button variant="ghost" size="sm" className="pointer-events-none">
                      Iniciar Sesión
                    </Button>
                  </NavLink>
                  <NavLink href="/register">
                    <Button size="sm" className="pointer-events-none">
                      Registrarse
                    </Button>
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Navegación</SheetTitle>
                  <SheetDescription className="text-left">
                    {appearance.brandName || "Sistema Modular"}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Navigation Links */}
                  {navItems.map((item) => (
                    <NavLink
                      key={`mobile-${item.href}-${navRef.current}`}
                      href={item.href}
                      className={`text-lg font-medium transition-colors hover:text-primary p-2 rounded-md ${
                        location === item.href
                          ? "text-primary bg-primary/10"
                          : "text-gray-700"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="border-t pt-4">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50 rounded-md">
                          <p className="font-medium">{user?.username}</p>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                        </div>
                        <NavLink
                          href="/profile"
                          className="flex items-center space-x-2 text-gray-700 hover:text-primary p-2 rounded-md"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Perfil</span>
                        </NavLink>
                        {user?.role === "admin" || user?.role === "superuser" ? (
                          <NavLink
                            href="/admin"
                            className="flex items-center space-x-2 text-gray-700 hover:text-primary p-2 rounded-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Administración</span>
                          </NavLink>
                        ) : null}
                        <button
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center space-x-2 text-red-600 hover:text-red-700 p-2 rounded-md w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <NavLink
                          href="/login"
                          className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Iniciar Sesión
                        </NavLink>
                        <NavLink
                          href="/register"
                          className="block w-full text-center py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Registrarse
                        </NavLink>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}