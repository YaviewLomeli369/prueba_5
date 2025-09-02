import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { SiteConfig } from "@shared/schema";

import logoSvg from "/imgs/nova_logos_v_1.svg";

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
import { ShoppingCart, User, LogOut, Settings, Menu } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1075);
  const [isScrolled, setIsScrolled] = useState(false);
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
    { href: "/blog", label: "Blog", moduleKey: "blog" },
    { href: "/reservations", label: "Reservas", moduleKey: "reservas" },
    { href: "/conocenos", label: "Conócenos", always: true },
    { href: "/servicios", label: "Servicios", always: true }
  ].filter(item => item.always || (item.moduleKey && modules[item.moduleKey]?.activo));

  const handleNavigation = useCallback((href: string) => {
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    document.body.classList.remove('modal-open', 'overflow-hidden');
    document.body.style.overflow = '';

    if (href === location) {
      const refreshHref = `${href}?refresh=${Date.now()}`;
      window.history.replaceState(null, '', href);
      setLocation(refreshHref);
      setTimeout(() => setLocation(href), 50);
    } else {
      setLocation(href);
    }

    setTimeout(() => { isNavigatingRef.current = false; }, 300);
  }, [location, setLocation]);

  useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth > 1075;

      // Solo cerrar menú si pasamos a desktop
      if (isMobileMenuOpen && newIsDesktop) {
        setIsMobileMenuOpen(false);
      }

      setIsDesktop(newIsDesktop);
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobileMenuOpen]);

  const NavLink = useCallback(({ href, children, className, onClick }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div
      className={`cursor-pointer ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick();
        handleNavigation(href);
      }}
      style={isNavigatingRef.current ? { pointerEvents: 'none', opacity: 0.6 } : {}}
    >
      {children}
    </div>
  ), [handleNavigation]);

  return (
    //<nav className="navbar-fixed bg-white shadow-sm border-b border-gray-200">
    //<nav className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 ${isScrolled ? 'navbar-scrolled' : ''}`} key={navRef.current}>
    <nav className={`navbar-fixed bg-white shadow-sm border-b border-gray-200 ${isScrolled ? 'navbar-scrolled' : ''}`} key={navRef.current}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Desktop Nav */}
          <div className="flex items-center space-x-8">
            <NavLink href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                {appearance.logoUrl ? (
                  <img src={logoSvg} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-white font-bold text-sm">{appearance.brandName?.charAt(0) || "S"}</span>
                )}
              </div>
              <span className="hidden sm:block text-xl font-semibold text-gray-900">
                {appearance.brandName || "Sistema Modular"}
              </span>
            </NavLink>

            <div className={`items-center space-x-6 ${isDesktop ? 'flex' : 'hidden'}`}>
              {navItems.map(item => (
                <NavLink key={`${item.href}-${navRef.current}`} href={item.href} className={`text-sm font-medium transition-colors hover:text-primary ${location === item.href ? "text-primary" : "text-gray-700"}`}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right-side buttons */}
          <div className="flex items-center space-x-2">
            {modules.tienda?.activo && (
              <NavLink href="/store" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-accent hover:text-accent-foreground">
                <ShoppingCart className="h-4 w-4" />
              </NavLink>
            )}

            {/* Desktop Auth */}
            <div className={`items-center space-x-2 ${isDesktop ? 'flex' : 'hidden'}`}>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user?.username?.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.username}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                      <User className="mr-2 h-4 w-4" /> <span>Perfil</span>
                    </DropdownMenuItem>
                    {(user?.role === "admin" || user?.role === "superuser") && (
                      <DropdownMenuItem onClick={() => handleNavigation("/admin")}>
                        <Settings className="mr-2 h-4 w-4" /> <span>Administración</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" /> <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <NavLink href="/login">Iniciar Sesión</NavLink>
                  <NavLink href="/register">Registrarse</NavLink>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <div className={`inline-flex items-center justify-center h-9 px-3 cursor-pointer ${isDesktop ? 'hidden' : 'block'}`}>
                  <Menu className="h-5 w-5" />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
                <SheetHeader className="flex-shrink-0">
                  <SheetTitle>Navegación</SheetTitle>
                  <SheetDescription>{appearance.brandName || "Sistema Modular"}</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6 overflow-y-auto flex-1 touch-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                  {navItems.map(item => (
                    <NavLink key={`mobile-${item.href}-${navRef.current}`} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-medium p-2 rounded-md ${location===item.href ? "text-primary bg-primary/10":"text-gray-700"}`}>
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="border-t pt-4">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50 rounded-md">
                          <p className="font-medium">{user?.username}</p>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                        <NavLink href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 p-2 rounded-md hover:text-primary">
                          <User className="h-4 w-4" /><span>Perfil</span>
                        </NavLink>
                        {(user?.role === "admin" || user?.role === "superuser") && (
                          <NavLink href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 p-2 rounded-md hover:text-primary">
                            <Settings className="h-4 w-4" /><span>Administración</span>
                          </NavLink>
                        )}
                        <div onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center space-x-2 text-red-600 hover:text-red-700 p-2 rounded-md cursor-pointer">
                          <LogOut className="h-4 w-4" /><span>Cerrar Sesión</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <NavLink href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                          Iniciar Sesión
                        </NavLink>
                        <NavLink href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90">
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
