import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SEOHead } from "@/components/seo-head";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Star, User, Phone, Mail, Quote } from "lucide-react"; 
import AnimatedSection from "@/components/AnimatedSection";
import type { SiteConfig } from "@shared/schema";

function Conocenos() {
  const { data: config } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
  });

  const appearance = useMemo(() => {
    const configData = config?.config as any;
    return configData?.appearance || {};
  }, [config]);

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{
        backgroundColor: appearance.backgroundColor || "inherit",
        color: appearance.textColor || "inherit",
        fontFamily: appearance.fontFamily || "inherit",
      }}
    >
      <SEOHead
        title="Conócenos"
        description="Descubre quiénes somos, nuestra misión, visión y valores."
      />
      <Navbar />

      {/* Hero principal */}
      <AnimatedSection>
        <section className="relative py-24 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white text-center shadow-lg"
          style={{
            backgroundImage: `url("https://plus.unsplash.com/premium_photo-1677916317230-d9b78d675264?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          >
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Conócenos
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-gray-100">
              Somos un equipo comprometido con el crecimiento de tu negocio.
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Sección principal */}
      <AnimatedSection delay={0.1}>
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card Misión */}
            <AnimatedSection delay={0.2}>
              <Card className="group relative overflow-hidden rounded-3xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-10 text-center">
                  <Target className="w-12 h-12 mx-auto mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">Nuestra Misión</h3>
                  <div className="w-12 h-1 bg-blue-600 mx-auto mb-4 rounded-full" />
                  <p className="text-gray-600 leading-relaxed">
                    Brindar soluciones digitales accesibles y de alto impacto.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Card Visión */}
            <AnimatedSection delay={0.3}>
              <Card className="group relative overflow-hidden rounded-3xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-10 text-center">
                  <Eye className="w-12 h-12 mx-auto mb-6 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">Nuestra Visión</h3>
                  <div className="w-12 h-1 bg-indigo-600 mx-auto mb-4 rounded-full" />
                  <p className="text-gray-600 leading-relaxed">
                    Ser líderes en innovación tecnológica para PYMES en LATAM.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Card Valores */}
            <AnimatedSection delay={0.4}>
              <Card className="group relative overflow-hidden rounded-3xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-10 text-center">
                  <Star className="w-12 h-12 mx-auto mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">Nuestros Valores</h3>
                  <div className="w-12 h-1 bg-purple-600 mx-auto mb-4 rounded-full" />
                  <p className="text-gray-600 leading-relaxed">
                    Innovación, compromiso, transparencia.
                  </p>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>

      {/* Equipo */}
      <AnimatedSection delay={0.5}>
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-extrabold mb-6 text-gray-800">Nuestro Equipo</h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Detrás de cada proyecto hay personas apasionadas, listas para ayudarte a crecer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {/* Repetimos Cards de equipo */}
              <AnimatedSection delay={0.6}>
                <Card className="group relative overflow-hidden rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-1">
                        <img
                          src="https://via.placeholder.com/200"
                          alt="Miembro del equipo"
                          className="rounded-full object-cover w-full h-full border-4 border-white shadow-md"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="flex items-center justify-center w-full h-full rounded-full bg-white">
                          <User className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-xl text-gray-800">Juan Pérez</h4>
                    <p className="text-sm text-gray-500 mb-4">CEO</p>
                    <div className="italic text-gray-600 mb-4 flex items-center justify-center gap-2">
                      <Quote className="h-4 w-4 text-blue-500" />
                      <span>La innovación es nuestro motor."</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <a href="tel:+525511223344" className="hover:underline">
                          +52 55 9999 8888
                        </a>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <a href="mailto:correo@empresa.com" className="hover:underline">
                          juan@novadigital.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>

              <AnimatedSection delay={0.6}>
                <Card className="group relative overflow-hidden rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-1">
                        <img
                          src="https://via.placeholder.com/200"
                          alt="Miembro del equipo"
                          className="rounded-full object-cover w-full h-full border-4 border-white shadow-md"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="flex items-center justify-center w-full h-full rounded-full bg-white">
                          <User className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-xl text-gray-800">Ana Torres</h4>
                    <p className="text-sm text-gray-500 mb-4">Directora de Marketing</p>
                    <div className="italic text-gray-600 mb-4 flex items-center justify-center gap-2">
                      <Quote className="h-4 w-4 text-blue-500" />
                      <span>"Las ideas valen cuando se ejecutan."</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                       
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <a href="mailto:correo@empresa.com" className="hover:underline">
                          ana@novadigital.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedSection>

              {/* Repite para más miembros */}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <Footer />
    </div>
  );
}

export default Conocenos;
