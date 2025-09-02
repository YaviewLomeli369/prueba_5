import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatsCard } from "@/components/admin/stats-card";
import { ModuleCard } from "@/components/admin/module-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  Puzzle, 
  Mail,
  ShoppingCart,
  Quote,
  HelpCircle,
  Layout,
  Calendar,
  Download,
  Plus,
  Eye,
  Save,
  Crown,
  UserCog,
  User,
  FileText,
  Package
} from "lucide-react";
import type { SiteConfig, User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: config } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: testimonials } = useQuery({
    queryKey: ["/api/testimonials"],
    refetchInterval: 60000,
  });

  const { data: contactMessages } = useQuery({
    queryKey: ["/api/contact/messages"],
    refetchInterval: 30000, // More frequent for contact messages
  });

  const { data: blogPosts } = useQuery({
    queryKey: ["/api/blog"],
    refetchInterval: 60000,
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/store/orders"],
    refetchInterval: 30000, // More frequent for orders
  });

  const { data: products } = useQuery({
    queryKey: ["/api/store/products"],
    refetchInterval: 60000,
  });

  const modules = config?.config?.frontpage?.modulos || {};
  const activeModules = Object.values(modules).filter((module: any) => module.activo).length;
  const totalModules = Object.keys(modules).length;
  
  // Check if current user is superuser
  const isSuperuser = currentUser?.role === 'superuser';

  const handleModuleToggle = async (moduleKey: string, active: boolean) => {
    if (!config) return;

    try {
      const updatedConfig = {
        ...config.config,
        frontpage: {
          ...config.config.frontpage,
          modulos: {
            ...modules,
            [moduleKey]: {
              ...modules[moduleKey],
              activo: active,
            },
          },
        },
      };

      await fetch("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ config: updatedConfig }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      
      toast({
        title: "Módulo actualizado",
        description: `El módulo ha sido ${active ? "activado" : "desactivado"} correctamente`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el módulo",
      });
    }
  };

  const usersByRole = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate order statistics correctly
  const orderStats = orders?.reduce((acc, order) => {
    acc.total++;
    
    // Count by status
    if (order.status === 'pending') acc.pending++;
    else if (order.status === 'confirmed') acc.confirmed++;
    else if (order.status === 'processing') acc.processing++;
    else if (order.status === 'shipped') acc.shipped++;
    else if (order.status === 'delivered') acc.delivered++;
    else if (order.status === 'cancelled') acc.cancelled++;
    else if (order.status === 'refunded') acc.refunded++;
    
    // Only count revenue from non-cancelled orders
    if (order.status !== 'cancelled' && order.paymentStatus === 'paid') {
      acc.revenue += order.total;
      acc.paidOrders++;
    }
    
    return acc;
  }, {
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    revenue: 0,
    paidOrders: 0
  }) || {
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    revenue: 0,
    paidOrders: 0
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Gestiona tu sitio web modular desde aquí</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => window.open("/", "_blank")}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Sitio
            </Button>
            <Button variant="outline" onClick={() => {
              queryClient.invalidateQueries();
              toast({
                title: "Datos actualizados",
                description: "Todas las estadísticas se han refrescado",
              });
            }}>
              <Download className="mr-2 h-4 w-4" />
              Actualizar Stats
            </Button>
            <Button onClick={() => {
              queryClient.invalidateQueries();
              toast({
                title: "Cambios guardados",
                description: "Todos los cambios han sido guardados correctamente",
              });
            }}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Usuarios"
            value={users?.length?.toString() || "0"}
            icon={Users}
            iconColor="text-primary"
            description="usuarios registrados"
          />
          {isSuperuser ? (
            <StatsCard
              title="Módulos Activos"
              value={`${activeModules}/${totalModules}`}
              icon={Puzzle}
              iconColor="text-secondary"
              description="módulos configurados"
            />
          ) : (
            <StatsCard
              title="Posts del Blog"
              value={blogPosts?.length?.toString() || "0"}
              icon={FileText}
              iconColor="text-secondary"
              description="artículos publicados"
            />
          )}
          <StatsCard
            title="Pedidos Activos"
            value={`${orderStats.total - orderStats.cancelled - orderStats.refunded}`}
            icon={DollarSign}
            iconColor="text-success"
            description={`${orderStats.pending} pendientes, ${orderStats.cancelled} cancelados`}
          />
          <StatsCard
            title="Ingresos Válidos"
            value={formatPrice(orderStats.revenue)}
            icon={Mail}
            iconColor="text-warning"
            description={`${orderStats.paidOrders} pedidos pagados`}
          />
        </div>

        {/* Module Management - Only for superuser */}
        {isSuperuser && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Gestión de Módulos</h2>
            <Button variant="outline">
              <Puzzle className="mr-2 h-4 w-4" />
              Configuración Avanzada
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <ModuleCard
              name="Tienda"
              description="E-commerce completo"
              icon={ShoppingCart}
              isActive={modules.tienda?.activo || false}
              stats={{
                "Productos": products?.length?.toString() || "0",
                "Órdenes": orders?.length?.toString() || "0",
              }}
              onToggle={(active) => handleModuleToggle("tienda", active)}
              onManage={() => window.location.href = "/admin/store"}
            />

            <ModuleCard
              name="Testimonios"
              description="Reseñas de clientes"
              icon={Quote}
              isActive={modules.testimonios?.activo || false}
              stats={{
                "Total": testimonials?.length?.toString() || "0",
                "Pendientes": testimonials?.filter(t => !t.isApproved)?.length?.toString() || "0",
              }}
              onToggle={(active) => handleModuleToggle("testimonios", active)}
              onManage={() => window.location.href = "/admin/testimonials"}
            />

            <ModuleCard
              name="Reservas"
              description="Sistema de citas"
              icon={Calendar}
              isActive={modules.reservas?.activo || false}
              stats={{
                "Configurar": "horarios",
              }}
              onToggle={(active) => handleModuleToggle("reservas", active)}
              onManage={() => window.location.href = "/admin/reservations"}
            />

            <ModuleCard
              name="FAQs"
              description="Preguntas frecuentes"
              icon={HelpCircle}
              isActive={modules.faqs?.activo || false}
              stats={{
                "Preguntas": "En desarrollo",
                "Categorías": "Próximamente",
              }}
              onToggle={(active) => handleModuleToggle("faqs", active)}
              onManage={() => window.location.href = "/admin/faqs"}
            />

            <ModuleCard
              name="Contacto"
              description="Mensajes y comunicación"
              icon={Mail}
              isActive={modules.contacto?.activo || false}
              stats={{
                "Mensajes": contactMessages?.length?.toString() || "0",
                "Sin leer": "0",
              }}
              onToggle={(active) => handleModuleToggle("contacto", active)}
              onManage={() => window.location.href = "/admin/contact"}
            />

            <ModuleCard
              name="Blog"
              description="Artículos y noticias"
              icon={FileText}
              isActive={modules.blog?.activo || false}
              stats={{
                "Artículos": blogPosts?.length?.toString() || "0",
                "Publicados": blogPosts?.filter((post: any) => post.status === 'published')?.length?.toString() || "0",
              }}
              onToggle={(active) => handleModuleToggle("blog", active)}
              onManage={() => window.location.href = "/admin/blog"}
            />

            <ModuleCard
              name="Pedidos"
              description="Gestión de órdenes"
              icon={Package}
              isActive={modules.tienda?.activo || false}
              stats={{
                "Activos": `${orderStats.total - orderStats.cancelled - orderStats.refunded}`,
                "Cancelados": orderStats.cancelled.toString(),
                "Reembolsados": orderStats.refunded.toString(),
              }}
              onToggle={(active) => handleModuleToggle("tienda", active)}
              onManage={() => window.location.href = "/admin/orders"}
            />

            {isSuperuser && (
            <ModuleCard
              name="Secciones"
              description="Página principal"
              icon={Layout}
              isActive={true}
              stats={{
                "Secciones activas": "8",
              }}
              isRequired={true}
              onManage={() => window.location.href = "/admin/sections"}
            />
            )}
          </div>
        </div>
        )}

        {/* Order Statistics - Only show if there are orders */}
        {orders && orders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Estadísticas de Pedidos</h2>
              <Button variant="outline" onClick={() => window.location.href = "/admin/orders"}>
                <Package className="mr-2 h-4 w-4" />
                Ver todos los pedidos
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{orderStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
                  <div className="text-sm text-gray-600">Procesando</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{orderStats.shipped}</div>
                  <div className="text-sm text-gray-600">Enviados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                  <div className="text-sm text-gray-600">Entregados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                  <div className="text-sm text-gray-600">Cancelados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{orderStats.refunded}</div>
                  <div className="text-sm text-gray-600">Reembolsados</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Ingresos Válidos</div>
                      <div className="text-sm text-gray-600">Solo pedidos pagados no cancelados</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(orderStats.revenue)}</div>
                      <div className="text-sm text-gray-500">{orderStats.paidOrders} pedidos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Promedio por Pedido</div>
                      <div className="text-sm text-gray-600">Valor promedio válido</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {orderStats.paidOrders > 0 ? formatPrice(orderStats.revenue / orderStats.paidOrders) : formatPrice(0)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Tasa de Éxito</div>
                      <div className="text-sm text-gray-600">Pedidos no cancelados</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {orderStats.total > 0 ? Math.round(((orderStats.total - orderStats.cancelled) / orderStats.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* System Info and User Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Plantilla:</span>
                <span className="font-medium">{config?.version || "v1.0.0"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-medium">
                  {config?.lastUpdated ? new Date(config.lastUpdated).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Modo:</span>
                <Badge variant="default" className="bg-success text-white">Producción</Badge>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Backup automático:</span>
                <Badge variant="default" className="bg-success text-white">Activo</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => {
                if (!config) return;
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config.config, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "site-config.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Configuración JSON
              </Button>
            </CardContent>
          </Card>

          {/* User Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-error rounded-full flex items-center justify-center">
                    <Crown className="text-white text-xs" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Superuser</p>
                    <p className="text-xs text-gray-600">Control total</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{usersByRole.superuser || 0} usuario(s)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <UserCog className="text-white text-xs" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Admin</p>
                    <p className="text-xs text-gray-600">Gestión del negocio</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{usersByRole.admin || 0} usuario(s)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <Users className="text-white text-xs" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Staff</p>
                    <p className="text-xs text-gray-600">Empleados</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{usersByRole.staff || 0} usuario(s)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                    <User className="text-white text-xs" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Clientes</p>
                    <p className="text-xs text-gray-600">Usuarios registrados</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{usersByRole.cliente || 0} usuario(s)</span>
              </div>

              <Button className="w-full mt-4" onClick={() => window.location.href = "/admin/users"}>
                <Plus className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Module Functions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Funcionalidades por Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Módulo / Sección</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Funcionalidades principales</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Quién interactúa</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Notas adicionales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">Superuser</td>
                    <td className="py-4 px-4 text-gray-700">Gestiona JSON de configuración, apariencia, contenidos, SEO, módulos activos/desactivos</td>
                    <td className="py-4 px-4">
                      <Badge variant="destructive">Superuser</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Control total del sitio, único usuario con acceso completo</td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">FrontPage / Secciones</td>
                    <td className="py-4 px-4 text-gray-700">Visualización de secciones dinámicas, orden, título, contenido, activación/desactivación</td>
                    <td className="py-4 px-4 space-x-1">
                      <Badge variant="default">Admin</Badge>
                      <Badge variant="secondary">Cliente</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Contenido visible según configuración del admin</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">Testimonios</td>
                    <td className="py-4 px-4 text-gray-700">Enviar testimonios, aprobar, marcar destacados, estadísticas, visualización pública</td>
                    <td className="py-4 px-4 space-x-1">
                      <Badge variant="default">Admin</Badge>
                      <Badge variant="secondary">Cliente</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Admin controla publicación y métricas</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">FAQs</td>
                    <td className="py-4 px-4 text-gray-700">Crear/editar FAQs y categorías, incrementar vistas, votar utilidad, publicación y filtrado por categoría</td>
                    <td className="py-4 px-4 space-x-1">
                      <Badge variant="default">Admin</Badge>
                      <Badge variant="secondary">Cliente</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Mejora la experiencia del usuario y soporte público</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">Contacto</td>
                    <td className="py-4 px-4 text-gray-700">CRUD de información de contacto, bandeja de mensajes, enviar correos automáticos</td>
                    <td className="py-4 px-4 space-x-1">
                      <Badge variant="default">Admin</Badge>
                      <Badge variant="secondary">Cliente</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Admin gestiona mensajes recibidos y respuestas</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">Tienda</td>
                    <td className="py-4 px-4 text-gray-700">Gestionar productos y categorías, carrito de compras, órdenes y seguimiento, visualización pública</td>
                    <td className="py-4 px-4 space-x-1">
                      <Badge variant="default">Admin</Badge>
                      <Badge variant="secondary">Cliente</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Admin administra inventario y pedidos; cliente compra</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">Reservas / Citas</td>
                    <td className="py-4 px-4 text-gray-700">Crear reservas, gestión de disponibilidad, horarios y días, notificaciones</td>
                    <td className="py-4 px-4 space-x-1">
                      <Badge variant="default">Admin</Badge>
                      <Badge variant="secondary">Cliente</Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">Solo si el módulo está activado según tipo de negocio</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
