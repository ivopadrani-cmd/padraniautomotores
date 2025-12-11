import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Car, Users, ClipboardList, Building2, RefreshCw, User, ChevronDown, Settings, LogOut, Bell, FileText, Calculator, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const getNavigationItems = (userRole) => {
  // Mecánicos solo ven Peritajes
  if (userRole === 'Mecánico') {
    return [
      { title: "Peritajes", pageName: "Inspections", icon: Wrench, mobile: true },
    ];
  }

  // Gerente y Administrador ven todo
  if (userRole === 'Gerente' || userRole === 'Administrador') {
    return [
      { title: "Dashboard", pageName: "Dashboard", icon: LayoutDashboard, mobile: true },
      { title: "Vehículos", pageName: "Vehicles", icon: Car, mobile: true },
      { title: "CRM", pageName: "CRM", icon: Users, mobile: true },
      { title: "Tareas", pageName: "Tasks", icon: ClipboardList, mobile: true },
      { title: "Agencia", pageName: "Agency", icon: Building2, mobile: false },
    ];
  }

  // Vendedor, Gestor, Comisionista - sin Agencia
  if (userRole === 'Vendedor' || userRole === 'Gestor' || userRole === 'Comisionista') {
    return [
      { title: "Dashboard", pageName: "Dashboard", icon: LayoutDashboard, mobile: true },
      { title: "Vehículos", pageName: "Vehicles", icon: Car, mobile: true },
      { title: "CRM", pageName: "CRM", icon: Users, mobile: true },
      { title: "Tareas", pageName: "Tasks", icon: ClipboardList, mobile: true },
    ];
  }

  // Sin rol válido = sin acceso
  return [];
};

const getAllowedPages = (userRole) => {
  const items = getNavigationItems(userRole);
  return items.map(i => i.pageName);
};

const canAccessSettings = (userRole) => {
  return userRole === 'Gerente' || userRole === 'Administrador';
};

export default function MobileLayout({ children }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: rates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.list('-rate_date'),
  });

  const [blueRate, setBlueRate] = useState(null);
  const [oficialRate, setOficialRate] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (!user) {
          setUserRole('__none__');
          return;
        }

        // Use role directly from user object
        // If user is ivopadrani@gmail.com, ensure they have Gerente role
        if (user.email?.toLowerCase() === 'ivopadrani@gmail.com') {
          if (user.role !== 'Gerente') {
            // Update user role to Gerente
            const users = await base44.entities.User?.list() || [];
            const dbUser = users.find(u => u.id === user.id || u.email?.toLowerCase() === 'ivopadrani@gmail.com');
            if (dbUser) {
            try {
                await base44.entities.User?.update(dbUser.id, { role: 'Gerente' });
                user.role = 'Gerente';
                localStorage.setItem('current_user', JSON.stringify(user));
            } catch (e) {
                // If User entity doesn't exist, just set role locally
                user.role = 'Gerente';
                localStorage.setItem('current_user', JSON.stringify(user));
              }
            } else {
              user.role = 'Gerente';
              localStorage.setItem('current_user', JSON.stringify(user));
            }
          }
          setUserRole('Gerente');
          return;
        }

        // For other users, use their role directly
        if (user.role) {
          setUserRole(user.role);
        } else {
          // Fallback: try to get role from Seller if exists (for backward compatibility)
          try {
            const allSellers = await base44.entities.Seller.list();
            const seller = allSellers.find(s =>
              (s.user_id === user.id) ||
              (s.email?.toLowerCase() === user.email?.toLowerCase())
            );

        if (seller && seller.role && seller.is_active !== false) {
          setUserRole(seller.role);
              // Update user with role from seller
              user.role = seller.role;
              localStorage.setItem('current_user', JSON.stringify(user));
        } else {
              // Default to Administrador if no role found
              setUserRole('Administrador');
              user.role = 'Administrador';
              localStorage.setItem('current_user', JSON.stringify(user));
            }
          } catch (e) {
            // Default to Administrador on error
            setUserRole('Administrador');
            user.role = 'Administrador';
            localStorage.setItem('current_user', JSON.stringify(user));
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole('__none__');
      } finally {
        setIsInitializing(false);
      }
    };

    loadUserRole();
  }, []);

  const fetchRates = async () => {
    setIsUpdatingRate(true);
    try {
      const [blueRes, oficialRes] = await Promise.all([
        fetch('https://dolarapi.com/v1/dolares/blue'),
        fetch('https://dolarapi.com/v1/dolares/oficial')
      ]);
      const blueData = await blueRes.json();
      const oficialData = await oficialRes.json();

      setBlueRate(blueData.venta);
      setOficialRate(oficialData.venta);
      setLastUpdate(new Date());

      // Save blue rate to DB
      const today = new Date().toISOString().split('T')[0];
      const existingToday = rates.find(r => r.rate_type === 'Diaria' && r.rate_date === today);
      if (existingToday) {
        await base44.entities.ExchangeRate.update(existingToday.id, { usd_rate: blueData.venta, source: 'DolarAPI (Blue)' });
      } else {
        await base44.entities.ExchangeRate.create({ rate_date: today, rate_type: 'Diaria', usd_rate: blueData.venta, source: 'DolarAPI (Blue)' });
      }
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
    setIsUpdatingRate(false);
  };

  // Auto-fetch on load and every 3 hours
  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 3 * 60 * 60 * 1000); // 3 hours
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleLogin = async (user) => {
    console.log('Usuario logueado:', user);
    // Actualizar el estado local
    setCurrentUser(user);
    setUserRole(user.role);

    // Forzar recarga de la página para reinicializar todo
    window.location.reload();
  };

  // Solo usar mobile layout si estamos en móvil
  if (!isMobile) {
    return children;
  }

  // Mostrar spinner mientras se inicializa
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  const navigationItems = getNavigationItems(userRole).filter(item => item.mobile);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Logo pequeño */}
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907cb67c59a0c423133fafc/b58f98fe8_LogosinfondoBOLDsinrueda.png"
            alt="Automotores"
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-semibold text-gray-900">Padrani</span>
        </div>

        {/* User Menu */}
        <Sheet open={showUserMenu} onOpenChange={setShowUserMenu}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Mi Perfil</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{currentUser?.full_name || 'Usuario'}</p>
                  <p className="text-sm text-gray-500">{currentUser?.email || ''}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                  onClick={() => {
                    window.location.href = createPageUrl('Agency');
                    setShowUserMenu(false);
                  }}
                >
                  <User className="w-5 h-5" />
                  <span>Mi Perfil</span>
                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                  <Bell className="w-5 h-5" />
                  <span>Notificaciones</span>
                </button>

                {/* Exchange Rates */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">Cotizaciones</span>
                    <button
                      onClick={fetchRates}
                      disabled={isUpdatingRate}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <RefreshCw className={`w-4 h-4 ${isUpdatingRate ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-medium text-cyan-600 uppercase mb-1">Blue</p>
                      <p className="text-lg font-bold text-gray-900">${blueRate?.toLocaleString('es-AR') || '-'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Oficial</p>
                      <p className="text-lg font-bold text-gray-900">${oficialRate?.toLocaleString('es-AR') || '-'}</p>
                    </div>
                  </div>
                  {lastUpdate && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Actualizado {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                {/* Settings - Solo para Gerente/Admin */}
                {canAccessSettings(userRole) && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900 mb-2">Configuración</p>
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                      onClick={() => {
                        window.location.href = createPageUrl('Agency');
                        setShowUserMenu(false);
                      }}
                    >
                      <Building2 className="w-5 h-5" />
                      <span>Datos de Agencia</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                      onClick={() => {
                        window.location.href = createPageUrl('Agency');
                        setShowUserMenu(false);
                      }}
                    >
                      <Users className="w-5 h-5" />
                      <span>Usuarios y Permisos</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                      <FileText className="w-5 h-5" />
                      <span>Plantillas</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                      <Calculator className="w-5 h-5" />
                      <span>Cotizaciones</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 text-left"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-100 pb-20">
        {userRole === null ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : userRole === '__none__' ? (
          <div className="p-4">
            <div className="bg-white rounded-lg p-6 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">Iniciar Sesión</h2>
              <p className="text-gray-600 mb-4">Necesitas iniciar sesión para continuar</p>
              {/* Aquí iría el componente de login móvil */}
            </div>
          </div>
        ) : (() => {
          // Verificar si la página actual está permitida para este rol
          const allowedPages = getAllowedPages(userRole);
          const currentPath = location.pathname.toLowerCase();

          // Extraer el nombre de la página base (sin IDs de rutas dinámicas)
          const pathSegments = currentPath.split('/').filter(Boolean);
          const basePath = pathSegments[0] || '';

          const isAllowed = allowedPages.some(page =>
            basePath.includes(page.toLowerCase()) ||
            currentPath.includes(page.toLowerCase())
          ) || currentPath === '/' || currentPath === '';

          // Si no está permitida, redirigir a la primera página permitida
          if (!isAllowed && allowedPages.length > 0) {
            console.warn('⚠️ Acceso denegado a:', currentPath, '- Redirigiendo a:', allowedPages[0]);
            window.location.href = createPageUrl(allowedPages[0]);
            return (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              </div>
            );
          }

          // Si es la raíz, redirigir a la primera página permitida
          if ((currentPath === '/' || currentPath === '') && allowedPages.length > 0) {
            window.location.href = createPageUrl(allowedPages[0]);
            return (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              </div>
            );
          }

          return children;
        })()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navigationItems.map((item) => {
            const pageUrl = createPageUrl(item.pageName);
            const isActive = location.pathname === pageUrl;
            return (
              <Link
                key={item.title}
                to={pageUrl}
                onClick={() => { window.dispatchEvent(new CustomEvent('resetModuleView', { detail: item.pageName })); }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                  isActive
                    ? 'text-cyan-600 bg-cyan-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-cyan-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium truncate ${isActive ? 'text-cyan-600' : 'text-gray-500'}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
