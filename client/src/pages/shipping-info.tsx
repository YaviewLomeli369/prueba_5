
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileSafeSelect } from "@/components/ui/mobile-safe-select";
import { ArrowLeft, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export default function ShippingInfoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: "",
    firstName: "",
    lastName: "",
    phone: ""
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "MX",
    phone: ""
  });

  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "MX",
    phone: ""
  });

  const mexicanStates = [
    { value: "Aguascalientes", label: "Aguascalientes" },
    { value: "Baja California", label: "Baja California" },
    { value: "Baja California Sur", label: "Baja California Sur" },
    { value: "Campeche", label: "Campeche" },
    { value: "Chiapas", label: "Chiapas" },
    { value: "Chihuahua", label: "Chihuahua" },
    { value: "Ciudad de México", label: "Ciudad de México" },
    { value: "Coahuila", label: "Coahuila" },
    { value: "Colima", label: "Colima" },
    { value: "Durango", label: "Durango" },
    { value: "Estado de México", label: "Estado de México" },
    { value: "Guanajuato", label: "Guanajuato" },
    { value: "Guerrero", label: "Guerrero" },
    { value: "Hidalgo", label: "Hidalgo" },
    { value: "Jalisco", label: "Jalisco" },
    { value: "Michoacán", label: "Michoacán" },
    { value: "Morelos", label: "Morelos" },
    { value: "Nayarit", label: "Nayarit" },
    { value: "Nuevo León", label: "Nuevo León" },
    { value: "Oaxaca", label: "Oaxaca" },
    { value: "Puebla", label: "Puebla" },
    { value: "Querétaro", label: "Querétaro" },
    { value: "Quintana Roo", label: "Quintana Roo" },
    { value: "San Luis Potosí", label: "San Luis Potosí" },
    { value: "Sinaloa", label: "Sinaloa" },
    { value: "Sonora", label: "Sonora" },
    { value: "Tabasco", label: "Tabasco" },
    { value: "Tamaulipas", label: "Tamaulipas" },
    { value: "Tlaxcala", label: "Tlaxcala" },
    { value: "Veracruz", label: "Veracruz" },
    { value: "Yucatán", label: "Yucatán" },
    { value: "Zacatecas", label: "Zacatecas" }
  ];

  // Función para manejar cambios en customer info de forma segura
  const handleCustomerInfoChange = useCallback((field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  // Función para manejar cambios en shipping address de forma segura
  const handleShippingAddressChange = useCallback((field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  // Función para manejar cambios en billing address de forma segura
  const handleBillingAddressChange = useCallback((field: keyof ShippingAddress, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  // Manejar cambio de estado de envío
  const handleShippingStateChange = useCallback((value: string) => {
    setShippingAddress(prev => ({ ...prev, state: value }));
  }, []);

  // Manejar cambio de estado de facturación
  const handleBillingStateChange = useCallback((value: string) => {
    setBillingAddress(prev => ({ ...prev, state: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName ||
        !shippingAddress.firstName || !shippingAddress.lastName ||
        !shippingAddress.address1 || !shippingAddress.city ||
        !shippingAddress.state || !shippingAddress.zipCode ||
        (billingDifferent && (!billingAddress.firstName || !billingAddress.lastName || 
         !billingAddress.address1 || !billingAddress.city || !billingAddress.state || 
         !billingAddress.zipCode))
    ) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Guardar información en localStorage
      const checkoutData = {
        customerInfo,
        shippingAddress,
        billingAddress: billingDifferent ? billingAddress : shippingAddress,
        timestamp: Date.now()
      };

      localStorage.setItem('checkout-info', JSON.stringify(checkoutData));

      // Redirigir a checkout con un pequeño delay para evitar conflictos
      setTimeout(() => {
        setLocation('/checkout');
      }, 100);
    } catch (error) {
      console.error('Error saving checkout data:', error);
      toast({
        title: "Error",
        description: "Error al guardar la información. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  }, [customerInfo, shippingAddress, billingAddress, billingDifferent, setLocation, toast]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/store')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la Tienda
          </Button>

          <div className="text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold mb-2">Información de Envío</h1>
            <p className="text-gray-500">
              Proporciona tu información de contacto y dirección de envío
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-firstName">Nombre *</Label>
                  <Input
                    id="customer-firstName"
                    value={customerInfo.firstName || ""}
                    onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    autoCapitalize="words"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-lastName">Apellidos *</Label>
                  <Input
                    id="customer-lastName"
                    value={customerInfo.lastName || ""}
                    onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    autoCapitalize="words"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email || ""}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={customerInfo.phone || ""}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dirección de Envío */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dirección de Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping-firstName">Nombre *</Label>
                  <Input
                    id="shipping-firstName"
                    value={shippingAddress.firstName || ""}
                    onChange={(e) => handleShippingAddressChange('firstName', e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    autoCapitalize="words"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipping-lastName">Apellidos *</Label>
                  <Input
                    id="shipping-lastName"
                    value={shippingAddress.lastName || ""}
                    onChange={(e) => handleShippingAddressChange('lastName', e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    autoCapitalize="words"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">Dirección *</Label>
                <Input
                  id="address1"
                  value={shippingAddress.address1 || ""}
                  onChange={(e) => handleShippingAddressChange('address1', e.target.value)}
                  placeholder="Calle y número"
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Dirección 2 (Opcional)</Label>
                <Input
                  id="address2"
                  value={shippingAddress.address2 || ""}
                  onChange={(e) => handleShippingAddressChange('address2', e.target.value)}
                  placeholder="Colonia, edificio, piso, etc."
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city || ""}
                    onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    autoCapitalize="words"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <MobileSafeSelect
                    id="state"
                    value={shippingAddress.state || ""}
                    onChange={handleShippingStateChange}
                    options={mexicanStates}
                    placeholder="Selecciona estado *"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Código Postal *</Label>
                  <Input
                    id="zipCode"
                    value={shippingAddress.zipCode || ""}
                    onChange={(e) => handleShippingAddressChange('zipCode', e.target.value)}
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck={false}
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping-phone">Teléfono de contacto</Label>
                <Input
                  id="shipping-phone"
                  type="tel"
                  value={shippingAddress.phone || ""}
                  onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="tel"
                />
              </div>

              {/* Checkbox para dirección de facturación */}
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="billing-different"
                  checked={billingDifferent}
                  onChange={(e) => setBillingDifferent(e.target.checked)}
                />
                <label htmlFor="billing-different" className="text-sm">
                  ¿La dirección de facturación es diferente?
                </label>
              </div>

              {billingDifferent && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Dirección de Facturación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing-firstName">Nombre *</Label>
                        <Input
                          id="billing-firstName"
                          value={billingAddress.firstName || ""}
                          onChange={(e) => handleBillingAddressChange('firstName', e.target.value)}
                          required={billingDifferent}
                          autoComplete="new-password"
                          autoCorrect="off"
                          spellCheck={false}
                          autoCapitalize="words"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-lastName">Apellidos *</Label>
                        <Input
                          id="billing-lastName"
                          value={billingAddress.lastName || ""}
                          onChange={(e) => handleBillingAddressChange('lastName', e.target.value)}
                          required={billingDifferent}
                          autoComplete="new-password"
                          autoCorrect="off"
                          spellCheck={false}
                          autoCapitalize="words"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-address1">Dirección *</Label>
                      <Input
                        id="billing-address1"
                        value={billingAddress.address1 || ""}
                        onChange={(e) => handleBillingAddressChange('address1', e.target.value)}
                        required={billingDifferent}
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-address2">Dirección 2 (Opcional)</Label>
                      <Input
                        id="billing-address2"
                        value={billingAddress.address2 || ""}
                        onChange={(e) => handleBillingAddressChange('address2', e.target.value)}
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billing-city">Ciudad *</Label>
                        <Input
                          id="billing-city"
                          value={billingAddress.city || ""}
                          onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                          required={billingDifferent}
                          autoComplete="new-password"
                          autoCorrect="off"
                          spellCheck={false}
                          autoCapitalize="words"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-state">Estado *</Label>
                        <MobileSafeSelect
                          id="billing-state"
                          value={billingAddress.state || ""}
                          onChange={handleBillingStateChange}
                          options={mexicanStates}
                          placeholder="Selecciona estado *"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-zipCode">Código Postal *</Label>
                        <Input
                          id="billing-zipCode"
                          value={billingAddress.zipCode || ""}
                          onChange={(e) => handleBillingAddressChange('zipCode', e.target.value)}
                          required={billingDifferent}
                          autoComplete="new-password"
                          autoCorrect="off"
                          spellCheck={false}
                          pattern="[0-9]*"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing-phone">Teléfono de contacto</Label>
                      <Input
                        id="billing-phone"
                        type="tel"
                        value={billingAddress.phone || ""}
                        onChange={(e) => handleBillingAddressChange('phone', e.target.value)}
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck={false}
                        inputMode="tel"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full md:w-auto"
              disabled={false}
            >
              Continuar al Pago
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
