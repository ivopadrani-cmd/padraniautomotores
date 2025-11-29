import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Car, User, DollarSign, Edit, Check, Trash2, AlertTriangle, CalendarPlus, MessageCircle } from "lucide-react";
import { QuickContactButton } from "../common/WhatsAppButton";

const TASK_TYPE_CONFIG = {
  'Tarea': { bg: 'bg-gray-200 text-gray-700', icon: '○' },
  'Trámite': { bg: 'bg-cyan-100 text-cyan-700', icon: '◇' },
  'Servicio': { bg: 'bg-gray-300 text-gray-700', icon: '◎' },
  'Gestoría': { bg: 'bg-cyan-200 text-cyan-800', icon: '□' },
  'Evento': { bg: 'bg-gray-900 text-white', icon: '◆' },
  'Seguimiento': { bg: 'bg-purple-100 text-purple-700', icon: '◐' }
};

const STATUS_CONFIG = { 
  'Pendiente': { bg: 'bg-gray-100 text-gray-700', icon: '○' }, 
  'En proceso': { bg: 'bg-cyan-100 text-cyan-700', icon: '◐' }, 
  'Completada': { bg: 'bg-gray-800 text-white', icon: '●' }, 
  'Cancelada': { bg: 'bg-gray-200 text-gray-500', icon: '✕' } 
};

export default function TaskDetailDialog({ open, onOpenChange, task, onEdit, onComplete, onDelete, onScheduleFollowUp, clientPhone }) {
  if (!task) return null;

  const isOverdue = task.task_date && task.status !== 'Completada' && task.status !== 'Cancelada' && 
    isBefore(new Date(task.task_date + 'T' + (task.task_time || '23:59')), new Date());
  const isSeguimiento = task.task_type === 'Seguimiento';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] ${TASK_TYPE_CONFIG[task.task_type]?.bg || 'bg-gray-200 text-gray-700'}`}><span className="mr-1">{TASK_TYPE_CONFIG[task.task_type]?.icon}</span>{task.task_type}</Badge>
            <Badge className={`text-[10px] ${STATUS_CONFIG[task.status]?.bg}`}><span className="mr-1">{STATUS_CONFIG[task.status]?.icon}</span>{task.status}</Badge>
            {task.priority && <Badge className={`text-[10px] ${task.priority === 'Urgente' ? 'bg-red-100 text-red-700' : task.priority === 'Alta' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{task.priority}</Badge>}
            {isOverdue && <Badge className="text-[10px] bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Vencida</Badge>}
          </div>

          {/* Overdue warning for Seguimiento */}
          {isOverdue && isSeguimiento && onScheduleFollowUp && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-red-700">Este seguimiento está vencido</p>
                  <p className="text-[10px] text-red-600 mt-0.5">Puedes agendar un nuevo seguimiento para esta consulta.</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="h-7 text-[10px] mt-2 bg-red-600 hover:bg-red-700 w-full"
                onClick={() => onScheduleFollowUp(task)}
              >
                <CalendarPlus className="w-3 h-3 mr-1.5" />
                Agendar nuevo seguimiento
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-500">Fecha</p>
                <p className="font-medium">{task.task_date ? format(new Date(task.task_date), "d 'de' MMMM, yyyy", { locale: es }) : '-'}</p>
              </div>
            </div>
            {task.task_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Hora</p>
                  <p className="font-medium">{task.task_time}</p>
                </div>
              </div>
            )}
          </div>

          {(task.related_vehicle_description || task.related_client_name) && (
            <div className="p-3 bg-gray-50 rounded space-y-2">
              {task.related_vehicle_description && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Car className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{task.related_vehicle_description}</span>
                </div>
              )}
              {task.related_client_name && (
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{task.related_client_name}</span>
                  </div>
                  {clientPhone && <QuickContactButton phone={clientPhone} name={task.related_client_name} />}
                </div>
              )}
            </div>
          )}

          {task.cost && (
            <div className="flex items-center gap-2 text-[11px]">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="font-medium">${parseFloat(task.cost).toLocaleString('es-AR')}</span>
            </div>
          )}

          {task.description && (
            <div className="text-[11px]">
              <p className="text-gray-500 mb-1">Descripción</p>
              <p className="text-gray-700">{task.description}</p>
            </div>
          )}

          {task.responsible && (
            <div className="text-[11px]">
              <p className="text-gray-500">Responsable</p>
              <p className="font-medium">{task.responsible}</p>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t">
            <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => { onComplete(task); onOpenChange(false); }}>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {task.status === 'Completada' ? 'Marcar pendiente' : 'Completar'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => { onEdit(task); onOpenChange(false); }}>
                <Edit className="w-3.5 h-3.5 mr-1.5" />Editar
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[11px] text-red-500 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm('¿Eliminar?')) { onDelete(task.id); onOpenChange(false); } }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}