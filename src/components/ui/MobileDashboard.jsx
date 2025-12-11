import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Users, UserPlus, Calendar, Clock, Bell, AlertTriangle, Wrench, Check, RotateCcw, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeader from "./MobileHeader";
import { MobileCard, MobileCardField } from "./MobileTable";

const TASK_TYPE_CONFIG = {
  'Tarea': { bg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400', icon: '○' },
  'Trámite': { bg: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500', icon: '◇' },
  'Servicio': { bg: 'bg-gray-300 text-gray-700', dot: 'bg-gray-500', icon: '◎' },
  'Gestoría': { bg: 'bg-cyan-200 text-cyan-800', dot: 'bg-cyan-600', icon: '□' },
  'Evento': { bg: 'bg-gray-900 text-white', dot: 'bg-gray-900', icon: '◆' },
  'Seguimiento': { bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: '◐' }
};

export default function MobileDashboard() {
  const isMobile = useIsMobile();
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const dismissed = localStorage.getItem('dismissedNotifications');
    if (dismissed) setDismissedNotifications(JSON.parse(dismissed));
  }, []);

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list('-consultation_date') });
  const { data: calendarEvents = [] } = useQuery({ queryKey: ['calendar-events'], queryFn: () => base44.entities.CalendarEvent.list('-event_date') });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-task_date') });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-sale_date') });

  // Peritajes pendientes de aprobación
  const { data: pendingInspections = [] } = useQuery({
    queryKey: ['pending-inspections'],
    queryFn: () => base44.entities.VehicleInspection.filter({ status: 'Pendiente aprobación' }, '-inspection_date'),
    refetchInterval: 15000,
  });

  // Merge calendar events and tasks into unified events list
  const events = [
    ...calendarEvents.map(e => ({ ...e, source: 'calendar' })),
    ...tasks.map(t => ({
      id: t.id,
      title: t.title,
      event_date: t.task_date,
      event_time: t.task_time,
      event_type: t.task_type,
      status: t.status,
      priority: t.priority === 'Urgente' ? 'URGENTE' : t.priority === 'Alta' ? 'ALTA' : t.priority === 'Media' ? 'MEDIA' : 'BAJA',
      description: t.description,
      source: 'task'
    }))
  ];

  const availableVehicles = vehicles.filter(v => v.status === 'DISPONIBLE').length;
  const reservedVehicles = vehicles.filter(v => v.status === 'RESERVADO').length;
  const activeLeads = leads.filter(l => l.status !== 'Concretado' && l.status !== 'Perdido').length;
  const todayEvents = events.filter(e => {
    if (!e.event_date) return false;
    const eventDate = new Date(e.event_date + 'T12:00:00');
    return isSameDay(eventDate, new Date());
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySales = sales.filter(s => { const d = new Date(s.sale_date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; });

  const upcomingEvents = events
    .filter(e => e.status !== 'Realizada' && e.status !== 'Cancelada' && e.status !== 'Completada' && !isBefore(startOfDay(new Date(e.event_date)), startOfDay(new Date())))
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  // Notifications: tasks within 1 hour or overdue, filtered by responsible user
  const now = new Date();
  const notifications = tasks.filter(t => {
    if (t.status === 'Completada' || t.status === 'Cancelada') return false;
    if (!t.task_date) return false;
    if (dismissedNotifications.includes(t.id)) return false;

    // Filter by responsible: show if user is responsible or if no responsible assigned
    if (currentUser && t.responsible && t.responsible !== currentUser.full_name && t.responsible !== currentUser.email) {
      return false;
    }

    const taskDateTime = new Date(`${t.task_date}T${t.task_time || '00:00'}`);
    const timeDiff = (taskDateTime - now) / (1000 * 60 * 60); // hours

    return timeDiff <= 1 && timeDiff >= -24; // within 1 hour ahead or up to 24 hours overdue
  });

  const dismissNotification = (taskId) => {
    const newDismissed = [...dismissedNotifications, taskId];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
  };

  if (!isMobile) return null;

  return (
    <div className="p-4 space-y-4">
      <MobileHeader
        title="Dashboard"
        subtitle={`${format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Car className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{availableVehicles}</p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{reservedVehicles}</p>
                <p className="text-sm text-gray-600">Reservados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeLeads}</p>
                <p className="text-sm text-gray-600">Leads Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{monthlySales.length}</p>
                <p className="text-sm text-gray-600">Ventas Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Notificaciones</h3>
            </div>
            <div className="space-y-2">
              {notifications.map(task => (
                <div key={task.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(`${task.task_date}T${task.task_time}`), "HH:mm")}
                        </Badge>
                        {task.priority === 'URGENTE' && (
                          <Badge variant="destructive" className="text-xs">URGENTE</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(task.id)}
                      className="p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Inspections */}
      {pendingInspections.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Peritajes Pendientes</h3>
              <Badge variant="outline" className="ml-auto bg-orange-100 text-orange-800">
                {pendingInspections.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {pendingInspections.slice(0, 3).map(inspection => {
                const vehicle = vehicles.find(v => v.id === inspection.vehicle_id);
                return (
                  <div key={inspection.id} className="bg-white rounded-lg p-3 border border-orange-200">
                    <p className="font-medium text-gray-900">{vehicle?.brand} {vehicle?.model}</p>
                    <p className="text-sm text-gray-600">{vehicle?.license_plate}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(inspection.inspection_date), "d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Eventos de Hoy</h3>
            </div>
            <div className="space-y-2">
              {todayEvents.slice(0, 3).map(event => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.event_time}</p>
                    </div>
                    <Badge
                      variant={event.priority === 'URGENTE' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {event.event_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Próximos Eventos</h3>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(event.event_date), "d 'de' MMMM", { locale: es })}
                        {event.event_time && `, ${event.event_time}`}
                      </p>
                    </div>
                    <Badge
                      variant={event.priority === 'URGENTE' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {event.event_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to={createPageUrl('Vehicles')}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Car className="w-6 h-6" />
                <span className="text-sm">Ver Vehículos</span>
              </Button>
            </Link>
            <Link to={createPageUrl('CRM')}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Ver CRM</span>
              </Button>
            </Link>
            <Link to={createPageUrl('Tasks')}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Check className="w-6 h-6" />
                <span className="text-sm">Ver Tareas</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm">Cotizaciones</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
