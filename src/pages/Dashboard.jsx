import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Users, UserPlus, Calendar, ChevronLeft, ChevronRight, Clock, Bell, AlertTriangle, X, Wrench, Check, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import TaskDetailDialog from "../components/tasks/TaskDetailDialog";
import TaskFormDialog from "../components/tasks/TaskFormDialog";
import InspectionApprovalDialog from "../components/vehicles/InspectionApprovalDialog";

const TASK_TYPE_CONFIG = {
  'Tarea': { bg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400', icon: '○' },
  'Trámite': { bg: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500', icon: '◇' },
  'Servicio': { bg: 'bg-gray-300 text-gray-700', dot: 'bg-gray-500', icon: '◎' },
  'Gestoría': { bg: 'bg-cyan-200 text-cyan-800', dot: 'bg-cyan-600', icon: '□' },
  'Evento': { bg: 'bg-gray-900 text-white', dot: 'bg-gray-900', icon: '◆' },
  'Seguimiento': { bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: '◐' }
};

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    // Load dismissed notifications from localStorage
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
  
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionVehicle, setInspectionVehicle] = useState(null);

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
    
    const taskDateTime = new Date(t.task_date + 'T' + (t.task_time || '12:00') + ':00');
    const diffMs = taskDateTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Within 1 hour or already passed (but not more than 24 hours ago)
    return diffHours <= 1 && diffHours >= -24;
  }).map(t => {
    const taskDateTime = new Date(t.task_date + 'T' + (t.task_time || '12:00') + ':00');
    const isOverdue = taskDateTime < now;
    return { ...t, isOverdue };
  }).sort((a, b) => {
    // Overdue first, then by date
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return new Date(a.task_date + 'T' + (a.task_time || '12:00')) - new Date(b.task_date + 'T' + (b.task_time || '12:00'));
  });

  const dismissNotification = (taskId, e) => {
    e.stopPropagation();
    const newDismissed = [...dismissedNotifications, taskId];
    setDismissedNotifications(newDismissed);
    localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  
  const getEventsForDay = (day) => events.filter(e => {
    if (!e.event_date) return false;
    const eventDate = new Date(e.event_date + 'T12:00:00');
    return isSameDay(eventDate, day);
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const handleCompleteTask = (task) => {
    const newStatus = task.status === 'Completada' ? 'Pendiente' : 'Completada';
    updateTaskMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const handleEditTask = (task) => {
    setSelectedTask(null);
    setEditingTask(task);
  };

  const handleEventClick = (event) => {
    if (event.source === 'task') {
      const fullTask = tasks.find(t => t.id === event.id);
      if (fullTask) setSelectedTask(fullTask);
    }
  };

  const createTaskMutation = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Task.update(data.id, data) : base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    }
  });

  return (
    <div className="p-4 md:p-4 bg-gray-100 min-h-screen">
      <TaskDetailDialog 
        open={!!selectedTask} 
        onOpenChange={(o) => { if (!o) setSelectedTask(null); }} 
        task={selectedTask}
        onEdit={handleEditTask}
        onComplete={handleCompleteTask}
        onDelete={(id) => deleteTaskMutation.mutate(id)}
        onScheduleFollowUp={(task) => {
          setSelectedTask(null);
          setEditingTask({
            task_type: 'Seguimiento',
            task_date: new Date().toISOString().split('T')[0],
            related_lead_id: task.related_lead_id,
            related_lead_description: task.related_lead_description,
            related_client_id: task.related_client_id,
            related_client_name: task.related_client_name,
            title: `Seguimiento: ${task.related_client_name || task.title}`
          });
        }}
      />
      <TaskFormDialog
        open={!!editingTask}
        onOpenChange={(o) => { if (!o) setEditingTask(null); }}
        task={editingTask}
        onSubmit={(data) => createTaskMutation.mutate(data)}
        isLoading={createTaskMutation.isPending}
      />
      <div className="max-w-6xl mx-auto space-y-3">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Link to={createPageUrl("Vehicles")}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Stock Disponible</p>
                    <p className="text-2xl font-bold mt-0.5">{availableVehicles}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{reservedVehicles} reservados</p>
                  </div>
                  <Car className="w-5 h-5 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Clients")}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Clientes</p>
                    <p className="text-2xl font-bold mt-0.5">{clients.length}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{monthlySales.length} ventas este mes</p>
                  </div>
                  <Users className="w-5 h-5 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("CRM")}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Consultas Activas</p>
                    <p className="text-2xl font-bold mt-0.5">{activeLeads}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{leads.length} totales</p>
                  </div>
                  <UserPlus className="w-5 h-5 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Tasks")}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Eventos Hoy</p>
                    <p className="text-2xl font-bold mt-0.5">{todayEvents.length}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{upcomingEvents.length} próximos</p>
                  </div>
                  <Calendar className="w-5 h-5 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Peritajes pendientes de aprobación */}
        {pendingInspections.length > 0 && (
          <Card className="shadow-sm border-l-4 border-l-cyan-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-cyan-500" />
                <h2 className="text-sm font-semibold">Peritajes Pendientes de Aprobación ({pendingInspections.length})</h2>
              </div>
              <div className="space-y-2">
                {pendingInspections.map(inspection => {
                  const vehicle = vehicles.find(v => v.id === inspection.vehicle_id);
                  return (
                    <div 
                      key={inspection.id} 
                      className="p-3 bg-cyan-50 border border-cyan-200 rounded hover:shadow-sm cursor-pointer transition-colors"
                      onClick={() => { setSelectedInspection(inspection); setInspectionVehicle(vehicle); }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[12px] font-semibold">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
                          <p className="text-[10px] text-gray-500">
                            {vehicle?.plate || 'Sin dominio'} • Mecánico: {inspection.inspector_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[9px] ${
                            inspection.recommendation === 'TOMAR' ? 'bg-green-100 text-green-700' :
                            inspection.recommendation === 'NO TOMAR' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {inspection.recommendation}
                          </Badge>
                          <span className="text-[11px] font-bold">${inspection.total_estimated_cost?.toLocaleString('es-AR') || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <InspectionApprovalDialog
          open={!!selectedInspection}
          onOpenChange={(o) => { if (!o) { setSelectedInspection(null); setInspectionVehicle(null); } }}
          inspection={selectedInspection}
          vehicle={inspectionVehicle}
        />

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold">Notificaciones ({notifications.length})</h2>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 5).map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => {
                      const fullTask = tasks.find(t => t.id === task.id);
                      if (fullTask) setSelectedTask(fullTask);
                    }}
                    className={`p-2 rounded cursor-pointer transition-colors ${task.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'} hover:shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      {task.isOverdue ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-gray-500">
                            {format(new Date(task.task_date), 'dd/MM')} {task.task_time || ''}
                          </span>
                          <Badge className={`text-[8px] px-1.5 py-0 ${TASK_TYPE_CONFIG[task.task_type]?.bg || 'bg-gray-200 text-gray-700'}`}>
                            <span className="mr-0.5">{TASK_TYPE_CONFIG[task.task_type]?.icon}</span>{task.task_type}
                          </Badge>
                        </div>
                        {task.related_client_name && (
                          <p className="text-[9px] text-gray-500 mt-0.5">{task.related_client_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-medium flex-shrink-0 ${task.isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                          {task.isOverdue ? 'Vencida' : 'Próxima'}
                        </span>
                        <button 
                          onClick={(e) => dismissNotification(task.id, e)}
                          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar + Events */}
        <div className="grid md:grid-cols-3 gap-3">
          {/* Calendar */}
          <Card className="shadow-sm md:col-span-2">
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} className="text-center text-[9px] font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}
                {monthDays.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const hasEvents = dayEvents.length > 0;
                  
                  return (
                    <Link 
                      key={day.toString()} 
                      to={createPageUrl("Tasks")}
                      className={`h-8 flex flex-col items-center justify-center rounded text-[11px] transition-colors
                        ${isToday ? 'bg-sky-600 text-white font-bold' : 'hover:bg-gray-100'}
                      `}
                    >
                      <span>{format(day, 'd')}</span>
                      {hasEvents && !isToday && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-sky-500" />
                          ))}
                        </div>
                      )}
                      {hasEvents && isToday && (
                        <div className="w-1 h-1 rounded-full bg-white mt-0.5" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold">Próximos Eventos</h2>
                <Link to={createPageUrl("Tasks")}>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] px-2">Ver todos</Button>
                </Link>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.map(event => (
                    <div key={event.id} onClick={() => handleEventClick(event)} className="cursor-pointer">
                      <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-10 text-center">
                            <p className="text-[9px] text-gray-400 uppercase">{format(new Date(event.event_date), 'MMM', { locale: es })}</p>
                            <p className="text-sm font-bold">{format(new Date(event.event_date), 'd')}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{event.title}</p>
                            <Badge className={`text-[8px] px-1.5 py-0 ${TASK_TYPE_CONFIG[event.event_type]?.bg || 'bg-gray-200 text-gray-700'}`}>
                              <span className="mr-0.5">{TASK_TYPE_CONFIG[event.event_type]?.icon}</span>{event.event_type}
                            </Badge>
                            {event.event_time && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5 text-gray-400" />
                                <span className="text-[9px] text-gray-400">{event.event_time}</span>
                              </div>
                            )}
                          </div>
                          <Badge className={`text-[8px] px-1 py-0 flex-shrink-0 ${
                            event.priority === 'URGENTE' ? 'bg-red-100 text-red-700' :
                            event.priority === 'ALTA' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {event.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-[11px]">Sin eventos próximos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}