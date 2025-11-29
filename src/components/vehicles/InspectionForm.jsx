import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, Download, CheckCircle, XCircle, AlertTriangle, Wrench, Car, Paintbrush, Settings, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ['Bueno', 'Regular', 'Malo', 'No aplica'];
const YESNO_OPTIONS = ['Sí', 'No', 'No aplica'];
const SERVICE_ITEM_OPTIONS = ['Cambio realizado', 'Bueno', 'Necesita cambio', 'No aplica'];

// Reorganized sections for better coherence
const MOTOR_MECANICA = [
  { key: 'engine_status', label: 'Estado del motor', type: 'status' },
  { key: 'fluid_leaks', label: 'Presenta pérdida de fluidos', type: 'yesno' },
  { key: 'gearbox_status', label: 'Estado de la caja', type: 'status' },
  { key: 'four_wheel_drive', label: 'Estado 4x4', type: 'status' },
  { key: 'suspension', label: 'Suspensión', type: 'status' },
  { key: 'brakes_system', label: 'Sistema de Frenos', type: 'status' },
  { key: 'brakes_wear', label: 'Desgaste de Frenos', type: 'yesno' },
];

const ELECTRICA_LUCES = [
  { key: 'electrical_faults', label: 'Fallas sistema eléctrico', type: 'yesno' },
  { key: 'lights_status', label: 'Faros y ópticas', type: 'status' },
  { key: 'battery_status', label: 'Estado de batería', type: 'status' },
  { key: 'air_conditioning', label: 'Aire acondicionado funciona', type: 'yesno' },
  { key: 'heating', label: 'Calefacción funciona', type: 'yesno' },
];

const INTERIOR_CARROCERIA = [
  { key: 'upholstery_status', label: 'Estado tapizados', type: 'status' },
  { key: 'steering_wheel_wear', label: 'Desgaste volante', type: 'yesno' },
  { key: 'windows_status', label: 'Estado de vidrios', type: 'status' },
  { key: 'hail_damage', label: 'Bollos granizo', type: 'yesno' },
];

const TIRES = [
  { key: 'front_right', label: 'Cubierta DD (Delantera Derecha)' },
  { key: 'front_left', label: 'Cubierta DI (Delantera Izquierda)' },
  { key: 'rear_right', label: 'Cubierta TD (Trasera Derecha)' },
  { key: 'rear_left', label: 'Cubierta TI (Trasera Izquierda)' },
];

const PAINT_PARTS = [
  { key: 'front', label: 'Frente' },
  { key: 'front_right_fender', label: 'Guardabarro Del. Derecho' },
  { key: 'front_left_fender', label: 'Guardabarro Del. Izquierdo' },
  { key: 'front_right_door', label: 'Puerta Del. Derecha' },
  { key: 'front_left_door', label: 'Puerta Del. Izquierda' },
  { key: 'rear_right_door', label: 'Puerta Tras. Derecha' },
  { key: 'rear_left_door', label: 'Puerta Tras. Izquierda' },
  { key: 'rear_right_fender', label: 'Guardabarro Tras. Derecho' },
  { key: 'rear_left_fender', label: 'Guardabarro Tras. Izquierdo' },
  { key: 'rear', label: 'Parte Trasera' },
  { key: 'roof', label: 'Techo' },
];

const initFormData = (vehicle, existingInspection) => {
  if (existingInspection) return existingInspection;
  
  const generalComponents = {};
  [...MOTOR_MECANICA, ...ELECTRICA_LUCES, ...INTERIOR_CARROCERIA].forEach(c => {
    generalComponents[c.key] = { status: c.type === 'status' ? 'Bueno' : 'No', cost: 0, observation: '' };
  });
  
  const tires = {};
  TIRES.forEach(t => { tires[t.key] = { status: 'Bueno', cost: 0 }; });
  
  const paintDetail = {};
  PAINT_PARTS.forEach(p => { paintDetail[p.key] = { intervened: false, cost: 0, observation: '' }; });
  
  return {
    vehicle_id: vehicle?.id || '',
    vehicle_description: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : '',
    inspection_date: new Date().toISOString().split('T')[0],
    inspector_name: '',
    kilometers_at_inspection: vehicle?.kilometers || 0,
    general_components: generalComponents,
    tires,
    has_accessories: false,
    accessories_detail: '',
    timing_belt_change: { 
      done: false, 
      type: 'correa', // 'correa' or 'cadena'
      date: '', 
      kilometers: 0, 
      belt_or_chain: { status: 'Bueno', cost: 0, observation: '' },
      tensors: { status: 'Bueno', cost: 0, observation: '' }, 
      water_pump: { status: 'Bueno', cost: 0, observation: '' }, 
      cost: 0 
    },
    oil_service: { 
      done: false, 
      date: '', 
      kilometers: 0, 
      oil: { status: 'Bueno', cost: 0, observation: '' }, 
      oil_filter: { status: 'Bueno', cost: 0, observation: '' }, 
      air_filter: { status: 'Bueno', cost: 0, observation: '' }, 
      cabin_filter: { status: 'Bueno', cost: 0, observation: '' }, 
      fuel_filter: { status: 'Bueno', cost: 0, observation: '' }, 
      cost: 0 
    },
    original_accessories: {
      manuals: false,
      spare_key: false,
      spare_tire: false,
      jack: false,
      security_nut: false,
      fire_extinguisher: false
    },
    has_extra_accessories: false,
    extra_accessories_detail: '',
    oil_leak_consumption: { status: 'No', cost: 0, observation: '' },
    water_leak_consumption: { status: 'No', cost: 0, observation: '' },
    parts_engraving: { status: 'Sí', cost: 0 },
    vtv_valid: { status: 'No', cost: 0 },
    paint_detail: paintDetail,
    recommendation: 'TOMAR',
    total_estimated_cost: 0,
    general_observations: '',
    status: 'Aprobado'
  };
};

const ORIGINAL_ACCESSORIES = [
  { key: 'manuals', label: 'Manuales' },
  { key: 'spare_key', label: 'Duplicado llave' },
  { key: 'spare_tire', label: 'Auxilio' },
  { key: 'jack', label: 'Criquet' },
  { key: 'security_nut', label: 'Tuerca seguridad' },
  { key: 'fire_extinguisher', label: 'Matafuego' },
];

export default function InspectionForm({ open, onOpenChange, vehicle, existingInspection, isMechanicView = false }) {
  const [formData, setFormData] = useState(() => initFormData(vehicle, existingInspection));
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        const initialData = initFormData(vehicle, existingInspection);
        
        // Auto-fill inspector name for mechanics
        if (isMechanicView && !initialData.inspector_name) {
          try {
            const user = await base44.auth.me();
            initialData.inspector_name = user?.full_name || '';
            initialData.inspector_id = user?.id || '';
          } catch (e) {}
        }
        
        // Sync original accessories from vehicle if not in existing inspection
        if (!existingInspection && vehicle?.documentation_checklist?.accessories) {
          initialData.original_accessories = {
            manuals: vehicle.documentation_checklist.accessories.manuals || false,
            spare_key: vehicle.documentation_checklist.accessories.spare_key || false,
            spare_tire: vehicle.documentation_checklist.accessories.spare_tire || false,
            jack: vehicle.documentation_checklist.accessories.jack || false,
            security_nut: vehicle.documentation_checklist.accessories.security_nut || false,
            fire_extinguisher: vehicle.documentation_checklist.accessories.fire_extinguisher || false,
          };
        }
        setFormData(initialData);
      }
    };
    loadData();
  }, [open, vehicle, existingInspection, isMechanicView]);

  // Calculate total cost
  useEffect(() => {
    let total = 0;
    Object.values(formData.general_components || {}).forEach(c => { total += c.cost || 0; });
    Object.values(formData.tires || {}).forEach(t => { total += t.cost || 0; });
    Object.values(formData.paint_detail || {}).forEach(p => { total += p.cost || 0; });
    total += formData.timing_belt_change?.cost || 0;
    total += formData.oil_service?.cost || 0;
    total += formData.oil_leak_consumption?.cost || 0;
    total += formData.water_leak_consumption?.cost || 0;
    total += formData.parts_engraving?.cost || 0;
    total += formData.vtv_valid?.cost || 0;
    setFormData(prev => ({ ...prev, total_estimated_cost: total }));
  }, [formData.general_components, formData.tires, formData.paint_detail, formData.timing_belt_change, formData.oil_service, formData.oil_leak_consumption, formData.water_leak_consumption, formData.parts_engraving, formData.vtv_valid]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Sync original accessories with vehicle
      if (vehicle?.id && data.original_accessories) {
        const vehicleAccessories = vehicle.documentation_checklist?.accessories || {};
        const updatedAccessories = { ...vehicleAccessories };
        Object.keys(data.original_accessories).forEach(key => {
          updatedAccessories[key] = data.original_accessories[key];
        });
        await base44.entities.Vehicle.update(vehicle.id, {
          documentation_checklist: {
            ...vehicle.documentation_checklist,
            accessories: updatedAccessories
          }
        });
      }
      
      if (existingInspection?.id) {
        return base44.entities.VehicleInspection.update(existingInspection.id, data);
      }
      return base44.entities.VehicleInspection.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle?.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-to-inspect'] });
      queryClient.invalidateQueries({ queryKey: ['pending-inspections'] });
      toast.success(existingInspection ? "Peritaje actualizado" : "Peritaje guardado");
      setIsSubmitting(false);
      onOpenChange(false);
    },
    onError: () => {
      setIsSubmitting(false);
    }
  });

  const handleSave = (status = 'Borrador') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status });
  };

  const handleSubmitForApproval = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    saveMutation.mutate({ ...formData, status: 'Pendiente aprobación' });
  };

  const updateComponent = (section, key, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { ...prev[section][key], [field]: value }
      }
    }));
  };

  const handleDownloadTemplate = () => {
    // Generate interactive HTML form
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peritaje Vehicular - ${vehicle?.brand || ''} ${vehicle?.model || ''} ${vehicle?.plate || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; font-size: 12px; }
    .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #1a1a1a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { font-size: 18px; margin-bottom: 5px; }
    .header p { font-size: 11px; opacity: 0.7; }
    .section { padding: 15px 20px; border-bottom: 1px solid #eee; }
    .section-title { font-size: 11px; font-weight: 600; color: #0891b2; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 5px; border-bottom: 2px solid #0891b2; }
    .row { display: grid; grid-template-columns: 200px 120px 80px 1fr; gap: 8px; align-items: center; margin-bottom: 8px; padding: 6px; background: #fafafa; border-radius: 4px; }
    .row:hover { background: #f0f9ff; }
    .row label { font-size: 11px; color: #333; }
    select, input[type="text"], input[type="number"], input[type="date"], textarea { width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; }
    select:focus, input:focus, textarea:focus { outline: none; border-color: #0891b2; }
    .checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; }
    .checkbox-item { display: flex; align-items: center; gap: 5px; }
    .checkbox-item input { width: 14px; height: 14px; }
    .checkbox-item label { font-size: 11px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 10px; }
    .form-group label { display: block; font-size: 10px; color: #666; margin-bottom: 4px; text-transform: uppercase; }
    .total-box { background: #1a1a1a; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
    .total-box span { font-size: 11px; opacity: 0.7; }
    .total-box strong { font-size: 20px; }
    .recommendation { padding: 15px 20px; }
    .rec-options { display: flex; gap: 10px; margin-top: 10px; }
    .rec-option { flex: 1; padding: 12px; text-align: center; border: 2px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .rec-option:hover { border-color: #0891b2; }
    .rec-option.tomar { border-color: #22c55e; background: #f0fdf4; }
    .rec-option.reparos { border-color: #f59e0b; background: #fffbeb; }
    .rec-option.no-tomar { border-color: #ef4444; background: #fef2f2; }
    .rec-option input { display: none; }
    .rec-option input:checked + span { font-weight: 600; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; background: #0891b2; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .print-btn:hover { background: #0e7490; }
    @media print { .print-btn { display: none; } body { background: white; padding: 0; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PERITAJE VEHICULAR</h1>
      <p>${vehicle?.brand || ''} ${vehicle?.model || ''} ${vehicle?.year || ''} - ${vehicle?.plate || ''}</p>
    </div>

    <div class="section">
      <div class="section-title">Datos del Vehículo</div>
      <div class="grid-2" style="margin-bottom: 12px;">
        <div class="form-group"><label>Marca</label><input type="text" id="vehicle_brand" value="${vehicle?.brand || ''}" placeholder="Ej: Toyota"></div>
        <div class="form-group"><label>Modelo</label><input type="text" id="vehicle_model" value="${vehicle?.model || ''}" placeholder="Ej: Corolla"></div>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Año</label><input type="number" id="vehicle_year" value="${vehicle?.year || ''}" placeholder="Ej: 2020"></div>
        <div class="form-group"><label>Dominio</label><input type="text" id="vehicle_plate" value="${vehicle?.plate || ''}" placeholder="Ej: ABC123" style="text-transform: uppercase;"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Datos de la Inspección</div>
      <div class="grid-3">
        <div class="form-group"><label>Fecha de inspección</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label>Inspector/Mecánico</label><input type="text" placeholder="Nombre"></div>
        <div class="form-group"><label>Kilometraje</label><input type="number" value="${vehicle?.kilometers || ''}"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Motor y Mecánica</div>
      ${MOTOR_MECANICA.map(c => `<div class="row"><label>${c.label}</label><select><option>Bueno</option><option>Regular</option><option>Malo</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>`).join('')}
    </div>

    <div class="section">
      <div class="section-title">Cubiertas</div>
      ${TIRES.map(t => `<div class="row"><label>${t.label}</label><select><option>Bueno</option><option>Regular</option><option>Malo</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>`).join('')}
    </div>

    <div class="section">
      <div class="section-title">Sistema Eléctrico y Luces</div>
      ${ELECTRICA_LUCES.map(c => `<div class="row"><label>${c.label}</label><select><option>Bueno</option><option>Regular</option><option>Malo</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>`).join('')}
    </div>

    <div class="section">
      <div class="section-title">Interior y Carrocería</div>
      ${INTERIOR_CARROCERIA.map(c => `<div class="row"><label>${c.label}</label><select><option>Bueno</option><option>Regular</option><option>Malo</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>`).join('')}
    </div>

    <div class="section">
      <div class="section-title">Service Distribución</div>
      <div class="grid-2" style="margin-bottom: 12px;">
        <div class="form-group"><label>Tipo</label><select><option>Correa</option><option>Cadena</option></select></div>
        <div class="form-group"><label>Costo total</label><input type="number" placeholder="$"></div>
      </div>
      <div class="row"><label>Correa/Cadena</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Tensores</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Bomba de agua</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="grid-2" style="margin-top: 12px;">
        <div class="form-group"><label>Fecha del service</label><input type="date"></div>
        <div class="form-group"><label>Kilometraje</label><input type="number" placeholder="km"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Service Aceite y Filtros</div>
      <div class="form-group"><label>Costo total</label><input type="number" placeholder="$" style="width: 120px;"></div>
      <div class="row"><label>Aceite</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Filtro de aceite</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Filtro de aire</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Filtro de habitáculo</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Filtro de combustible</label><select><option>Cambio realizado</option><option>Bueno</option><option>Necesita cambio</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="grid-2" style="margin-top: 12px;">
        <div class="form-group"><label>Fecha del service</label><input type="date"></div>
        <div class="form-group"><label>Kilometraje</label><input type="number" placeholder="km"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Otros Controles</div>
      <div class="row"><label>Pérdida/consumo de aceite</label><select><option>No</option><option>Sí</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Pérdida/consumo de agua</label><select><option>No</option><option>Sí</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>Grabado de autopartes</label><select><option>Sí</option><option>No</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
      <div class="row"><label>VTV vigente</label><select><option>Sí</option><option>No</option><option>No aplica</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>
    </div>

    <div class="section">
      <div class="section-title">Accesorios Originales</div>
      <div class="checkbox-group">
        <div class="checkbox-item"><input type="checkbox" id="manuals"><label for="manuals">Manuales</label></div>
        <div class="checkbox-item"><input type="checkbox" id="spare_key"><label for="spare_key">Duplicado llave</label></div>
        <div class="checkbox-item"><input type="checkbox" id="spare_tire"><label for="spare_tire">Auxilio</label></div>
        <div class="checkbox-item"><input type="checkbox" id="jack"><label for="jack">Criquet</label></div>
        <div class="checkbox-item"><input type="checkbox" id="security_nut"><label for="security_nut">Tuerca seguridad</label></div>
        <div class="checkbox-item"><input type="checkbox" id="fire_ext"><label for="fire_ext">Matafuego</label></div>
      </div>
      <div style="margin-top: 15px;">
        <div class="checkbox-item" style="margin-bottom: 8px;"><input type="checkbox" id="extra_acc"><label for="extra_acc"><strong>Tiene accesorios extra</strong></label></div>
        <textarea placeholder="Detalle de accesorios extra..." rows="2" style="width: 100%;"></textarea>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Pintura y Chapa</div>
      ${PAINT_PARTS.map(p => `<div class="row"><label>${p.label}</label><select><option>No intervenido</option><option>Intervenido</option></select><input type="number" placeholder="$"><input type="text" placeholder="Observación"></div>`).join('')}
    </div>

    <div class="total-box">
      <span>COSTO TOTAL ESTIMADO DE REPARACIONES</span>
      <strong>$ <input type="number" value="0" style="width: 100px; background: transparent; border: none; color: white; font-size: 20px; font-weight: bold; text-align: right;"></strong>
    </div>

    <div class="recommendation">
      <div class="section-title">Recomendación Final</div>
      <div class="rec-options">
        <label class="rec-option tomar"><input type="radio" name="rec" value="TOMAR" checked><span>✓ TOMAR</span></label>
        <label class="rec-option reparos"><input type="radio" name="rec" value="TOMAR CON REPAROS"><span>⚠ TOMAR CON REPAROS</span></label>
        <label class="rec-option no-tomar"><input type="radio" name="rec" value="NO TOMAR"><span>✕ NO TOMAR</span></label>
      </div>
      <div style="margin-top: 15px;">
        <label style="font-size: 10px; color: #666; text-transform: uppercase;">Observaciones generales</label>
        <textarea rows="3" style="width: 100%; margin-top: 5px;" placeholder="Notas adicionales..."></textarea>
      </div>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Peritaje_${vehicle?.plate || 'vehiculo'}_formulario.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Formulario interactivo descargado");
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => {
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
      });

      const newFormData = { ...formData };
      let currentSection = '';

      lines.forEach((cols) => {
        if (cols.length < 2) return;
        const field = cols[0];
        const value = cols[1];
        const cost = parseFloat(cols[2]) || 0;
        const obs = cols[3] || '';

        // Detect sections
        if (field.includes('DATOS GENERALES')) { currentSection = 'general'; return; }
        if (field.includes('MOTOR Y MECÁNICA')) { currentSection = 'motor'; return; }
        if (field.includes('ELÉCTRICA Y LUCES')) { currentSection = 'electrica'; return; }
        if (field.includes('INTERIOR Y CARROCERÍA')) { currentSection = 'interior'; return; }
        if (field.includes('CUBIERTAS')) { currentSection = 'cubiertas'; return; }
        if (field.includes('SERVICE DISTRIBUCIÓN')) { currentSection = 'timing'; return; }
        if (field.includes('SERVICE ACEITE')) { currentSection = 'oil'; return; }
        if (field.includes('OTROS CONTROLES')) { currentSection = 'otros'; return; }
        if (field.includes('PINTURA Y CHAPA')) { currentSection = 'pintura'; return; }
        if (field.includes('CONCLUSIÓN')) { currentSection = 'conclusion'; return; }

        // Parse by section
        if (currentSection === 'general') {
          if (field === 'Fecha de inspección' && value) newFormData.inspection_date = value;
          if (field === 'Inspector/Mecánico') newFormData.inspector_name = value;
          if (field === 'Kilometraje') newFormData.kilometers_at_inspection = parseFloat(value) || 0;
        }

        // Motor section
        const motorKeys = { 'Estado del motor': 'engine_status', 'Presenta pérdida de fluidos': 'fluid_leaks', 'Estado de la caja': 'gearbox_status', 'Estado 4x4': 'four_wheel_drive', 'Suspensión': 'suspension', 'Sistema de Frenos': 'brakes_system', 'Desgaste de Frenos': 'brakes_wear' };
        if (currentSection === 'motor' && motorKeys[field]) {
          newFormData.general_components[motorKeys[field]] = { status: value, cost, observation: obs };
        }

        // Electrica section
        const elecKeys = { 'Fallas sistema eléctrico': 'electrical_faults', 'Faros y ópticas': 'lights_status', 'Estado de batería': 'battery_status', 'Aire acondicionado funciona': 'air_conditioning', 'Calefacción funciona': 'heating' };
        if (currentSection === 'electrica' && elecKeys[field]) {
          newFormData.general_components[elecKeys[field]] = { status: value, cost, observation: obs };
        }

        // Interior section
        const intKeys = { 'Estado tapizados': 'upholstery_status', 'Desgaste volante': 'steering_wheel_wear', 'Estado de vidrios': 'windows_status', 'Bollos granizo': 'hail_damage' };
        if (currentSection === 'interior' && intKeys[field]) {
          newFormData.general_components[intKeys[field]] = { status: value, cost, observation: obs };
        }

        // Tires
        const tireKeys = { 'Cubierta DD (Delantera Derecha)': 'front_right', 'Cubierta DI (Delantera Izquierda)': 'front_left', 'Cubierta TD (Trasera Derecha)': 'rear_right', 'Cubierta TI (Trasera Izquierda)': 'rear_left' };
        if (currentSection === 'cubiertas' && tireKeys[field]) {
          newFormData.tires[tireKeys[field]] = { status: value, cost };
        }

        // Timing service
        if (currentSection === 'timing') {
          if (field === 'Realizado') { newFormData.timing_belt_change.done = value === 'Sí'; newFormData.timing_belt_change.cost = cost; }
          if (field === 'Tipo (correa/cadena)') newFormData.timing_belt_change.type = value;
          if (field === 'Correa/Cadena cambiada') newFormData.timing_belt_change.belt_or_chain_changed = value === 'Sí';
          if (field === 'Tensores') newFormData.timing_belt_change.tensors = value === 'Sí';
          if (field === 'Bomba de agua') newFormData.timing_belt_change.water_pump = value === 'Sí';
          if (field === 'Fecha') newFormData.timing_belt_change.date = value;
          if (field === 'Kilometraje') newFormData.timing_belt_change.kilometers = parseFloat(value) || 0;
        }

        // Oil service
        if (currentSection === 'oil') {
          if (field === 'Realizado') { newFormData.oil_service.done = value === 'Sí'; newFormData.oil_service.cost = cost; }
          if (field === 'Aceite') newFormData.oil_service.oil = value === 'Sí';
          if (field === 'Filtro de aceite') newFormData.oil_service.oil_filter = value === 'Sí';
          if (field === 'Filtro de aire') newFormData.oil_service.air_filter = value === 'Sí';
          if (field === 'Filtro de habitáculo') newFormData.oil_service.cabin_filter = value === 'Sí';
          if (field === 'Filtro de combustible') newFormData.oil_service.fuel_filter = value === 'Sí';
          if (field === 'Fecha') newFormData.oil_service.date = value;
          if (field === 'Kilometraje') newFormData.oil_service.kilometers = parseFloat(value) || 0;
        }

        // Others
        if (currentSection === 'otros') {
          if (field.includes('aceite')) newFormData.oil_leak_consumption = { status: value, cost, observation: obs };
          if (field.includes('agua')) newFormData.water_leak_consumption = { status: value, cost, observation: obs };
          if (field.includes('Grabado')) newFormData.parts_engraving = { status: value, cost };
          if (field.includes('VTV')) newFormData.vtv_valid = { status: value, cost };
          if (field === 'Tiene accesorios') newFormData.has_accessories = value === 'Sí';
          if (field === 'Detalle accesorios') newFormData.accessories_detail = value;
        }

        // Paint
        const paintKeys = { 'Frente': 'front', 'Guardabarro Del. Derecho': 'front_right_fender', 'Guardabarro Del. Izquierdo': 'front_left_fender', 'Puerta Del. Derecha': 'front_right_door', 'Puerta Del. Izquierda': 'front_left_door', 'Puerta Tras. Derecha': 'rear_right_door', 'Puerta Tras. Izquierda': 'rear_left_door', 'Guardabarro Tras. Derecho': 'rear_right_fender', 'Guardabarro Tras. Izquierdo': 'rear_left_fender', 'Parte Trasera': 'rear', 'Techo': 'roof' };
        if (currentSection === 'pintura' && paintKeys[field]) {
          newFormData.paint_detail[paintKeys[field]] = { intervened: value === 'Sí', cost, observation: obs };
        }

        // Conclusion
        if (currentSection === 'conclusion') {
          if (field === 'Recomendación') newFormData.recommendation = value;
          if (field === 'Observaciones generales') newFormData.general_observations = value;
        }
      });

      setFormData(newFormData);
      toast.success("Datos importados correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al importar el archivo");
    }
    e.target.value = null;
  };

  const renderComponentRows = (components) => (
    <div className="space-y-2">
      {components.map(comp => (
        <div key={comp.key} className="grid grid-cols-12 gap-2 items-center">
          <span className="col-span-4 text-[10px]">{comp.label}</span>
          <Select value={formData.general_components[comp.key]?.status || ''} onValueChange={(v) => updateComponent('general_components', comp.key, 'status', v)}>
            <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>{(comp.type === 'status' ? STATUS_OPTIONS : YESNO_OPTIONS).map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="Costo $" value={formData.general_components[comp.key]?.cost || ''} onChange={(e) => updateComponent('general_components', comp.key, 'cost', parseFloat(e.target.value) || 0)} />
          <Input className="col-span-4 h-7 text-[10px]" placeholder="Observación" value={formData.general_components[comp.key]?.observation || ''} onChange={(e) => updateComponent('general_components', comp.key, 'observation', e.target.value)} />
        </div>
      ))}
    </div>
  );

  const inp = "h-7 text-[11px]";
  const lbl = "text-[9px] font-medium text-gray-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-3 border-b bg-gray-900 text-white rounded-t-lg flex flex-row items-center justify-between flex-shrink-0">
          <div>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Peritaje Vehicular
            </DialogTitle>
            <p className="text-[10px] text-gray-400 mt-0.5">{formData.vehicle_description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px] bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={handleDownloadTemplate}>
              <Download className="w-3 h-3 mr-1" />Plantilla Excel
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3 h-3 mr-1" />Importar
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportExcel} />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="general" className="text-[10px] gap-1"><Car className="w-3 h-3" />General</TabsTrigger>
              <TabsTrigger value="mecanica" className="text-[10px] gap-1"><Wrench className="w-3 h-3" />Mecánica</TabsTrigger>
              <TabsTrigger value="electrica" className="text-[10px] gap-1"><Settings className="w-3 h-3" />Eléctrica</TabsTrigger>
              <TabsTrigger value="interior" className="text-[10px] gap-1"><Car className="w-3 h-3" />Interior</TabsTrigger>
              <TabsTrigger value="services" className="text-[10px] gap-1"><ClipboardCheck className="w-3 h-3" />Services</TabsTrigger>
              <TabsTrigger value="pintura" className="text-[10px] gap-1"><Paintbrush className="w-3 h-3" />Pintura</TabsTrigger>
              <TabsTrigger value="conclusion" className="text-[10px] gap-1"><CheckCircle className="w-3 h-3" />Conclusión</TabsTrigger>
            </TabsList>

            {/* GENERAL */}
            <TabsContent value="general" className="space-y-4">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-600 mb-2">DATOS DEL VEHÍCULO</p>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className={lbl}>Marca</Label><Input className={inp} value={formData.vehicle_brand || vehicle?.brand || ''} onChange={(e) => setFormData({ ...formData, vehicle_brand: e.target.value })} placeholder="Ej: Toyota" /></div>
                  <div><Label className={lbl}>Modelo</Label><Input className={inp} value={formData.vehicle_model || vehicle?.model || ''} onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })} placeholder="Ej: Corolla" /></div>
                  <div><Label className={lbl}>Año</Label><Input type="number" className={inp} value={formData.vehicle_year || vehicle?.year || ''} onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })} placeholder="2020" /></div>
                  <div><Label className={lbl}>Dominio</Label><Input className={inp} value={formData.vehicle_plate || vehicle?.plate || ''} onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })} placeholder="ABC123" /></div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-600 mb-2">DATOS DE LA INSPECCIÓN</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className={lbl}>Fecha de inspección *</Label><Input type="date" className={inp} value={formData.inspection_date} onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })} /></div>
                  <div><Label className={lbl}>Inspector/Mecánico</Label><Input className={inp} value={formData.inspector_name} onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })} placeholder="Nombre" /></div>
                  <div><Label className={lbl}>Kilometraje</Label><Input type="number" className={inp} value={formData.kilometers_at_inspection} onChange={(e) => setFormData({ ...formData, kilometers_at_inspection: parseFloat(e.target.value) || 0 })} /></div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-3">ACCESORIOS ORIGINALES</p>
                <div className="grid grid-cols-3 gap-2">
                  {ORIGINAL_ACCESSORIES.map(acc => (
                    <div key={acc.key} className="flex items-center gap-1.5">
                      <Checkbox 
                        checked={formData.original_accessories?.[acc.key] || false} 
                        onCheckedChange={(c) => setFormData({ 
                          ...formData, 
                          original_accessories: { 
                            ...formData.original_accessories, 
                            [acc.key]: c 
                          } 
                        })} 
                      />
                      <span className="text-[10px]">{acc.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Checkbox checked={formData.has_extra_accessories} onCheckedChange={(c) => setFormData({ ...formData, has_extra_accessories: c })} />
                  <span className="text-[10px] font-semibold text-gray-600">TIENE ACCESORIOS EXTRA (NO ORIGINALES)</span>
                </div>
                {formData.has_extra_accessories && (
                  <Textarea className="min-h-[50px] text-[11px]" placeholder="Ej: Stereo Pioneer, llantas deportivas, sensor de estacionamiento..." value={formData.extra_accessories_detail} onChange={(e) => setFormData({ ...formData, extra_accessories_detail: e.target.value })} />
                )}
              </div>
            </TabsContent>

            {/* MECÁNICA */}
            <TabsContent value="mecanica" className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-3">MOTOR Y TREN MOTRIZ</p>
                {renderComponentRows(MOTOR_MECANICA)}
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-3">CUBIERTAS</p>
                <div className="space-y-2">
                  {TIRES.map(tire => (
                    <div key={tire.key} className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-5 text-[10px]">{tire.label}</span>
                      <Select value={formData.tires[tire.key]?.status || ''} onValueChange={(v) => updateComponent('tires', tire.key, 'status', v)}>
                        <SelectTrigger className="col-span-3 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-4 h-7 text-[10px]" placeholder="Costo $" value={formData.tires[tire.key]?.cost || ''} onChange={(e) => updateComponent('tires', tire.key, 'cost', parseFloat(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ELÉCTRICA */}
            <TabsContent value="electrica" className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-3">SISTEMA ELÉCTRICO Y LUCES</p>
                {renderComponentRows(ELECTRICA_LUCES)}
              </div>
            </TabsContent>

            {/* INTERIOR */}
            <TabsContent value="interior" className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-3">INTERIOR Y CARROCERÍA</p>
                {renderComponentRows(INTERIOR_CARROCERIA)}
              </div>
            </TabsContent>

            {/* SERVICES */}
            <TabsContent value="services" className="space-y-4">
              {/* Timing Belt / Chain */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-gray-600">SERVICE DISTRIBUCIÓN</span>
                    <div className="flex rounded-md overflow-hidden border">
                      <button type="button" className={`px-3 py-1 text-[10px] ${formData.timing_belt_change?.type === 'correa' ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, type: 'correa' } })}>Correa</button>
                      <button type="button" className={`px-3 py-1 text-[10px] ${formData.timing_belt_change?.type === 'cadena' ? 'bg-cyan-600 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, type: 'cadena' } })}>Cadena</button>
                    </div>
                  </div>
                  <div className="flex rounded-md overflow-hidden border">
                    <button type="button" className={`px-3 py-1 text-[10px] ${formData.timing_belt_change?.done ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, done: true } })}>Realizado</button>
                    <button type="button" className={`px-3 py-1 text-[10px] ${!formData.timing_belt_change?.done ? 'bg-amber-500 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, done: false } })}>Pendiente</button>
                  </div>
                </div>
                <div className="space-y-2">
                    {/* Belt/Chain row */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">{formData.timing_belt_change?.type === 'cadena' ? 'Cadena' : 'Correa'}</span>
                      <Select value={formData.timing_belt_change?.belt_or_chain?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, belt_or_chain: { ...formData.timing_belt_change.belt_or_chain, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.timing_belt_change?.belt_or_chain?.cost || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, belt_or_chain: { ...formData.timing_belt_change.belt_or_chain, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.timing_belt_change?.belt_or_chain?.observation || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, belt_or_chain: { ...formData.timing_belt_change.belt_or_chain, observation: e.target.value } } })} />
                    </div>
                    {/* Tensors row */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Tensores</span>
                      <Select value={formData.timing_belt_change?.tensors?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, tensors: { ...formData.timing_belt_change.tensors, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.timing_belt_change?.tensors?.cost || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, tensors: { ...formData.timing_belt_change.tensors, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.timing_belt_change?.tensors?.observation || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, tensors: { ...formData.timing_belt_change.tensors, observation: e.target.value } } })} />
                    </div>
                    {/* Water Pump row */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Bomba de agua</span>
                      <Select value={formData.timing_belt_change?.water_pump?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, water_pump: { ...formData.timing_belt_change.water_pump, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.timing_belt_change?.water_pump?.cost || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, water_pump: { ...formData.timing_belt_change.water_pump, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.timing_belt_change?.water_pump?.observation || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, water_pump: { ...formData.timing_belt_change.water_pump, observation: e.target.value } } })} />
                    </div>
                  {formData.timing_belt_change?.done && (
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <div><Label className={lbl}>Fecha del service</Label><Input type="date" className={inp} value={formData.timing_belt_change?.date || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, date: e.target.value } })} /></div>
                      <div><Label className={lbl}>Kilometraje</Label><Input type="number" className={inp} value={formData.timing_belt_change?.kilometers || ''} onChange={(e) => setFormData({ ...formData, timing_belt_change: { ...formData.timing_belt_change, kilometers: parseFloat(e.target.value) || 0 } })} /></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Oil Service */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-gray-600">SERVICE ACEITE Y FILTROS</span>
                  <div className="flex rounded-md overflow-hidden border">
                    <button type="button" className={`px-3 py-1 text-[10px] ${formData.oil_service?.done ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({ ...formData, oil_service: { ...formData.oil_service, done: true } })}>Realizado</button>
                    <button type="button" className={`px-3 py-1 text-[10px] ${!formData.oil_service?.done ? 'bg-amber-500 text-white' : 'bg-gray-100'}`} onClick={() => setFormData({ ...formData, oil_service: { ...formData.oil_service, done: false } })}>Pendiente</button>
                  </div>
                </div>
                <div className="space-y-2">
                    {/* Aceite */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Aceite</span>
                      <Select value={formData.oil_service?.oil?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, oil_service: { ...formData.oil_service, oil: { ...formData.oil_service.oil, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.oil_service?.oil?.cost || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, oil: { ...formData.oil_service.oil, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.oil_service?.oil?.observation || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, oil: { ...formData.oil_service.oil, observation: e.target.value } } })} />
                    </div>
                    {/* Filtro de aceite */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Filtro de aceite</span>
                      <Select value={formData.oil_service?.oil_filter?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, oil_service: { ...formData.oil_service, oil_filter: { ...formData.oil_service.oil_filter, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.oil_service?.oil_filter?.cost || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, oil_filter: { ...formData.oil_service.oil_filter, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.oil_service?.oil_filter?.observation || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, oil_filter: { ...formData.oil_service.oil_filter, observation: e.target.value } } })} />
                    </div>
                    {/* Filtro de aire */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Filtro de aire</span>
                      <Select value={formData.oil_service?.air_filter?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, oil_service: { ...formData.oil_service, air_filter: { ...formData.oil_service.air_filter, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.oil_service?.air_filter?.cost || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, air_filter: { ...formData.oil_service.air_filter, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.oil_service?.air_filter?.observation || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, air_filter: { ...formData.oil_service.air_filter, observation: e.target.value } } })} />
                    </div>
                    {/* Filtro de habitáculo */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Filtro de habitáculo</span>
                      <Select value={formData.oil_service?.cabin_filter?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, oil_service: { ...formData.oil_service, cabin_filter: { ...formData.oil_service.cabin_filter, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.oil_service?.cabin_filter?.cost || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, cabin_filter: { ...formData.oil_service.cabin_filter, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.oil_service?.cabin_filter?.observation || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, cabin_filter: { ...formData.oil_service.cabin_filter, observation: e.target.value } } })} />
                    </div>
                    {/* Filtro de combustible */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-3 text-[10px]">Filtro de combustible</span>
                      <Select value={formData.oil_service?.fuel_filter?.status || 'Bueno'} onValueChange={(v) => setFormData({ ...formData, oil_service: { ...formData.oil_service, fuel_filter: { ...formData.oil_service.fuel_filter, status: v } } })}>
                        <SelectTrigger className="col-span-2 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICE_ITEM_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="$" value={formData.oil_service?.fuel_filter?.cost || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, fuel_filter: { ...formData.oil_service.fuel_filter, cost: parseFloat(e.target.value) || 0 } } })} />
                      <Input className="col-span-5 h-7 text-[10px]" placeholder="Observación" value={formData.oil_service?.fuel_filter?.observation || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, fuel_filter: { ...formData.oil_service.fuel_filter, observation: e.target.value } } })} />
                    </div>
                  {formData.oil_service?.done && (
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-green-50 rounded border border-green-200">
                      <div><Label className={lbl}>Fecha del service</Label><Input type="date" className={inp} value={formData.oil_service?.date || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, date: e.target.value } })} /></div>
                      <div><Label className={lbl}>Kilometraje</Label><Input type="number" className={inp} value={formData.oil_service?.kilometers || ''} onChange={(e) => setFormData({ ...formData, oil_service: { ...formData.oil_service, kilometers: parseFloat(e.target.value) || 0 } })} /></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Leaks & Others */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-600 mb-2">PÉRDIDA/CONSUMO ACEITE</p>
                  <div className="flex gap-2">
                    <Select value={formData.oil_leak_consumption?.status || 'No'} onValueChange={(v) => setFormData({ ...formData, oil_leak_consumption: { ...formData.oil_leak_consumption, status: v } })}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{YESNO_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" className="h-7 text-[10px]" placeholder="$" value={formData.oil_leak_consumption?.cost || ''} onChange={(e) => setFormData({ ...formData, oil_leak_consumption: { ...formData.oil_leak_consumption, cost: parseFloat(e.target.value) || 0 } })} />
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-600 mb-2">PÉRDIDA/CONSUMO AGUA</p>
                  <div className="flex gap-2">
                    <Select value={formData.water_leak_consumption?.status || 'No'} onValueChange={(v) => setFormData({ ...formData, water_leak_consumption: { ...formData.water_leak_consumption, status: v } })}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{YESNO_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" className="h-7 text-[10px]" placeholder="$" value={formData.water_leak_consumption?.cost || ''} onChange={(e) => setFormData({ ...formData, water_leak_consumption: { ...formData.water_leak_consumption, cost: parseFloat(e.target.value) || 0 } })} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-600 mb-2">GRABADO AUTOPARTES</p>
                  <div className="flex gap-2">
                    <Select value={formData.parts_engraving?.status || 'No'} onValueChange={(v) => setFormData({ ...formData, parts_engraving: { ...formData.parts_engraving, status: v } })}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{YESNO_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" className="h-7 text-[10px]" placeholder="$" value={formData.parts_engraving?.cost || ''} onChange={(e) => setFormData({ ...formData, parts_engraving: { ...formData.parts_engraving, cost: parseFloat(e.target.value) || 0 } })} />
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-600 mb-2">VTV VIGENTE</p>
                  <div className="flex gap-2">
                    <Select value={formData.vtv_valid?.status || 'No'} onValueChange={(v) => setFormData({ ...formData, vtv_valid: { ...formData.vtv_valid, status: v } })}>
                      <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{YESNO_OPTIONS.map(o => <SelectItem key={o} value={o} className="text-[10px]">{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" className="h-7 text-[10px]" placeholder="$" value={formData.vtv_valid?.cost || ''} onChange={(e) => setFormData({ ...formData, vtv_valid: { ...formData.vtv_valid, cost: parseFloat(e.target.value) || 0 } })} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* PINTURA */}
            <TabsContent value="pintura" className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-3">DETALLE DE PINTURA Y CHAPA</p>
                <div className="space-y-2">
                  {PAINT_PARTS.map(part => (
                    <div key={part.key} className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-4 text-[10px]">{part.label}</span>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Checkbox checked={formData.paint_detail[part.key]?.intervened} onCheckedChange={(c) => updateComponent('paint_detail', part.key, 'intervened', c)} />
                        <span className="text-[9px] text-gray-500">Intervenido</span>
                      </div>
                      <Input type="number" className="col-span-2 h-7 text-[10px]" placeholder="Costo $" value={formData.paint_detail[part.key]?.cost || ''} onChange={(e) => updateComponent('paint_detail', part.key, 'cost', parseFloat(e.target.value) || 0)} />
                      <Input className="col-span-4 h-7 text-[10px]" placeholder="Observación" value={formData.paint_detail[part.key]?.observation || ''} onChange={(e) => updateComponent('paint_detail', part.key, 'observation', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* CONCLUSIÓN */}
            <TabsContent value="conclusion" className="space-y-4">
              <div className="p-4 bg-gray-900 text-white rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-400">COSTO TOTAL ESTIMADO DE REPARACIONES</span>
                  <span className="text-2xl font-bold">${formData.total_estimated_cost?.toLocaleString('es-AR') || 0}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] font-semibold text-gray-600 mb-2">RECOMENDACIÓN</p>
                <Select value={formData.recommendation} onValueChange={(v) => setFormData({ ...formData, recommendation: v })}>
                  <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOMAR" className="text-[11px]"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" />TOMAR</div></SelectItem>
                    <SelectItem value="TOMAR CON REPAROS" className="text-[11px]"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />TOMAR CON REPAROS</div></SelectItem>
                    <SelectItem value="NO TOMAR" className="text-[11px]"><div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" />NO TOMAR</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={lbl}>Observaciones generales</Label>
                <Textarea className="min-h-[80px] text-[11px]" value={formData.general_observations} onChange={(e) => setFormData({ ...formData, general_observations: e.target.value })} placeholder="Notas adicionales..." />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
          <Button variant="outline" className="h-8 text-[11px]" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex gap-2">
            {isMechanicView ? (
              <>
                <Button variant="outline" className="h-8 text-[11px]" onClick={() => handleSave('Borrador')} disabled={isSubmitting}>
                  Guardar borrador
                </Button>
                <Button className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700" onClick={handleSubmitForApproval} disabled={isSubmitting}>
                  <Save className="w-3.5 h-3.5 mr-1" />{isSubmitting ? 'Enviando...' : 'Enviar para aprobación'}
                </Button>
              </>
            ) : (
              <Button className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700" onClick={() => handleSave('Aprobado')} disabled={isSubmitting}>
                <Save className="w-3.5 h-3.5 mr-1" />{isSubmitting ? 'Guardando...' : existingInspection ? 'Actualizar Peritaje' : 'Guardar Peritaje'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}