import React, { useRef, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Edit, CheckCircle, XCircle, AlertTriangle, Trash2, Car, Wrench, Droplets, Paintbrush, Settings, FileText, Gauge, Thermometer, Battery, Lightbulb, Wind, Sofa, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const GENERAL_COMPONENTS = [
  { key: 'engine_status', label: 'Estado del motor', icon: Settings },
  { key: 'fluid_leaks', label: 'Pérdida de fluidos', icon: Droplets },
  { key: 'gearbox_status', label: 'Estado de la caja', icon: Settings },
  { key: 'four_wheel_drive', label: 'Estado 4x4', icon: Car },
  { key: 'suspension', label: 'Suspensión', icon: Car },
  { key: 'brakes_system', label: 'Sistema de Frenos', icon: Car },
  { key: 'brakes_wear', label: 'Desgaste Frenos', icon: Gauge },
  { key: 'electrical_faults', label: 'Fallas eléctricas', icon: Lightbulb },
  { key: 'lights_status', label: 'Faros y ópticas', icon: Lightbulb },
  { key: 'upholstery_status', label: 'Tapizados', icon: Sofa },
  { key: 'steering_wheel_wear', label: 'Desgaste volante', icon: Car },
  { key: 'windows_status', label: 'Vidrios', icon: Car },
  { key: 'hail_damage', label: 'Bollos granizo', icon: Car },
  { key: 'air_conditioning', label: 'Aire acondicionado', icon: Wind },
  { key: 'heating', label: 'Calefacción', icon: Thermometer },
  { key: 'battery_status', label: 'Batería', icon: Battery },
];

const TIRES = [
  { key: 'front_right', label: 'Delantera Der.' },
  { key: 'front_left', label: 'Delantera Izq.' },
  { key: 'rear_right', label: 'Trasera Der.' },
  { key: 'rear_left', label: 'Trasera Izq.' },
];

const PAINT_PARTS = [
  { key: 'front', label: 'Frente' },
  { key: 'front_right_fender', label: 'Guardab. Del. Der.' },
  { key: 'front_left_fender', label: 'Guardab. Del. Izq.' },
  { key: 'front_right_door', label: 'Puerta Del. Der.' },
  { key: 'front_left_door', label: 'Puerta Del. Izq.' },
  { key: 'rear_right_door', label: 'Puerta Tras. Der.' },
  { key: 'rear_left_door', label: 'Puerta Tras. Izq.' },
  { key: 'rear_right_fender', label: 'Guardab. Tras. Der.' },
  { key: 'rear_left_fender', label: 'Guardab. Tras. Izq.' },
  { key: 'rear', label: 'Parte Trasera' },
  { key: 'roof', label: 'Techo' },
];

// For general status (Bueno/Regular/Malo)
const getStatusBadge = (status) => {
  if (status === 'Bueno') return { bg: 'bg-green-100 text-green-700', label: status };
  if (status === 'Regular') return { bg: 'bg-amber-100 text-amber-700', label: status };
  if (status === 'Malo') return { bg: 'bg-red-100 text-red-700', label: status };
  return { bg: 'bg-gray-100 text-gray-500', label: status || '-' };
};

// For Yes/No questions where YES is BAD (leaks, faults, damage)
const getYesNoBadBadge = (status) => {
  if (status === 'Sí') return { bg: 'bg-red-100 text-red-700', label: status };
  if (status === 'No') return { bg: 'bg-green-100 text-green-700', label: status };
  return { bg: 'bg-gray-100 text-gray-500', label: status || '-' };
};

// For Yes/No questions where YES is GOOD (VTV, engraving, accessories)
const getYesNoGoodBadge = (status) => {
  if (status === 'Sí') return { bg: 'bg-green-100 text-green-700', label: status };
  if (status === 'No') return { bg: 'bg-red-100 text-red-700', label: status };
  return { bg: 'bg-gray-100 text-gray-500', label: status || '-' };
};

export default function InspectionView({ open, onOpenChange, inspection, vehicle, onEdit, onDelete }) {
  const printRef = useRef();
  const queryClient = useQueryClient();
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestRevisionMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VehicleInspection.update(inspection.id, {
        status: 'Revisión solicitada',
        revision_notes: revisionNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-to-inspect'] });
      setIsSubmitting(false);
      setShowRevisionForm(false);
      setRevisionNotes('');
      toast.success("Revisión solicitada al mecánico");
    },
    onError: () => {
      setIsSubmitting(false);
    }
  });

  const handleRequestRevision = () => {
    if (isSubmitting || !revisionNotes.trim()) return;
    setIsSubmitting(true);
    requestRevisionMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VehicleInspection.delete(inspection.id);
      // Clear vehicle inspection flags
      await base44.entities.Vehicle.update(vehicle.id, {
        inspection_decision_pending: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Peritaje eliminado");
      if (onDelete) onDelete();
      onOpenChange(false);
    }
  });

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este peritaje? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Peritaje - ${vehicle?.plate}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.3; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 8px; margin-bottom: 10px; }
        .title { font-size: 12pt; font-weight: 600; letter-spacing: 2px; }
        .subtitle { font-size: 8pt; color: #0891b2; }
        .vehicle-info { background: #f8fafc; border: 1px solid #0891b2; padding: 8px; margin-bottom: 10px; }
        .vehicle-title { font-size: 11pt; font-weight: 600; color: #0891b2; }
        .section { margin-bottom: 8px; }
        .section-title { font-size: 8pt; font-weight: 600; background: #1a1a1a; color: white; padding: 4px 6px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 7pt; }
        th, td { border: 1px solid #ddd; padding: 3px 4px; text-align: left; }
        th { background: #f0f0f0; font-weight: 600; }
        .status-good { color: #16a34a; }
        .status-regular { color: #d97706; }
        .status-bad { color: #dc2626; }
        .cost { text-align: right; }
        .total-box { background: #1a1a1a; color: white; padding: 10px; text-align: center; margin-top: 10px; }
        .total-label { font-size: 8pt; opacity: 0.8; }
        .total-value { font-size: 14pt; font-weight: 600; }
        .recommendation { text-align: center; padding: 8px; margin-top: 8px; font-weight: 600; font-size: 10pt; }
        .rec-tomar { background: #dcfce7; color: #16a34a; border: 2px solid #16a34a; }
        .rec-reparos { background: #fef3c7; color: #d97706; border: 2px solid #d97706; }
        .rec-no { background: #fee2e2; color: #dc2626; border: 2px solid #dc2626; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .obs { font-size: 7pt; color: #666; font-style: italic; }
      </style>
    </head><body>${printRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  if (!inspection) return null;

  const recConfig = {
    'TOMAR': { icon: CheckCircle, bg: 'bg-green-100 text-green-700 border-green-300', label: 'TOMAR' },
    'TOMAR CON REPAROS': { icon: AlertTriangle, bg: 'bg-amber-100 text-amber-700 border-amber-300', label: 'CON REPAROS' },
    'NO TOMAR': { icon: XCircle, bg: 'bg-red-100 text-red-700 border-red-300', label: 'NO TOMAR' },
  };
  const rec = recConfig[inspection.recommendation] || recConfig['TOMAR CON REPAROS'];
  const RecIcon = rec.icon;

  // Count issues
  const issues = GENERAL_COMPONENTS.filter(c => {
    const status = inspection.general_components?.[c.key]?.status;
    return status === 'Malo' || status === 'Regular';
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-[14px] font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Peritaje Vehicular
              </DialogTitle>
              <p className="text-[11px] text-gray-400 mt-1">
                {vehicle?.brand} {vehicle?.model} {vehicle?.year} • {vehicle?.plate}
              </p>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px] bg-transparent border-red-400 text-red-400 hover:bg-red-900 hover:text-red-300"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3 mr-1" />Eliminar
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" className="h-7 text-[10px] bg-transparent border-gray-500 text-gray-300 hover:bg-gray-800" onClick={onEdit}>
                  <Edit className="w-3 h-3 mr-1" />Editar
                </Button>
              )}
              <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700" onClick={handlePrint}>
                <Printer className="w-3 h-3 mr-1" />Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Summary Cards */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-4 gap-3">
              {/* Recommendation */}
              <Card className={`${rec.bg} border shadow-none`}>
                <CardContent className="p-3 text-center">
                  <RecIcon className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold uppercase">{rec.label}</p>
                </CardContent>
              </Card>

              {/* Cost */}
              <Card className="shadow-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">${(inspection.total_estimated_cost || 0).toLocaleString('es-AR')}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Costo estimado</p>
                </CardContent>
              </Card>

              {/* Issues */}
              <Card className="shadow-none">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{issues}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Observaciones</p>
                </CardContent>
              </Card>

              {/* Date */}
              <Card className="shadow-none">
                <CardContent className="p-3 text-center">
                  <p className="text-[13px] font-bold text-gray-900">{inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yy') : '-'}</p>
                  <p className="text-[9px] text-gray-500 uppercase">{inspection.inspector_name || 'Sin inspector'}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="general" className="p-4">
            <TabsList className="h-9 mb-4 w-full justify-start">
              <TabsTrigger value="general" className="text-[11px]">
                <Settings className="w-3.5 h-3.5 mr-1.5" />Mecánica
              </TabsTrigger>
              <TabsTrigger value="tires" className="text-[11px]">
                <Car className="w-3.5 h-3.5 mr-1.5" />Cubiertas
              </TabsTrigger>
              <TabsTrigger value="paint" className="text-[11px]">
                <Paintbrush className="w-3.5 h-3.5 mr-1.5" />Pintura
              </TabsTrigger>
              <TabsTrigger value="services" className="text-[11px]">
                <Wrench className="w-3.5 h-3.5 mr-1.5" />Servicios
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-[11px]">
                <FileText className="w-3.5 h-3.5 mr-1.5" />Notas
              </TabsTrigger>
            </TabsList>

            {/* General Components */}
            <TabsContent value="general" className="mt-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {GENERAL_COMPONENTS.map(c => {
                  const item = inspection.general_components?.[c.key] || {};
                  // Determine badge based on component type
                  let status;
                  let hasProblem = false;
                  
                  // Components where Sí = BAD (leaks, faults, damage, wear)
                  const yesIsBad = ['fluid_leaks', 'brakes_wear', 'electrical_faults', 'steering_wheel_wear', 'hail_damage'];
                  // Components where Sí = GOOD (things that work)
                  const yesIsGood = ['air_conditioning', 'heating'];
                  
                  if (yesIsBad.includes(c.key)) {
                    status = getYesNoBadBadge(item.status);
                    hasProblem = item.status === 'Sí';
                  } else if (yesIsGood.includes(c.key)) {
                    status = getYesNoGoodBadge(item.status);
                    hasProblem = item.status === 'No';
                  } else {
                    status = getStatusBadge(item.status);
                    hasProblem = item.status === 'Malo' || item.status === 'Regular';
                  }
                  
                  const Icon = c.icon;
                  return (
                    <div key={c.key} className={`p-3 rounded-lg border ${hasProblem ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-[11px] font-medium">{c.label}</span>
                        </div>
                        <Badge className={`${status.bg} text-[9px] px-2`}>{status.label}</Badge>
                      </div>
                      {(item.cost > 0 || item.observation) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                          {item.cost > 0 && <span className="text-[10px] font-semibold text-gray-700">${item.cost.toLocaleString('es-AR')}</span>}
                          {item.observation && <span className="text-[9px] text-gray-500 italic truncate max-w-[60%]">{item.observation}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Tires */}
            <TabsContent value="tires" className="mt-0">
              <div className="grid grid-cols-2 gap-3">
                {TIRES.map(t => {
                  const item = inspection.tires?.[t.key] || {};
                  const status = getStatusBadge(item.status);
                  return (
                    <Card key={t.key} className={`shadow-none ${item.status === 'Malo' ? 'border-red-200' : item.status === 'Regular' ? 'border-amber-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[12px] font-semibold">{t.label}</span>
                          <Badge className={`${status.bg} text-[10px]`}>{status.label}</Badge>
                        </div>
                        {item.brand && <p className="text-[10px] text-gray-500">Marca: {item.brand}</p>}
                        {item.cost > 0 && <p className="text-[11px] font-semibold text-gray-700 mt-1">${item.cost.toLocaleString('es-AR')}</p>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Other checks */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-[11px] font-semibold text-gray-700 mb-2">Otros controles</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* YES is GOOD */}
                  {[
                    { key: 'parts_engraving', label: 'Grabado autopartes' },
                    { key: 'vtv_valid', label: 'VTV vigente' },
                  ].map(item => {
                    const data = inspection[item.key] || {};
                    const status = getYesNoGoodBadge(data.status);
                    return (
                      <div key={item.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-[10px]">{item.label}</span>
                        <Badge className={`${status.bg} text-[9px]`}>{status.label}</Badge>
                      </div>
                    );
                  })}
                  {/* YES is BAD (leaks) */}
                  {[
                    { key: 'oil_leak_consumption', label: 'Pérdida/consumo aceite' },
                    { key: 'water_leak_consumption', label: 'Pérdida/consumo agua' },
                  ].map(item => {
                    const data = inspection[item.key] || {};
                    const status = getYesNoBadBadge(data.status);
                    return (
                      <div key={item.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-[10px]">{item.label}</span>
                        <Badge className={`${status.bg} text-[9px]`}>{status.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Paint */}
            <TabsContent value="paint" className="mt-0">
              <div className="grid grid-cols-3 gap-2">
                {PAINT_PARTS.map(p => {
                  const item = inspection.paint_detail?.[p.key] || {};
                  const isIntervened = item.intervened;
                  return (
                    <div key={p.key} className={`p-3 rounded-lg border ${isIntervened ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
                      <p className="text-[10px] font-medium text-gray-700">{p.label}</p>
                      <Badge className={`mt-1 text-[9px] ${isIntervened ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isIntervened ? 'Intervenida' : 'Original'}
                      </Badge>
                      {item.cost > 0 && <p className="text-[10px] font-semibold text-gray-600 mt-1">${item.cost.toLocaleString('es-AR')}</p>}
                      {item.observation && <p className="text-[9px] text-gray-500 mt-1 italic">{item.observation}</p>}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Services */}
            <TabsContent value="services" className="mt-0 space-y-3">
              {/* Timing Belt */}
              <Card className="shadow-none">
                <CardHeader className="py-2 px-4 bg-gray-50">
                  <p className="text-[11px] font-semibold">Distribución</p>
                </CardHeader>
                <CardContent className="p-4">
                  {inspection.timing_belt_change?.done ? (
                    <div className="space-y-2">
                      <div className="flex gap-4 text-[11px]">
                        <span><strong>Fecha:</strong> {inspection.timing_belt_change.date || '-'}</span>
                        <span><strong>KM:</strong> {inspection.timing_belt_change.kilometers?.toLocaleString('es-AR') || '-'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {inspection.timing_belt_change.belt && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Correa</Badge>}
                        {inspection.timing_belt_change.tensors && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Tensores</Badge>}
                        {inspection.timing_belt_change.water_pump && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Bomba agua</Badge>}
                        {inspection.timing_belt_change.chain && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Cadena</Badge>}
                      </div>
                      {inspection.timing_belt_change.cost > 0 && (
                        <p className="text-[11px] font-semibold">Costo: ${inspection.timing_belt_change.cost.toLocaleString('es-AR')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">Sin datos de distribución</p>
                  )}
                </CardContent>
              </Card>

              {/* Oil Service */}
              <Card className="shadow-none">
                <CardHeader className="py-2 px-4 bg-gray-50">
                  <p className="text-[11px] font-semibold">Servicio de aceite/filtros</p>
                </CardHeader>
                <CardContent className="p-4">
                  {inspection.oil_service?.done ? (
                    <div className="space-y-2">
                      <div className="flex gap-4 text-[11px]">
                        <span><strong>Fecha:</strong> {inspection.oil_service.date || '-'}</span>
                        <span><strong>KM:</strong> {inspection.oil_service.kilometers?.toLocaleString('es-AR') || '-'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {inspection.oil_service.oil && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Aceite</Badge>}
                        {inspection.oil_service.oil_filter && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Filtro aceite</Badge>}
                        {inspection.oil_service.air_filter && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Filtro aire</Badge>}
                        {inspection.oil_service.cabin_filter && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Filtro habitáculo</Badge>}
                        {inspection.oil_service.fuel_filter && <Badge className="bg-green-100 text-green-700 text-[9px]">✓ Filtro nafta</Badge>}
                      </div>
                      {inspection.oil_service.cost > 0 && (
                        <p className="text-[11px] font-semibold">Costo: ${inspection.oil_service.cost.toLocaleString('es-AR')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">Sin datos de servicio</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="mt-0">
              <Card className="shadow-none">
                <CardHeader className="py-2 px-4 bg-gray-50">
                  <p className="text-[11px] font-semibold">Observaciones generales</p>
                </CardHeader>
                <CardContent className="p-4">
                  {inspection.general_observations ? (
                    <p className="text-[12px] text-gray-700 whitespace-pre-wrap">{inspection.general_observations}</p>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic">Sin observaciones adicionales</p>
                  )}
                </CardContent>
              </Card>

              {inspection.extra_accessories_detail && (
                <Card className="shadow-none mt-3">
                  <CardHeader className="py-2 px-4 bg-cyan-50">
                    <p className="text-[11px] font-semibold text-cyan-700">Accesorios extras</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-[12px] text-gray-700">{inspection.extra_accessories_detail}</p>
                  </CardContent>
                </Card>
              )}

              {inspection.revision_notes && (
                <Card className="shadow-none mt-3 border-amber-200">
                  <CardHeader className="py-2 px-4 bg-amber-50">
                    <p className="text-[11px] font-semibold text-amber-700">Notas de revisión</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-[12px] text-amber-800">{inspection.revision_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Revision request form */}
              {showRevisionForm && (
                <Card className="shadow-none mt-3 border-amber-200">
                  <CardHeader className="py-2 px-4 bg-amber-50">
                    <p className="text-[11px] font-semibold text-amber-700">Solicitar revisión al mecánico</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      className="text-[11px]"
                      placeholder="Indicá qué debe revisar o corregir el mecánico..."
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => { setShowRevisionForm(false); setRevisionNotes(''); }}>
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700"
                        onClick={handleRequestRevision}
                        disabled={!revisionNotes.trim() || isSubmitting}
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Hidden print content */}
          <div ref={printRef} style={{ display: 'none' }}>
            {/* Header */}
            <div className="header">
              <p className="title">INFORME DE INSPECCIÓN VEHICULAR</p>
              <p className="subtitle">Peritaje Técnico</p>
            </div>

            {/* Vehicle Info */}
            <div className="vehicle-info">
              <p className="vehicle-title">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '6px', fontSize: '8pt' }}>
                <div><span style={{ color: '#666' }}>Dominio:</span> <strong>{vehicle?.plate || '-'}</strong></div>
                <div><span style={{ color: '#666' }}>KM:</span> <strong>{inspection.kilometers_at_inspection?.toLocaleString('es-AR') || '-'}</strong></div>
                <div><span style={{ color: '#666' }}>Fecha:</span> <strong>{inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yyyy') : '-'}</strong></div>
                <div><span style={{ color: '#666' }}>Inspector:</span> <strong>{inspection.inspector_name || '-'}</strong></div>
              </div>
            </div>

            {/* General Components */}
            <div className="section">
              <p className="section-title">ESTADO GENERAL DE COMPONENTES</p>
              <table>
                <thead><tr><th>Componente</th><th>Estado</th><th className="cost">Costo</th><th>Observación</th></tr></thead>
                <tbody>
                  {GENERAL_COMPONENTS.map(c => {
                    const item = inspection.general_components?.[c.key] || {};
                    const statusClass = item.status === 'Bueno' || item.status === 'Sí' ? 'status-good' : item.status === 'Malo' || item.status === 'No' ? 'status-bad' : 'status-regular';
                    return (
                      <tr key={c.key}>
                        <td>{c.label}</td>
                        <td className={statusClass}>{item.status || '-'}</td>
                        <td className="cost">${(item.cost || 0).toLocaleString('es-AR')}</td>
                        <td className="obs">{item.observation || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tires */}
            <div className="grid-2">
              <div className="section">
                <p className="section-title">CUBIERTAS</p>
                <table>
                  <thead><tr><th>Cubierta</th><th>Estado</th><th className="cost">Costo</th></tr></thead>
                  <tbody>
                    {TIRES.map(t => {
                      const item = inspection.tires?.[t.key] || {};
                      const statusClass = item.status === 'Bueno' ? 'status-good' : item.status === 'Malo' ? 'status-bad' : 'status-regular';
                      return (
                        <tr key={t.key}>
                          <td>{t.label}</td>
                          <td className={statusClass}>{item.status || '-'}</td>
                          <td className="cost">${(item.cost || 0).toLocaleString('es-AR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="section">
                <p className="section-title">OTROS</p>
                <table>
                  <thead><tr><th>Item</th><th>Estado</th><th className="cost">Costo</th></tr></thead>
                  <tbody>
                    <tr><td>Grabado autopartes</td><td>{inspection.parts_engraving?.status || '-'}</td><td className="cost">${(inspection.parts_engraving?.cost || 0).toLocaleString('es-AR')}</td></tr>
                    <tr><td>VTV vigente</td><td>{inspection.vtv_valid?.status || '-'}</td><td className="cost">${(inspection.vtv_valid?.cost || 0).toLocaleString('es-AR')}</td></tr>
                    <tr><td>Pérdida/consumo aceite</td><td>{inspection.oil_leak_consumption?.status || '-'}</td><td className="cost">${(inspection.oil_leak_consumption?.cost || 0).toLocaleString('es-AR')}</td></tr>
                    <tr><td>Pérdida/consumo agua</td><td>{inspection.water_leak_consumption?.status || '-'}</td><td className="cost">${(inspection.water_leak_consumption?.cost || 0).toLocaleString('es-AR')}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paint */}
            <div className="section">
              <p className="section-title">DETALLE DE PINTURA</p>
              <table>
                <thead><tr><th>Parte</th><th>Intervenida</th><th className="cost">Costo</th><th>Observación</th></tr></thead>
                <tbody>
                  {PAINT_PARTS.map(p => {
                    const item = inspection.paint_detail?.[p.key] || {};
                    return (
                      <tr key={p.key}>
                        <td>{p.label}</td>
                        <td className={item.intervened ? 'status-bad' : 'status-good'}>{item.intervened ? 'Sí' : 'No'}</td>
                        <td className="cost">${(item.cost || 0).toLocaleString('es-AR')}</td>
                        <td className="obs">{item.observation || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Observations */}
            {inspection.general_observations && (
              <div className="section" style={{ marginTop: '8px' }}>
                <p className="section-title">OBSERVACIONES GENERALES</p>
                <p style={{ fontSize: '8pt', padding: '6px', background: '#f8fafc', border: '1px solid #ddd' }}>{inspection.general_observations}</p>
              </div>
            )}

            {/* Total & Recommendation */}
            <div className="total-box">
              <p className="total-label">COSTO TOTAL ESTIMADO DE REPARACIONES</p>
              <p className="total-value">${(inspection.total_estimated_cost || 0).toLocaleString('es-AR')}</p>
            </div>

            <div className={`recommendation ${inspection.recommendation === 'TOMAR' ? 'rec-tomar' : inspection.recommendation === 'NO TOMAR' ? 'rec-no' : 'rec-reparos'}`}>
              RECOMENDACIÓN: {inspection.recommendation}
            </div>
          </div>
        </div>

        {/* Footer with revision button */}
        {onEdit && (inspection?.status === 'Aprobado' || inspection?.status === 'Edición aprobada') && (
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
            {!showRevisionForm ? (
              <Button 
                variant="outline" 
                className="h-8 text-[11px]"
                onClick={() => setShowRevisionForm(true)}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />Solicitar revisión
              </Button>
            ) : (
              <div className="flex-1 mr-4">
                <Textarea
                  className="text-[11px] mb-2"
                  placeholder="Indicá qué debe revisar o corregir el mecánico..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => { setShowRevisionForm(false); setRevisionNotes(''); }}>
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700"
                    onClick={handleRequestRevision}
                    disabled={!revisionNotes.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                  </Button>
                </div>
              </div>
            )}
            {!showRevisionForm && (
              <div className="flex gap-2">
                <Button variant="outline" className="h-8 text-[11px]" onClick={onEdit}>
                  <Edit className="w-3.5 h-3.5 mr-1" />Editar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}