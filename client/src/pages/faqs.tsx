import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaqItem } from "@/components/faq-item";
import { FaqCardEditable } from "@/components/faq/faq-card-editable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, HelpCircle, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Faq, FaqCategory, SiteConfig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Faqs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [votedFaqs, setVotedFaqs] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperuser = user?.role === "superuser";

  useEffect(() => {
    const savedVotes = localStorage.getItem("faq-votes");
    if (savedVotes) {
      try {
        const votedIds = JSON.parse(savedVotes);
        setVotedFaqs(new Set(votedIds));
      } catch (error) {
        console.error("Error loading saved votes:", error);
      }
    }
  }, []);

  const { data: faqs, isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });
  const { data: categories, isLoading: categoriesLoading } =
    useQuery<FaqCategory[]>({ queryKey: ["/api/faq-categories"] });

  const { data: config, isLoading: configLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
  });

  const { appearance } = useMemo(() => {
    const configData = config?.config as any;
    return {
      appearance: configData?.appearance || {},
    };
  }, [config]);

  const incrementViewsMutation = useMutation({
    mutationFn: async (faqId: string) =>
      apiRequest(`/api/faqs/${faqId}/increment-views`, {
        method: "PUT",
        body: JSON.stringify({}),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/faqs"] }),
  });

  const voteHelpfulMutation = useMutation({
    mutationFn: async (faqId: string) => {
      if (votedFaqs.has(faqId))
        throw new Error("Ya has votado en esta pregunta frecuente.");
      return await apiRequest(`/api/faqs/${faqId}/vote-helpful`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
    },
    onSuccess: (data, faqId) => {
      const newVotedFaqs = new Set(votedFaqs);
      newVotedFaqs.add(faqId);
      setVotedFaqs(newVotedFaqs);
      localStorage.setItem("faq-votes", JSON.stringify([...newVotedFaqs]));
      queryClient.invalidateQueries({ queryKey: ["/api/faqs"] });
      toast({
        title: "¡Gracias por tu voto!",
        description: "Tu voto ha sido registrado correctamente.",
      });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error al votar",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo registrar tu voto.",
      }),
  });

  const publishedFaqs = faqs?.filter((faq) => faq.isPublished) || [];
  const filteredFaqs =
    publishedFaqs.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || faq.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  const faqsByCategory =
    categories
      ?.map((category) => ({
        category,
        faqs: filteredFaqs.filter((faq) => faq.categoryId === category.id),
      }))
      .filter((group) => group.faqs.length > 0) || [];

  const uncategorizedFaqs = filteredFaqs.filter((faq) => !faq.categoryId);
  const handleFaqClick = (faqId: string) =>
    incrementViewsMutation.mutate(faqId);
  const handleVoteHelpful = (faqId: string) =>
    voteHelpfulMutation.mutate(faqId);
  const isLoading = faqsLoading || categoriesLoading || configLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header fuera del container para ocupar todo el ancho */}
      <section
        className="relative w-full min-h-[40vh] md:min-h-[50vh] flex items-center justify-center text-white"
        style={{
          backgroundImage: `url(${appearance.heroImage || "https://plus.unsplash.com/premium_photo-1677916317230-d9b78d675264?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: appearance.heroBackgroundColor || "#000000",
          color: appearance.heroTextColor || "#ffffff",
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundColor: appearance.heroOverlayColor || "#000000" }}
        ></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <HelpCircle
            className="h-14 w-14 mx-auto text-blue-400 mb-4 animate-bounce"
            color={appearance.iconColor || "#93c5fd"}
          />
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg"
            style={{ color: appearance.headingColor || "#ffffff" }}
          >
            Preguntas Frecuentes
          </h1>
          <p
            className="text-lg md:text-xl text-gray-200"
            style={{ color: appearance.subheadingColor || "#e5e7eb" }}
          >
            Encuentra respuestas rápidas a las preguntas más comunes
          </p>
        </div>
      </section>

      <AnimatedSection>
        <div className="container mx-auto px-4 py-16 flex-1">
          {/* Search & Filters */}
          <AnimatedSection delay={0.2}>
            <Card className="mb-10 shadow-lg border-0 rounded-2xl">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2 text-blue-600"
                  style={{ color: appearance.primaryColor || "#000000" }}
                >
                  <Filter className="h-5 w-5" />
                  Buscar y Filtrar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Buscar en las preguntas y respuestas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all duration-300"
                    />
                  </div>
                  <div className="sm:w-64">
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all duration-300">
                        <SelectValue placeholder="Filtrar por categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Categories Overview */}
          {categories &&
            categories.length > 0 &&
            selectedCategory === "all" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {categories.map((cat) => {
                  const count = publishedFaqs.filter(
                    (f) => f.categoryId === cat.id
                  ).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-5 border rounded-2xl shadow hover:shadow-xl hover:bg-blue-50 cursor-pointer transition-all duration-300"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {cat.description}
                        </p>
                      )}
                      <Badge
                        variant="outline"
                        className="text-blue-600 font-semibold"
                        style={{
                          color: appearance.primaryColor || "#000000",
                          borderColor: appearance.primaryColor || "#000000",
                        }}
                      >
                        {count} {count === 1 ? "pregunta" : "preguntas"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

          {/* FAQs */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {selectedCategory === "all" ? (
                <>
                  {faqsByCategory.map(({ category, faqs }) => (
                    <section key={category.id}>
                      <div className="mb-6">
                        <h2
                          className="text-2xl font-semibold text-gray-900 mb-2"
                          style={{ color: appearance.headingColor || "#000000" }}
                        >
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-gray-600">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="space-y-4">
                        {faqs.map((faq) =>
                          isSuperuser ? (
                            <FaqCardEditable key={faq.id} faq={faq} />
                          ) : (
                            <FaqItem
                              key={faq.id}
                              faq={faq}
                              onIncrementViews={() => handleFaqClick(faq.id)}
                              onVoteHelpful={() => handleVoteHelpful(faq.id)}
                              hasVoted={votedFaqs.has(faq.id)}
                              className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white p-5"
                            />
                          )
                        )}
                      </div>
                    </section>
                  ))}

                  {uncategorizedFaqs.length > 0 && (
                    <section>
                      <div className="mb-6">
                        <h2
                          className="text-2xl font-semibold text-gray-900 mb-2"
                          style={{ color: appearance.headingColor || "#000000" }}
                        >
                          Preguntas Generales
                        </h2>
                      </div>
                      <div className="space-y-4">
                        {uncategorizedFaqs.map((faq) =>
                          isSuperuser ? (
                            <FaqCardEditable key={faq.id} faq={faq} />
                          ) : (
                            <FaqItem
                              key={faq.id}
                              faq={faq}
                              onIncrementViews={() => handleFaqClick(faq.id)}
                              onVoteHelpful={() => handleVoteHelpful(faq.id)}
                              hasVoted={votedFaqs.has(faq.id)}
                              className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white p-5"
                            />
                          )
                        )}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <section>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2
                        className="text-2xl font-semibold text-gray-900 mb-2"
                        style={{ color: appearance.headingColor || "#000000" }}
                      >
                        {
                          categories?.find((c) => c.id === selectedCategory)
                            ?.name
                        }
                      </h2>
                      {categories?.find((c) => c.id === selectedCategory)
                        ?.description && (
                        <p className="text-gray-600">
                          {
                            categories.find((c) => c.id === selectedCategory)
                              ?.description
                          }
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory("all")}
                      style={{
                        borderColor: appearance.primaryColor || "#000000",
                        color: appearance.primaryColor || "#000000",
                      }}
                    >
                      Ver Todas las Categorías
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) =>
                      isSuperuser ? (
                        <FaqCardEditable key={faq.id} faq={faq} />
                      ) : (
                        <FaqItem
                          key={faq.id}
                          faq={faq}
                          onIncrementViews={() => handleFaqClick(faq.id)}
                          onVoteHelpful={() => handleVoteHelpful(faq.id)}
                          hasVoted={votedFaqs.has(faq.id)}
                          className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white p-5"
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {filteredFaqs.length === 0 && (
                <Card className="text-center py-20 bg-blue-50 rounded-xl shadow-lg">
                  <CardContent>
                    <HelpCircle
                      className="h-20 w-20 mx-auto text-blue-400 mb-6 animate-pulse"
                      color={appearance.iconColor || "#93c5fd"}
                    />
                    <h3
                      className="text-2xl font-bold text-gray-900 mb-2"
                      style={{ color: appearance.headingColor || "#000000" }}
                    >
                      {searchTerm || selectedCategory !== "all"
                        ? "No se encontraron preguntas"
                        : "Aún no hay preguntas frecuentes"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || selectedCategory !== "all"
                        ? "Intenta ajustar tus filtros de búsqueda"
                        : "Las preguntas frecuentes aparecerán aquí una vez que estén disponibles"}
                    </p>
                    {(searchTerm || selectedCategory !== "all") && (
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        style={{ backgroundColor: appearance.primaryColor || "#000000" }}
                      >
                        Limpiar Filtros
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}