import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Check, X, Edit, Eye, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import TaskDetailDialog from "../components/tasks/TaskDetailDialog";
import MobileTasks from "../components/ui/MobileTasks";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";

const TASK_TYPE_CONFIG = {
  'Tarea': { bg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-500', icon: '○' },
  'Trámite': { bg: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500', icon: '◇' },
  'Servicio': { bg: 'bg-gray-300 text-gray-700', dot: 'bg-gray-600', icon: '◎' },
  'Gestoría': { bg: 'bg-cyan-200 text-cyan-800', dot: 'bg-cyan-600', icon: '□' },
  'Evento': { bg: 'bg-gray-900 text-white', dot: 'bg-gray-900', icon: '◆' },
  'Seguimiento': { bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: '◐' }
};

const STATUS_CONFIG = { 
  'Pendiente': { bg: 'bg-gray-100 text-gray-700', icon: '○' }, 
  'En proceso': { bg: 'bg-cyan-100 text-cyan-700', icon: '◐' }, 
  'Completada': { bg: 'bg-gray-800 text-white', icon: '●' }, 
  'Cancelada': { bg: 'bg-gray-200 text-gray-500', icon: '✕' } 
};

export default function Tasks() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Reset to list when clicking module in sidebar
  React.useEffect(() => {
    const handleReset = (e) => {
      if (e.detail === 'Tasks') {
        setSelectedTask(null);
        navigate('/Tasks');
      }
    };
    window.addEventListener('resetModuleView', handleReset);
    return () => window.removeEventListener('resetModuleView', handleReset);
  }, [navigate]);
  
  const [view, setView] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const [formData, setFormData] = useState({
    title: '', task_date: new Date().toISOString().split('T')[0], task_time: '', task_type: 'Tarea',
    related_vehicle_id: '', related_vehicle_description: '',
    related_client_id: '', related_client_name: '', 
    related_sale_id: '', related_sale_description: '',
    related_lead_id: '', related_lead_description: '',
    responsible: '', description: '', status: 'Pendiente', priority: 'Media', cost: ''
  });

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-task_date') });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: sellers = [] } = useQuery({ queryKey: ['sellers'], queryFn: () => base44.entities.Seller.filter({ is_active: true }) });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: () => base44.entities.Sale.list('-sale_date') });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list('-consultation_date') });

  // Query para tarea específica
  const { data: specificTask, isLoading: isLoadingTask } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => base44.entities.Task.get(taskId),
    enabled: !!taskId,
  });

  // Sincronizar selectedTask con URL
  useEffect(() => {
    if (taskId && specificTask) {
      setSelectedTask(specificTask);
    } else if (!taskId) {
      setSelectedTask(null);
    }
  }, [taskId, specificTask]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); resetForm(); toast.success("Tarea creada"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); resetForm(); toast.success("Tarea actualizada"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); toast.success("Tarea eliminada"); },
  });

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedTasks.length} tarea(s)?`)) return;
    for (const id of selectedTasks) await base44.entities.Task.delete(id);
    setSelectedTasks([]);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    toast.success(`${selectedTasks.length} tarea(s) eliminada(s)`);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({ title: '', task_date: new Date().toISOString().split('T')[0], task_time: '', task_type: 'Tarea', related_vehicle_id: '', related_vehicle_description: '', related_client_id: '', related_client_name: '', related_sale_id: '', related_sale_description: '', related_lead_id: '', related_lead_description: '', responsible: '', description: '', status: 'Pendiente', priority: 'Media', cost: '' });
  };

  const handleSelectTask = (task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleCloseTask = () => {
    navigate('/Tasks');
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title, task_date: task.task_date, task_time: task.task_time || '', task_type: task.task_type,
      related_vehicle_id: task.related_vehicle_id || '', related_vehicle_description: task.related_vehicle_description || '',
      related_client_id: task.related_client_id || '', related_client_name: task.related_client_name || '',
      related_sale_id: task.related_sale_id || '', related_sale_description: task.related_sale_description || '',
      related_lead_id: task.related_lead_id || '', related_lead_description: task.related_lead_description || '',
      responsible: task.responsible || '', description: task.description || '', status: task.status, priority: task.priority, cost: task.cost?.toString() || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, cost: formData.cost ? parseFloat(formData.cost) : null };
    editingTask ? updateMutation.mutate({ id: editingTask.id, data }) : createMutation.mutate(data);
  };

  const handleVehicleChange = (vehicleId) => {
    const v = vehicles.find(x => x.id === vehicleId);
    setFormData(prev => ({ ...prev, related_vehicle_id: vehicleId, related_vehicle_description: v ? `${v.brand} ${v.model} ${v.year}` : '' }));
  };

  const handleClientChange = (clientId) => {
    const c = clients.find(x => x.id === clientId);
    setFormData(prev => ({ ...prev, related_client_id: clientId, related_client_name: c?.full_name || '' }));
  };

  const handleSaleChange = (saleId) => {
    const s = sales.find(x => x.id === saleId);
    if (s) {
      setFormData(prev => ({ 
        ...prev, 
        related_sale_id: saleId, 
        related_sale_description: `${s.vehicle_description} - ${s.client_name}`,
        related_client_id: s.client_id || prev.related_client_id,
        related_client_name: s.client_name || prev.related_client_name,
        related_vehicle_id: s.vehicle_id || prev.related_vehicle_id,
        related_vehicle_description: s.vehicle_description || prev.related_vehicle_description
      }));
    } else {
      setFormData(prev => ({ ...prev, related_sale_id: '', related_sale_description: '' }));
    }
  };

  const handleLeadChange = (leadId) => {
    const l = leads.find(x => x.id === leadId);
    if (l) {
      const vehicleDesc = l.interested_vehicles?.length > 0 ? l.interested_vehicles[0].vehicle_description : '';
      const vehicleId = l.interested_vehicles?.length > 0 ? l.interested_vehicles[0].vehicle_id : '';
      setFormData(prev => ({ 
        ...prev, 
        related_lead_id: leadId, 
        related_lead_description: `${l.client_name} - ${l.client_phone}`,
        related_client_id: l.client_id || prev.related_client_id,
        related_client_name: l.client_name || prev.related_client_name,
        related_vehicle_id: vehicleId || prev.related_vehicle_id,
        related_vehicle_description: vehicleDesc || prev.related_vehicle_description
      }));
    } else {
      setFormData(prev => ({ ...prev, related_lead_id: '', related_lead_description: '' }));
    }
  };

  const toggleComplete = (task) => {
    const newStatus = task.status === 'Completada' ? 'Pendiente' : 'Completada';
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const getTasksForDate = (date) => tasks.filter(t => {
    if (!t.task_date) return false;
    const taskDate = new Date(t.task_date + 'T12:00:00');
    return isSameDay(taskDate, date);
  });

  const filteredTasks = tasks.filter(t => filterStatus === 'ALL' || t.status === filterStatus);
  const upcomingTasks = filteredTasks.filter(t => t.status !== 'Completada' && t.status !== 'Cancelada').sort((a, b) => new Date(a.task_date) - new Date(b.task_date));

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  // Si está en móvil, mostrar versión móvil
  if (isMobile) {
    return <MobileTasks />;
  }

  return (
    <div className="p-3 md:p-4 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Tareas</h1>
          <div className="flex gap-2">
            {selectedTasks.length > 0 && (
              <Button variant="outline" onClick={handleBulkDelete} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar ({selectedTasks.length})
              </Button>
            )}
            {selectionMode ? (
              <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedTasks([]); }} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">Cancelar selección</Button>
            ) : (
              <Button variant="outline" onClick={() => setSelectionMode(true)} className="h-8 text-[11px]">Selección múltiple</Button>
            )}
            <Button onClick={() => setShowForm(true)} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva Tarea
            </Button>
          </div>
        </div>

        {taskId && isLoadingTask ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
          </div>
        ) : (
        <TaskDetailDialog 
          open={!!selectedTask} 
            onOpenChange={handleCloseTask} 
          task={selectedTask} 
          onEdit={handleEdit} 
          onComplete={toggleComplete} 
            onDelete={(id) => { deleteMutation.mutate(id); handleCloseTask(); }}
          clientPhone={selectedTask?.related_client_id ? clients.find(c => c.id === selectedTask.related_client_id)?.phone : (selectedTask?.related_lead_id ? leads.find(l => l.id === selectedTask.related_lead_id)?.client_phone : null)}
        />
        )}

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg"><DialogTitle className="text-sm font-semibold">{editingTask ? 'Editar' : 'Nueva'} Tarea</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={lbl}>Tipo *</Label>
                  <Select value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v })}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(TASK_TYPE_CONFIG).map(t => <SelectItem key={t} value={t} className="text-[11px]"><span className="mr-1">{TASK_TYPE_CONFIG[t].icon}</span>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={lbl}>Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent>{['Baja', 'Media', 'Alta', 'Urgente'].map(p => <SelectItem key={p} value={p} className="text-[11px]">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div><Label className={lbl}>Título *</Label><Input className={inp} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              
              <div className="grid grid-cols-2 gap-2">
                <div><Label className={lbl}>Fecha *</Label><Input className={inp} type="date" value={formData.task_date} onChange={(e) => setFormData({ ...formData, task_date: e.target.value })} required /></div>
                <div><Label className={lbl}>Hora</Label><Input className={inp} type="time" value={formData.task_time} onChange={(e) => setFormData({ ...formData, task_time: e.target.value })} /></div>
              </div>

              {/* Vinculaciones - Orden lógico: primero lo que autocompleta */}
              <div className="p-3 bg-gray-50 rounded border space-y-2">
                <Label className="text-[10px] font-medium text-gray-600">Vincular a (opcional)</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className={lbl}>Venta</Label>
                    <Select value={formData.related_sale_id} onValueChange={handleSaleChange}>
                      <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar venta..." /></SelectTrigger>
                      <SelectContent>{sales.slice(0, 20).map(s => <SelectItem key={s.id} value={s.id} className="text-[11px]">{s.vehicle_description} - {s.client_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={lbl}>Consulta</Label>
                    <Select value={formData.related_lead_id} onValueChange={handleLeadChange}>
                      <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar consulta..." /></SelectTrigger>
                      <SelectContent>{leads.slice(0, 20).map(l => <SelectItem key={l.id} value={l.id} className="text-[11px]">{l.client_name} - {l.client_phone}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className={lbl}>Cliente</Label>
                    <Select value={formData.related_client_id} onValueChange={handleClientChange}>
                      <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                      <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={lbl}>Vehículo</Label>
                    <Select value={formData.related_vehicle_id} onValueChange={handleVehicleChange}>
                      <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar vehículo..." /></SelectTrigger>
                      <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id} className="text-[11px]">{v.brand} {v.model} {v.year}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {(formData.task_type === 'Trámite' || formData.task_type === 'Gestoría') && (
                <div><Label className={lbl}>Costo</Label><Input className={inp} type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="0" /></div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={lbl}>Responsable</Label>
                  <Select value={formData.responsible} onValueChange={(v) => setFormData({ ...formData, responsible: v })}>
                    <SelectTrigger className={inp}><SelectValue placeholder="Asignar..." /></SelectTrigger>
                    <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.full_name} className="text-[11px]">{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={lbl}>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent>{['Pendiente', 'En proceso', 'Completada', 'Cancelada'].map(s => <SelectItem key={s} value={s} className="text-[11px]"><span className="mr-1">{STATUS_CONFIG[s].icon}</span>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div><Label className={lbl}>Descripción</Label><Textarea className="text-[11px] min-h-[60px] bg-white" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={resetForm} className="h-8 text-[11px]">Cancelar</Button>
                <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">{editingTask ? 'Guardar' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Tabs value={view} onValueChange={setView}>
          <div className="flex justify-between items-center">
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="text-[11px]"><CalendarIcon className="w-3.5 h-3.5 mr-1.5" />Calendario</TabsTrigger>
              <TabsTrigger value="list" className="text-[11px]"><List className="w-3.5 h-3.5 mr-1.5" />Lista</TabsTrigger>
            </TabsList>
            {view === 'list' && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 text-[11px] bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-[11px]">Todos</SelectItem>
                  {['Pendiente', 'En proceso', 'Completada', 'Cancelada'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value="calendar" className="mt-3">
            <div className="grid lg:grid-cols-3 gap-3">
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                    <h2 className="font-semibold text-sm">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array(startDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                    {daysInMonth.map(day => {
                      const dayTasks = getTasksForDate(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`p-1.5 min-h-[50px] rounded cursor-pointer transition-colors ${isSelected ? 'bg-gray-900 text-white' : isToday(day) ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                          <div className="text-[11px] font-medium">{format(day, 'd')}</div>
                          {dayTasks.length > 0 && (
                            <div className="mt-0.5 flex gap-0.5 flex-wrap">
                              {dayTasks.slice(0, 3).map((t, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${TASK_TYPE_CONFIG[t.task_type]?.dot || 'bg-gray-400'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-[12px] font-semibold">{selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Próximas tareas'}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {(selectedDate ? getTasksForDate(selectedDate) : upcomingTasks.slice(0, 10)).map(task => (
                    <div key={task.id} className={`p-3 rounded border cursor-pointer hover:shadow-sm transition-shadow ${task.status === 'Completada' ? 'bg-gray-50 opacity-60' : 'bg-white'}`} onClick={() => setSelectedTask(task)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <button onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${task.status === 'Completada' ? 'bg-gray-800 border-gray-800 text-white' : 'border-gray-300'}`}>
                            {task.status === 'Completada' && <Check className="w-3 h-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-[11px] ${task.status === 'Completada' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className={`text-[9px] ${TASK_TYPE_CONFIG[task.task_type]?.bg || 'bg-gray-200 text-gray-900'}`}>{task.task_type}</Badge>
                              {!selectedDate && <span className="text-[9px] text-gray-400">{format(new Date(task.task_date), 'dd/MM')}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(task)}><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { if (window.confirm('¿Eliminar?')) deleteMutation.mutate(task.id); }}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(selectedDate ? getTasksForDate(selectedDate) : upcomingTasks).length === 0 && <p className="text-[11px] text-gray-500 text-center py-4">Sin tareas</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-3">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" /></div>
                ) : filteredTasks.length > 0 ? (
                  <div className="divide-y">
                    {selectionMode && (
                      <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                        <Checkbox checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0} onCheckedChange={() => setSelectedTasks(selectedTasks.length === filteredTasks.length ? [] : filteredTasks.map(t => t.id))} className="h-3.5 w-3.5" />
                        <span className="text-[10px] text-gray-500">Seleccionar todos</span>
                      </div>
                    )}
                    {filteredTasks.map(task => (
                      <div key={task.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${task.status === 'Completada' ? 'opacity-60' : ''} ${selectedTasks.includes(task.id) ? 'bg-cyan-50' : ''}`} onClick={() => selectionMode ? setSelectedTasks(prev => prev.includes(task.id) ? prev.filter(x => x !== task.id) : [...prev, task.id]) : handleSelectTask(task)}>
                        <div className="flex items-center gap-3 flex-1">
                          {selectionMode ? (
                            <Checkbox checked={selectedTasks.includes(task.id)} className="h-4 w-4" onClick={(e) => e.stopPropagation()} />
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); toggleComplete(task); }} className={`w-5 h-5 rounded border flex items-center justify-center ${task.status === 'Completada' ? 'bg-gray-800 border-gray-800 text-white' : 'border-gray-300'}`}>
                              {task.status === 'Completada' && <Check className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <div className="flex-1">
                            <p className={`font-medium text-[12px] ${task.status === 'Completada' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                              <span>{format(new Date(task.task_date), 'dd/MM/yy')}</span>
                              {task.task_time && <span>{task.task_time}</span>}
                              {task.related_vehicle_description && <span>• {task.related_vehicle_description}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Badge className={`text-[9px] ${TASK_TYPE_CONFIG[task.task_type]?.bg || 'bg-gray-200 text-gray-700'}`}><span className="mr-1">{TASK_TYPE_CONFIG[task.task_type]?.icon}</span>{task.task_type}</Badge>
                          <Badge className={`text-[9px] ${STATUS_CONFIG[task.status]?.bg}`}><span className="mr-1">{STATUS_CONFIG[task.status]?.icon}</span>{task.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(task)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar?')) deleteMutation.mutate(task.id); }}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10"><CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Sin tareas</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}