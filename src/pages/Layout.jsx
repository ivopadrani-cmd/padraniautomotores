
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Car, Users, ClipboardList, Building2, RefreshCw, User, ChevronDown, Settings, LogOut, HelpCircle, Bell, FileText, Calculator, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoginScreen from "@/components/auth/LoginScreen";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getNavigationItems = (userRole) => {
  // Mecánicos solo ven Peritajes
  if (userRole === 'Mecánico') {
    return [
      { title: "Peritajes", pageName: "Inspections", icon: Wrench },
      { title: "Vehículos", pageName: "Vehicles", icon: Car, hidden: true } // Permitido para ver detalles de vehículos desde peritajes
    ];
  }
  
  // Gerente y Administrador ven todo
  if (userRole === 'Gerente' || userRole === 'Administrador') {
    return [
      { title: "Dashboard", pageName: "Dashboard", icon: LayoutDashboard },
      { title: "Vehículos", pageName: "Vehicles", icon: Car },
      { title: "CRM", pageName: "CRM", icon: Users },
      { title: "Clientes", pageName: "Clients", icon: Users, hidden: true }, // No visible en sidebar, pero permitido
      { title: "Tareas", pageName: "Tasks", icon: ClipboardList },
      { title: "InfoAuto API", pageName: "InfoAutoTester", icon: Car },
      { title: "Agencia", pageName: "Agency", icon: Building2 }
    ];
  }
  
  // Vendedor, Gestor, Comisionista - sin Agencia
  if (userRole === 'Vendedor' || userRole === 'Gestor' || userRole === 'Comisionista') {
    return [
      { title: "Dashboard", pageName: "Dashboard", icon: LayoutDashboard },
      { title: "Vehículos", pageName: "Vehicles", icon: Car },
      { title: "CRM", pageName: "CRM", icon: Users },
      { title: "Clientes", pageName: "Clients", icon: Users, hidden: true }, // No visible en sidebar, pero permitido
      { title: "Tareas", pageName: "Tasks", icon: ClipboardList }
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

export default function Layout({ children }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

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

  // Mostrar spinner mientras se inicializa
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <style>{`
        [data-sidebar="sidebar"] { background: #1a1a1a !important; border: none !important; }
        [data-sidebar="sidebar"] * { border-color: #2a2a2a !important; }
        [data-sidebar="header"], [data-sidebar="footer"] { background: #1a1a1a !important; }
        [data-sidebar="content"] { background: #1a1a1a !important; }
      `}</style>
      <div className="min-h-screen flex w-full bg-gray-100">
        <Sidebar>
          <SidebarHeader className="p-4 pt-6 border-b border-gray-800">
            {/* Logo */}
            <div className="flex items-center justify-start mb-4 px-1 min-h-[60px]">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907cb67c59a0c423133fafc/b58f98fe8_LogosinfondoBOLDsinrueda.png" 
                alt="Automotores" 
                className="w-3/4 object-contain"
                loading="eager"
              />
            </div>

            {/* User Profile Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full bg-white rounded-lg p-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-semibold text-gray-900 truncate">{currentUser?.full_name || 'Usuario'}</p>
                    <p className="text-[9px] text-gray-500 truncate">{currentUser?.email || ''}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem className="text-[11px]" onClick={() => window.location.href = createPageUrl('Agency')}>
                  <User className="w-3.5 h-3.5 mr-2" />Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[11px]">
                  <Bell className="w-3.5 h-3.5 mr-2" />Notificaciones
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[11px] text-red-600" onClick={handleLogout}>
                  <LogOut className="w-3.5 h-3.5 mr-2" />Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>
          
          <SidebarContent className="p-2 pt-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1.5">
                      {getNavigationItems(userRole).filter(item => !item.hidden).map((item) => {
                    const pageUrl = createPageUrl(item.pageName);
                    const isActive = location.pathname === pageUrl;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`rounded transition-all duration-100 ${
                            isActive 
                              ? 'bg-gray-700 text-white' 
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <Link to={pageUrl} onClick={() => { window.dispatchEvent(new CustomEvent('resetModuleView', { detail: item.pageName })); }} className="flex items-center gap-2.5 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="text-[13px] font-normal">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-3">
            {/* Exchange Rates */}
            <div className="rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cotizaciones</span>
                <button 
                  onClick={fetchRates} 
                  disabled={isUpdatingRate}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 text-gray-500 ${isUpdatingRate ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-white rounded-md p-2">
                  <p className="text-[9px] font-bold text-cyan-600 uppercase">Blue</p>
                  <p className="text-gray-900 font-bold text-sm">${blueRate?.toLocaleString('es-AR') || '-'}</p>
                </div>
                <div className="bg-white rounded-md p-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Oficial</p>
                  <p className="text-gray-900 font-bold text-sm">${oficialRate?.toLocaleString('es-AR') || '-'}</p>
                </div>
              </div>
              {lastUpdate && (
                <p className="text-[9px] text-gray-400 mt-2 text-center bg-gray-800 rounded py-1">
                  Actualizado {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* App Settings Button - Solo para Gerente/Admin */}
            {canAccessSettings(userRole) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-2.5 flex items-center gap-2.5 transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-[11px] text-gray-300 flex-1 text-left">Configuración</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem className="text-[11px]" onClick={() => window.location.href = createPageUrl('Agency')}>
                    <Building2 className="w-3.5 h-3.5 mr-2" />Datos de Agencia
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[11px]" onClick={() => window.location.href = createPageUrl('Agency')}>
                    <Users className="w-3.5 h-3.5 mr-2" />Usuarios y Permisos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[11px]">
                    <FileText className="w-3.5 h-3.5 mr-2" />Plantillas de Documentos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[11px]">
                    <Calculator className="w-3.5 h-3.5 mr-2" />Cotizaciones Personalizadas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5 mr-2" />Ayuda y Soporte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 px-3 py-2 lg:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="p-1" />
              <span className="text-xs font-medium">Padrani</span>
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-gray-100">
            {userRole === null ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              </div>
            ) : userRole === '__none__' ? (
              <LoginScreen onLogin={handleLogin} />
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
