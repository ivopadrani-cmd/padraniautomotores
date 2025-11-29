import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const TASK_TYPE_CONFIG = {
  'Tarea': { bg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400' },
  'Trámite': { bg: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  'Servicio': { bg: 'bg-gray-300 text-gray-700', dot: 'bg-gray-500' },
  'Gestoría': { bg: 'bg-cyan-200 text-cyan-800', dot: 'bg-cyan-600' },
  'Evento': { bg: 'bg-gray-900 text-white', dot: 'bg-gray-900' },
  'Seguimiento': { bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' }
};

export default function ScheduleFollowUpDialog({ 
  open, 
  onOpenChange, 
  leadData,
  leadId,
  clients = []
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(leadData?.follow_up_date || '');
  const [selectedTime, setSelectedTime] = useState(leadData?.follow_up_time || '10:00');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => base44.entities.Task.list('-task_date') 
  });

  // Generate time options every 10 minutes
  const timeOptions = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 10) {
      timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const getTasksForDate = (date) => tasks.filter(t => {
    if (!t.task_date) return false;
    const taskDate = new Date(t.task_date + 'T12:00:00');
    return isSameDay(taskDate, date);
  });

  const selectedDateTasks = selectedDate ? getTasksForDate(new Date(selectedDate + 'T12:00:00')) : [];

  const checkDuplicate = () => {
    if (!leadId || !selectedDate || !selectedTime) return false;
    return tasks.some(t => 
      t.task_type === 'Seguimiento' && 
      t.related_lead_id === leadId && 
      t.task_date === selectedDate && 
      t.task_time === selectedTime
    );
  };

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (checkDuplicate()) {
      toast.error("Ya existe un seguimiento agendado para esta consulta en esa fecha y hora");
      return;
    }

    const existingClient = clients.find(c => c.phone === leadData.client_phone);
    const vehicleDesc = leadData.interested_vehicles?.length > 0 
      ? leadData.interested_vehicles.map(v => v.vehicle_description).join(', ')
      : '';
    
    await base44.entities.Task.create({
      title: `Seguimiento: ${leadData.client_name}`,
      task_date: selectedDate,
      task_time: selectedTime,
      task_type: 'Seguimiento',
      related_client_id: existingClient?.id,
      related_client_name: leadData.client_name,
      related_lead_id: leadId,
      related_lead_description: `${leadData.client_name} - ${leadData.client_phone}`,
      related_vehicle_description: vehicleDesc,
      description: `Seguimiento de consulta - Tel: ${leadData.client_phone}${leadData.client_email ? ' - Email: ' + leadData.client_email : ''}`,
      status: 'Pendiente',
      priority: leadData.interest_level === 'Muy alto' ? 'Alta' : leadData.interest_level === 'Alto' ? 'Alta' : 'Media'
    });

    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">Agendar Seguimiento - {leadData?.client_name}</DialogTitle>
        </DialogHeader>

        {showSuccess ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Seguimiento agendado</p>
            <p className="text-sm text-gray-500 mt-1">{format(new Date(selectedDate), "d 'de' MMMM", { locale: es })} a las {selectedTime}</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Calendar */}
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold text-sm capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array(startDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                  {daysInMonth.map(day => {
                    const dayTasks = getTasksForDate(day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`p-1.5 min-h-[40px] rounded cursor-pointer transition-colors text-center
                          ${isSelected ? 'bg-purple-600 text-white' : isToday(day) ? 'bg-gray-100' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className="text-[11px] font-medium">{format(day, 'd')}</div>
                        {dayTasks.length > 0 && (
                          <div className="flex justify-center gap-0.5 mt-0.5">
                            {dayTasks.slice(0, 3).map((t, i) => (
                              <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : TASK_TYPE_CONFIG[t.task_type]?.dot || 'bg-gray-400'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time & Tasks for selected day */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-1 block">Hora del seguimiento</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="h-8 text-[11px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {timeOptions.map(t => (
                        <SelectItem key={t} value={t} className="text-[11px]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-2 block">
                    Tareas del {selectedDate ? format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: es }) : 'día seleccionado'}
                  </label>
                  <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                    {selectedDateTasks.length > 0 ? (
                      <div className="divide-y">
                        {selectedDateTasks.sort((a, b) => (a.task_time || '').localeCompare(b.task_time || '')).map(task => (
                          <div key={task.id} className="p-2 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              {task.task_time && (
                                <span className="text-[10px] font-mono text-gray-500 w-10">{task.task_time}</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium truncate">{task.title}</p>
                                <Badge className={`text-[8px] ${TASK_TYPE_CONFIG[task.task_type]?.bg || 'bg-gray-200'}`}>
                                  {task.task_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-[11px] text-gray-400">
                        {selectedDate ? 'Sin tareas para este día' : 'Selecciona un día'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-[11px]">
                    Cancelar
                  </Button>
                  <Button onClick={handleSchedule} className="h-8 text-[11px] bg-purple-600 hover:bg-purple-700">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Guardar Seguimiento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}