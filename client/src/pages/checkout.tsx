import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, CreditCard, ArrowLeft, Package } from "lucide-react";
import { useLocation } from "wouter";

// Load Stripe
let stripePromise: Promise<any> | null = null;

function CheckoutForm({ cartItems, customerInfo, shippingAddress, paymentIntentId }: { 
  cartItems: any[]; 
  customerInfo: any; 
  shippingAddress: any;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Error en el pago",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Payment succeeded - create order
        try {
          await apiRequest("/api/store/checkout", {
            method: "POST",
            body: JSON.stringify({
              paymentIntentId,
              customerInfo,
              shippingAddress,
              orderItems: cartItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
              }))
            })
          });

          // Clear cart and checkout info
          localStorage.removeItem('checkoutItems');
          localStorage.removeItem('checkout-info');
          
          toast({
            title: "¡Pago exitoso!",
            description: "Tu pedido ha sido procesado correctamente"
          });
          setLocation("/checkout/success");
        } catch (orderError: any) {
          console.error("Order creation error:", orderError);
          toast({
            title: "Error",
            description: `El pago se procesó pero hubo un problema creando el pedido: ${orderError.message || 'Error desconocido'}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error procesando el pago",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotal = () => {
    const total = cartItems.reduce((sum, item) => {
      const price = item.product.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    console.log("Total calculated:", total, "from items:", cartItems);
    return total;
  };

  const formatPrice = (price: number, currency = 'MXN') => {
    return (price / 100).toLocaleString('es-MX', {
      style: 'currency',
      currency: currency
    });
  };

  const getCurrency = () => {
    return cartItems.length > 0 ? cartItems[0].product.currency || 'MXN' : 'MXN';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/shipping-info')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        
        <div className="text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold mb-2">Finalizar Compra</h1>
          <p className="text-muted-foreground">
            Completa tu pago de forma segura
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Resumen del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(item.product.price * item.quantity, item.product.currency)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(getTotal(), getCurrency())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de Envío</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>{shippingAddress.firstName} {shippingAddress.lastName}</strong></p>
                <p>{shippingAddress.address1}</p>
                {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                <p>{shippingAddress.country}</p>
                {shippingAddress.phone && <p>Tel: {shippingAddress.phone}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentElement />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={!stripe || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Pagar ${formatPrice(getTotal(), getCurrency())}`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load cart items and checkout info from localStorage
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);

  useEffect(() => {
    // Get cart items
    const savedCartItems = localStorage.getItem('checkoutItems');
    if (savedCartItems) {
      setCartItems(JSON.parse(savedCartItems));
    }

    // Get customer info and shipping address
    const checkoutData = localStorage.getItem('checkout-info');
    if (checkoutData) {
      const data = JSON.parse(checkoutData);
      setCustomerInfo(data.customerInfo);
      setShippingAddress(data.shippingAddress);
    } else {
      // Redirect to shipping info if no data found
      toast({
        title: "Información incompleta",
        description: "Completa la información de envío primero",
        variant: "destructive"
      });
      setLocation('/shipping-info');
      return;
    }
  }, [setLocation, toast]);

  // Get payment configuration
  const { data: paymentConfig } = useQuery<{stripePublicKey: string}>({
    queryKey: ["/api/payment-config/public"],
  });

  // Initialize Stripe
  useEffect(() => {
    if (paymentConfig?.stripePublicKey) {
      stripePromise = loadStripe(paymentConfig.stripePublicKey);
    }
  }, [paymentConfig]);

  // Create payment intent with proper error handling
  const { data: paymentIntent, isLoading: paymentLoading, error: paymentError } = useQuery({
    queryKey: ["/api/create-payment-intent", cartItems],
    queryFn: async () => {
      if (cartItems.length === 0) {
        throw new Error("No hay productos en el carrito");
      }
      
      const total = cartItems.reduce((sum: number, item: any) => {
        const price = item.product.price || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
      }, 0);
      
      if (total <= 0) {
        throw new Error("El total del pedido debe ser mayor a 0");
      }
      
      const currency = cartItems[0]?.product?.currency || 'MXN';
      
      console.log("Creating payment intent:", { total, currency, items: cartItems.length });
      
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total / 100, // Convert to decimal for backend
          currency: currency.toLowerCase(),
          cartItems: cartItems.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Payment intent creation failed:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Payment intent created successfully:", result);
      return result;
    },
    enabled: cartItems.length > 0 && !!paymentConfig?.stripePublicKey && !!customerInfo && !!shippingAddress,
    retry: 3,
    retryDelay: 1000
  });

  // Show loading while data is being prepared
  if (!customerInfo || !shippingAddress || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  // Check payment config first
  if (!paymentConfig?.stripePublicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: Configuración de pagos no disponible</p>
          <Button onClick={() => setLocation('/shipping-info')}>
            Volver atrás
          </Button>
        </div>
      </div>
    );
  }

  // Show payment error if any
  if (paymentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al inicializar el pago: {paymentError.message}</p>
          <Button onClick={() => setLocation('/shipping-info')}>
            Volver atrás
          </Button>
        </div>
      </div>
    );
  }

  // Show loading while payment intent is being created
  if (paymentLoading || !paymentIntent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Iniciando pago...</p>
          <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Elements 
        stripe={stripePromise} 
        options={{ 
          clientSecret: paymentIntent.clientSecret,
          appearance: {
            theme: 'stripe',
          }
        }}
      >
        <CheckoutForm 
          cartItems={cartItems}
          customerInfo={customerInfo}
          shippingAddress={shippingAddress}
          paymentIntentId={paymentIntent.paymentIntentId}
        />
      </Elements>
    </div>
  );
}