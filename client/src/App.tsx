import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { useEffect, useRef } from "react";
import { InlineEditor } from "@/components/inline-editor/InlineEditor";
import { useTheme } from "@/hooks/use-theme";
import { ModuleRoute } from "@/components/module-route";
import { LoadingPage } from "@/components/loading-page";
import type { SiteConfig } from "@shared/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

// Public pages
import Home from "@/pages/home";
import Testimonials from "@/pages/testimonials";
import Faqs from "@/pages/faqs";
import Contact from "@/pages/contact";
import Store from "@/pages/store";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Reservations from "@/pages/reservations";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import CreateAdmin from "@/pages/auth/create-admin";
import Setup from "@/pages/setup";
import Profile from "@/pages/profile";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import ShippingInfo from "@/pages/shipping-info";
import OrderTracking from "@/pages/order-tracking";
import AvisoPrivacidad from "@/pages/aviso-privacidad";
import Conocenos from "@/pages/Conocenos";
import Servicios from "@/pages/Servicios";
import TiendaPrueba from "@/pages/tienda-prueba";


// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminModules from "@/pages/admin/modules";
import AdminTestimonials from "@/pages/admin/testimonials";
import AdminFaqs from "@/pages/admin/faqs";
import AdminContact from "@/pages/admin/contact";
import AdminStore from "@/pages/admin/store";
import AdminUsers from "@/pages/admin/users";
import AdminSections from "@/pages/admin/sections";
import AdminAppearance from "@/pages/admin/appearance";
import AdminReservations from "@/pages/admin/reservations";
import AdminReservationSettings from "@/pages/admin/reservation-settings";
import AdminPayments from "@/pages/admin/payments";
import AdminBlog from "@/pages/admin/blog";
import AdminOrders from "@/pages/admin/orders";
import AdminEmailConfig from "@/pages/admin/email-config";
import AdminInventory from "@/pages/admin/inventory";
import AdminContactInfo from "@/pages/admin/contact-info";

import NotFound from "@/pages/not-found";

// Create a fresh QueryClient with better mobile handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // Reduced from 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1, // Reduced retries for faster failures
      retryDelay: 1000,
    },
    mutations: {
      retry: 0, // No retries for mutations
    },
  },
});

// Clear problematic cache data on navigation issues
function clearStoreCache() {
  try {
    queryClient.removeQueries({ queryKey: ["/api/store/products"] });
    queryClient.removeQueries({ queryKey: ["/api/store/categories"] });
    queryClient.removeQueries({ queryKey: ["/api/store/stats"] });
    queryClient.removeQueries({ queryKey: ["/api/store/orders"] });
    queryClient.removeQueries({ queryKey: ["/api/store/customers"] });
    console.log("Store cache cleared successfully");
  } catch (error) {
    console.warn("Error clearing store cache:", error);
  }
}

// Global navigation fix component
function NavigationFix() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearStoreCache();
      }
    };

    const handleBeforeUnload = () => {
      clearStoreCache();
    };

    const handlePopState = () => {
      // Clear store cache on back/forward navigation
      setTimeout(clearStoreCache, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}

function Router() {
  const appKeyRef = useRef(`app-${Date.now()}`);

  // Apply theme dynamically
  useTheme();

  // Load the site configuration first to prevent 404 flashes
  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on mobile
    retry: 1, // Reduce retry attempts
  });

  // Enhanced navigation cleanup for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Clear any pending states when page becomes hidden
        document.body.classList.remove('modal-open', 'overflow-hidden');
        document.body.style.overflow = '';
      }
    };

    const handleBeforeUnload = () => {
      // Final cleanup before page unload
      document.body.style.overflow = '';
      sessionStorage.removeItem('navigationState');
    };

    const handleTouchStart = () => {
      // Ensure touch events work properly on mobile
      document.body.style.touchAction = 'auto';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // Show loading while the main configuration loads
  if (isLoading) {
    return <LoadingPage key={`${appKeyRef.current}-loading`} />;
  }

  return (
    <QueryClientProvider client={queryClient} key={`${appKeyRef.current}-query`}>
      <NavigationFix />
      <div className="min-h-screen bg-background text-foreground">
        <Switch key={`${appKeyRef.current}-switch`}>
          {/* Public routes with unique keys for proper re-rendering */}
          <Route path="/" component={() => <Home key={`home-${Date.now()}`} />} />
          <ModuleRoute path="/testimonials" component={() => <Testimonials key={`testimonials-${Date.now()}`} />} moduleKey="testimonios" />
          <ModuleRoute path="/faqs" component={() => <Faqs key={`faqs-${Date.now()}`} />} moduleKey="faqs" />
          <ModuleRoute path="/contact" component={() => <Contact key={`contact-${Date.now()}`} />} moduleKey="contacto" />
          <ModuleRoute path="/store" component={() => <Store key={`store-${Date.now()}`} />} moduleKey="tienda" />
          <ModuleRoute path="/blog" component={() => <Blog key={`blog-${Date.now()}`} />} moduleKey="blog" />
          <Route path="/blog/:slug" component={(params) => <BlogPost key={`blog-post-${params.slug}-${Date.now()}`} />} />
          <ModuleRoute path="/reservations" component={() => <Reservations key={`reservations-${Date.now()}`} />} moduleKey="reservas" />
          <Route path="/login" component={() => <Login key={`login-${Date.now()}`} />} />
          <Route path="/register" component={() => <Register key={`register-${Date.now()}`} />} />
          <Route path="/create-admin" component={() => <CreateAdmin key={`create-admin-${Date.now()}`} />} />
          <Route path="/setup" component={() => <Setup key={`setup-${Date.now()}`} />} />
          <Route path="/profile" component={() => <Profile key={`profile-${Date.now()}`} />} />
          <Route path="/shipping-info" component={() => <ShippingInfo key={`shipping-info-${Date.now()}`} />} />
          <Route path="/checkout" component={() => <Checkout key={`checkout-${Date.now()}`} />} />
          <Route path="/checkout/success" component={() => <CheckoutSuccess key={`checkout-success-${Date.now()}`} />} />
          <Route path="/track-order" component={() => <OrderTracking key={`order-tracking-${Date.now()}`} />} />
          <Route path="/aviso-privacidad" component={() => <AvisoPrivacidad key={`aviso-privacidad-${Date.now()}`} />} />
          <Route path="/conocenos" component={() => <Conocenos key={`conocenos-${Date.now()}`} />} />
          <Route path="/servicios" component={() => <Servicios key={`servicios-${Date.now()}`} />} />
          <Route path="/tienda-prueba" component={() => <TiendaPrueba key={`tienda-prueba-${Date.now()}`} />} />

          {/* Admin routes with unique keys */}
          <Route path="/admin" component={() => <AdminDashboard key={`admin-dashboard-${Date.now()}`} />} />
          <Route path="/admin/modules" component={() => <AdminModules key={`admin-modules-${Date.now()}`} />} />
          <Route path="/admin/testimonials" component={() => <AdminTestimonials key={`admin-testimonials-${Date.now()}`} />} />
          <Route path="/admin/faqs" component={() => <AdminFaqs key={`admin-faqs-${Date.now()}`} />} />
          <Route path="/admin/contact" component={() => <AdminContact key={`admin-contact-${Date.now()}`} />} />
          <Route path="/admin/store" component={() => <AdminStore key={`admin-store-${Date.now()}`} />} />
          <Route path="/admin/inventory" component={() => <AdminInventory key={`admin-inventory-${Date.now()}`} />} />
          <Route path="/admin/users" component={() => <AdminUsers key={`admin-users-${Date.now()}`} />} />
          <Route path="/admin/sections" component={() => <AdminSections key={`admin-sections-${Date.now()}`} />} />
          <Route path="/admin/appearance" component={() => <AdminAppearance key={`admin-appearance-${Date.now()}`} />} />
          <Route path="/admin/reservations" component={() => <AdminReservations key={`admin-reservations-${Date.now()}`} />} />
          <Route path="/admin/reservation-settings" component={() => <AdminReservationSettings key={`admin-reservation-settings-${Date.now()}`} />} />
          <Route path="/admin/payments" component={() => <AdminPayments key={`admin-payments-${Date.now()}`} />} />
          <Route path="/admin/blog" component={() => <AdminBlog key={`admin-blog-${Date.now()}`} />} />
          <Route path="/admin/orders" component={() => <AdminOrders key={`admin-orders-${Date.now()}`} />} />
          <Route path="/admin/email-config" component={() => <AdminEmailConfig key={`admin-email-config-${Date.now()}`} />} />
          <Route path="/admin/contact-info" component={() => <AdminContactInfo key={`admin-contact-info-${Date.now()}`} />} />

          {/* 404 fallback */}
          <Route component={() => <NotFound key={`not-found-${Date.now()}`} />} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

function App() {
  const appInstanceRef = useRef(`app-instance-${Date.now()}`);

  return (
    <QueryClientProvider client={queryClient} key={`${appInstanceRef.current}-query`}>
      <TooltipProvider key={`${appInstanceRef.current}-tooltip`}>
        <Router key={`${appInstanceRef.current}-router`} />
        <InlineEditor
          value=""
          onSave={async () => {}}
          key={`${appInstanceRef.current}-editor`}
        />
        <WhatsAppWidget key={`${appInstanceRef.current}-whatsapp`} />
        <Toaster key={`${appInstanceRef.current}-toaster`} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;