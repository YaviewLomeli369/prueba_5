import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";

export default function Contact() {
  // ✅ ALL HOOKS AT THE TOP
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  // ✅ QUERIES
  const { data: config, isLoading: configLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["/api/contact/info"],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ✅ MUTATIONS
  const submitMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("/api/contact", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "Gracias por contactarnos. Te responderemos pronto.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  // ✅ COMPUTED VALUES
  const { appearance, isContactEnabled } = useMemo(() => {
    if (!config) return { appearance: {}, isContactEnabled: false };

    const configData = config?.config as any;
    const modules = configData?.frontpage?.modulos || {};
    const appearance = configData?.appearance || {};

    return {
      appearance,
      isContactEnabled: modules.contacto?.activo !== false,
    };
  }, [config]);

  // ✅ HANDLERS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      submitMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ LOADING STATE - AFTER ALL HOOKS
  if (configLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center navbar-fixed-body">
          <p>Cargando información de contacto...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isContactEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <AnimatedSection>
          <div className="container mx-auto px-4 py-16 text-center navbar-fixed-body">
            <h1 className="text-4xl font-bold mb-4">Contacto</h1>
            <p className="text-xl text-muted-foreground">
              El módulo de contacto no está disponible en este momento.
            </p>
          </div>
        </AnimatedSection>
        <Footer />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundColor: appearance.backgroundColor || "inherit",
        color: appearance.textColor || "inherit",
        fontFamily: appearance.fontFamily || "inherit",
      }}
    >
      <SEOHead title="Contacto - Ponte en contacto con nosotros" description="¿Tienes preguntas? Contáctanos y te ayudaremos con lo que necesites." />
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: appearance.textColor || "#111111" }}>Contacto</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ¿Tienes preguntas? Contáctanos y te ayudaremos con lo que necesites.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulario */}
          <AnimatedSection delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Envíanos un mensaje</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Teléfono</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Tu número de teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Asunto</label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="Asunto del mensaje"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mensaje *</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Información de contacto */}
          <AnimatedSection delay={0.4}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">{contactInfo.email}</p>
                      </div>
                    </div>
                  )}

                  {contactInfo?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Teléfono</p>
                        <p className="text-muted-foreground">{contactInfo.phone}</p>
                      </div>
                    </div>
                  )}

                  {contactInfo?.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Dirección</p>
                        <p className="text-muted-foreground">{contactInfo.address}</p>
                      </div>
                    </div>
                  )}

                  {contactInfo?.hours && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Horarios</p>
                        <p className="text-muted-foreground">{contactInfo.hours}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mapa o información adicional */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">¿Cómo podemos ayudarte?</h3>
                  <p className="text-muted-foreground">
                    Estamos aquí para responder tus preguntas y ayudarte con cualquier consulta.
                    No dudes en contactarnos por cualquier medio.
                  </p>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <Footer />
    </div>
  );
}