import { useState , useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestimonialCard } from "@/components/testimonial-card";
import { TestimonialCardEditable } from "@/components/testimonial-card-editable";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Testimonial, SiteConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import AnimatedSection from "@/components/AnimatedSection";
import { Spinner } from "@/components/ui/spinner";

export default function Testimonials() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    content: "",
    rating: 5,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const isSuperuser = user?.role === 'superuser';

  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/testimonials", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      setIsCreateOpen(false);
      setFormData({ name: "", email: "", content: "", rating: 5 });
      toast({
        title: "¡Gracias por tu testimonial!",
        description: "Tu testimonial ha sido enviado y está pendiente de aprobación.",
      });
    },
  });

  const { data: config, isLoading: configLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
  });

  const { appearance, frontpage, modules } = useMemo(() => {
    const configData = config?.config as any;
    return {
      appearance: configData?.appearance || {},
      frontpage: configData?.frontpage || {},
      modules: configData?.frontpage?.modulos || {},
    };
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTestimonialMutation.mutate(formData);
  };

  const approvedTestimonials = testimonials?.filter(t => t.isApproved) || [];
  const featuredTestimonials = approvedTestimonials.filter(t => t.isFeatured);
  const regularTestimonials = approvedTestimonials.filter(t => !t.isFeatured);

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundColor: appearance.backgroundColor || "inherit",
        color: appearance.textColor || "inherit",
        fontFamily: appearance.fontFamily || "inherit",
      }}
    >
      <Navbar />
      
      <AnimatedSection>
        {/* <div className="container mx-auto px-4 py-16" > */}
        {/* Header */}
          <section
            className="relative w-full min-h-[40vh] md:min-h-[50vh] flex items-center justify-center text-white navbar-fixed-body"
            style={{
              backgroundImage: `url("https://plus.unsplash.com/premium_photo-1677916317230-d9b78d675264?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Contenido centrado */}
            <div className="relative max-w-4xl mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                Testimonios de Nuestros Clientes
              </h1>
              <p className="text-xl mb-8 text-gray-200">
                Conoce las experiencias de quienes confían en nosotros
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="shadow-lg"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Compartir tu Experiencia
              </Button>
            </div>
          </section>

        {isLoading ? (
          <div className="flex flex-col items-center space-y-4 py-16">
            <Spinner size="lg" className="text-primary" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Cargando testimonios...</h2>
              <p className="text-sm text-muted-foreground">
                Por favor espere mientras cargamos las experiencias de nuestros clientes.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Testimonials */}
            {featuredTestimonials.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Testimonios Destacados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {featuredTestimonials.map((testimonial) => 
                    isSuperuser ? (
                      <TestimonialCardEditable key={testimonial.id} testimonial={testimonial} featured />
                    ) : (
                      <TestimonialCard key={testimonial.id} testimonial={testimonial} featured />
                    )
                  )}
                </div>
              </section>
            )}

            {/* All Testimonials */}
            <section>
              {featuredTestimonials.length > 0 && (
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Más Testimonios
                </h2>
              )}
              
              {regularTestimonials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularTestimonials.map((testimonial) => 
                    isSuperuser ? (
                      <TestimonialCardEditable key={testimonial.id} testimonial={testimonial} />
                    ) : (
                      <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                    )
                  )}
                </div>
              ) : approvedTestimonials.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aún no hay testimonios
                    </h3>
                    <p className="text-gray-600 mb-6">
                      ¡Sé el primero en compartir tu experiencia!
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Escribir Testimonial
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </section>
          </div>
        )}

        {/* Create Testimonial Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Compartir tu Experiencia</DialogTitle>
                <DialogDescription>
                  Cuéntanos sobre tu experiencia con nosotros. Tu testimonial ayudará a otros clientes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com (opcional)"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rating">Calificación</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                        className={`text-2xl ${
                          star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      ({formData.rating} de 5 estrellas)
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="content">Tu Testimonial *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    required
                    rows={4}
                    placeholder="Comparte tu experiencia con nosotros..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTestimonialMutation.isPending}>
                  {createTestimonialMutation.isPending ? "Enviando..." : "Enviar Testimonial"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* </div> */}
      </AnimatedSection>

      <Footer />
    </div>
  );
}
