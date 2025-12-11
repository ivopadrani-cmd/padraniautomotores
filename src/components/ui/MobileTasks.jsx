import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, Check, Eye, Filter, Clock, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams, useNavigate } from "react-router-dom";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import MobileHeader from "./MobileHeader";
import { MobileList } from "./MobileTable";
import TaskDetailDialog from "../tasks/TaskDetailDialog";

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

const PRIORITY_CONFIG = {
  'Baja': { bg: 'bg-gray-100 text-gray-600', level: 1 },
  'Media': { bg: 'bg-gray-200 text-gray-700', level: 2 },
  'Alta': { bg: 'bg-orange-100 text-orange-700', level: 3 },
  'Urgente': { bg: 'bg-red-100 text-red-700', level: 4 }
};

export default function MobileTasks() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-task_date')
  });

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  // Sort tasks: urgent first, then by date
  const sortedTasks = filteredTasks.sort((a, b) => {
    const priorityA = PRIORITY_CONFIG[a.priority]?.level || 0;
    const priorityB = PRIORITY_CONFIG[b.priority]?.level || 0;

    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }

    // Then by date
    const dateA = new Date(`${a.task_date}T${a.task_time || '00:00'}`);
    const dateB = new Date(`${b.task_date}T${b.task_time || '00:00'}`);
    return dateA - dateB;
  });

  // Set selected task from URL param
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
      }
    }
  }, [taskId, tasks]);

  const handleViewTask = (task) => {
    setSelectedTask(task);
    navigate(`/tasks/${task.id}`);
  };

  const handleCompleteTask = (taskId) => {
    // This would be handled by the TaskDetailDialog
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pendiente'];
    return (
      <Badge className={`${config.bg} text-xs`}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Media'];
    return (
      <Badge className={`${config.bg} text-xs`}>
        {priority}
      </Badge>
    );
  };

  const getTaskTypeIcon = (taskType) => {
    const config = TASK_TYPE_CONFIG[taskType] || TASK_TYPE_CONFIG['Tarea'];
    return config.icon;
  };

  const isOverdue = (task) => {
    if (task.status === 'Completada' || task.status === 'Cancelada') return false;
    if (!task.task_date) return false;

    const taskDate = new Date(`${task.task_date}T${task.task_time || '23:59'}`);
    return isBefore(taskDate, new Date());
  };

  const isDueToday = (task) => {
    if (!task.task_date) return false;
    return isToday(new Date(task.task_date));
  };

  const renderTaskItem = (task) => (
    <Card
      key={task.id}
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue(task) ? 'border-red-200 bg-red-50' :
        isDueToday(task) ? 'border-orange-200 bg-orange-50' :
        'border-gray-200'
      }`}
      onClick={() => handleViewTask(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getTaskTypeIcon(task.task_type)}</span>
              <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Clock className="w-3 h-3" />
              {task.task_date && task.task_time ?
                format(new Date(`${task.task_date}T${task.task_time}`), "d 'de' MMMM, HH:mm", { locale: es }) :
                format(new Date(task.task_date), "d 'de' MMMM", { locale: es })
              }
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
              {task.responsible && (
                <Badge variant="outline" className="text-xs">
                  {task.responsible}
                </Badge>
              )}
            </div>

            {isOverdue(task) && (
              <div className="flex items-center gap-1 mt-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Vencida</span>
              </div>
            )}
          </div>

          <div className="ml-2">
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isMobile) return null;

  return (
    <div className="p-4 space-y-4">
      <MobileHeader
        title="Tareas"
        subtitle={`${sortedTasks.length} tareas`}
        actions={[
          {
            icon: Filter,
            onClick: () => setShowFilters(!showFilters),
          },
          {
            icon: Plus,
            onClick: () => setShowTaskForm(true),
            label: "Nueva"
          }
        ]}
      />

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {Object.keys(STATUS_CONFIG).map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Prioridad</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las prioridades</SelectItem>
                  {Object.keys(PRIORITY_CONFIG).map(priority => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <MobileList
        data={sortedTasks}
        renderItem={renderTaskItem}
        keyField="id"
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            navigate('/Tasks');
          }
        }}
        task={selectedTask}
        onComplete={handleCompleteTask}
      />
    </div>
  );
}
