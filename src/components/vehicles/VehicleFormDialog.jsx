import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Plus, Trash2, Search, Upload, X } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";

const PriceInputRow = React.memo(({ label, valueKey, currencyKey, rateKey, color = "gray", formData, onChange }) => {
  const bgClass = color === 'dark' ? 'bg-gray-200' : color === 'green' ? 'bg-green-50' : color === 'cyan' ? 'bg-cyan-50' : 'bg-gray-50';
  const titleClass = color === 'dark' ? 'text-gray-700' : color === 'green' ? 'text-green-700' : color === 'cyan' ? 'text-cyan-700' : 'text-gray-600';
  return (
    <div className={`p-2.5 rounded ${bgClass}`}>
      <p className={`text-[9px] font-semibold uppercase ${titleClass} mb-1.5`}>{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <Label className="text-[9px] text-gray-500">Moneda</Label>
          <Select value={formData[currencyKey] || 'ARS'} onValueChange={(v) => onChange(currencyKey, v)}>
            <SelectTrigger className="h-7 text-[11px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ARS" className="text-[11px]">ARS</SelectItem><SelectItem value="USD" className="text-[11px]">USD</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[9px] text-gray-500">Cotiz. USD</Label>
          <Input className="h-7 text-[11px] bg-white" type="text" inputMode="decimal" value={formData[rateKey] ?? ''} onChange={(e) => onChange(rateKey, e.target.value)} placeholder="1200" />
        </div>
        <div>
          <Label className="text-[9px] text-gray-500">Valor</Label>
          <Input className="h-7 text-[12px] font-semibold bg-white" type="text" inputMode="decimal" value={formData[valueKey] ?? ''} onChange={(e) => onChange(valueKey, e.target.value)} placeholder="0" />
        </div>
      </div>
    </div>
  );
});

export default function VehicleFormDialog({ open, onOpenChange, vehicle, onSubmit, isLoading }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ type: 'GESTORIA', value: '', currency: 'ARS', exchange_rate: '1200', date: new Date().toISOString().split('T')[0], description: '' });
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ full_name: '', phone: '', dni: '' });

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const handleCreateClient = async () => {
    if (!newClientData.full_name) return;
    const newClient = await base44.entities.Client.create({ ...newClientData, client_status: 'Cliente' });
    handleChange('supplier_client_id', newClient.id);
    handleChange('supplier_client_name', newClient.full_name);
    setShowNewClientForm(false);
    setNewClientData({ full_name: '', phone: '', dni: '' });
  };

  useEffect(() => {
    if (open) {
      setFormData({
        status: vehicle?.status || 'DISPONIBLE',
        entry_date: vehicle?.entry_date || new Date().toISOString().split('T')[0],
        ownership: vehicle?.ownership || '',
        supplier_client_id: vehicle?.supplier_client_id || '',
        supplier_client_name: vehicle?.supplier_client_name || '',
        is_supplier_owner: vehicle?.is_supplier_owner || false,
        brand: vehicle?.brand || '',
        model: vehicle?.model || '',
        year: vehicle?.year || '',
        plate: vehicle?.plate || '',
        kilometers: vehicle?.kilometers || '',
        color: vehicle?.color || '',
        registration_city: vehicle?.registration_city || '',
        registration_province: vehicle?.registration_province || '',
        engine_brand: vehicle?.engine_brand || '',
        engine_number: vehicle?.engine_number || '',
        chassis_brand: vehicle?.chassis_brand || '',
        chassis_number: vehicle?.chassis_number || '',
        cost_value: vehicle?.cost_value || '',
        cost_currency: vehicle?.cost_currency || 'ARS',
        cost_exchange_rate: vehicle?.cost_exchange_rate || '',
        target_price_value: vehicle?.target_price_value || '',
        target_price_currency: vehicle?.target_price_currency || 'ARS',
        target_price_exchange_rate: vehicle?.target_price_exchange_rate || '',
        public_price_value: vehicle?.public_price_value || '',
        public_price_currency: vehicle?.public_price_currency || 'ARS',
        public_price_exchange_rate: vehicle?.public_price_exchange_rate || '',
        infoauto_value: vehicle?.infoauto_value || '',
        infoauto_currency: vehicle?.infoauto_currency || 'ARS',
        infoauto_exchange_rate: vehicle?.infoauto_exchange_rate || '',
        photos: vehicle?.photos || [],
        documents: vehicle?.documents || [],
        documentation_checklist: vehicle?.documentation_checklist || { documents: {}, accessories: {} }
      });
      setExpenses(vehicle?.expenses || []);
      setHasChanges(false);
      setClientSearch('');
    }
  }, [open, vehicle]);

  const handleChange = useCallback((field, value) => { setFormData(prev => ({ ...prev, [field]: value })); setHasChanges(true); }, []);

  const handleChecklistChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      documentation_checklist: {
        ...prev.documentation_checklist,
        [section]: { ...prev.documentation_checklist[section], [field]: value }
      }
    }));
    setHasChanges(true);
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    handleChange('supplier_client_id', client ? clientId : '');
    handleChange('supplier_client_name', client ? client.full_name : '');
    setClientSearch('');
  };

  const handleAddExpense = () => {
    const val = parseFloat(newExpense.value) || 0;
    const rate = parseFloat(newExpense.exchange_rate) || 1200;
    if (val <= 0) return;
    setExpenses([...expenses, { ...newExpense, value: val, exchange_rate: rate }]);
    setNewExpense({ type: 'GESTORIA', value: '', currency: 'ARS', exchange_rate: '1200', date: new Date().toISOString().split('T')[0], description: '' });
    setShowExpenseForm(false);
    setHasChanges(true);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Validar tamaño de archivos (máx 10MB por foto)
    const maxSize = 10 * 1024 * 1024;
    const invalidFiles = files.filter(f => f.size > maxSize);
    if (invalidFiles.length > 0) {
      alert(`Algunos archivos son muy grandes (máx 10MB): ${invalidFiles.map(f => f.name).join(', ')}`);
      e.target.value = null;
      return;
    }
    
    setUploadingPhotos(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, name: file.name, date: new Date().toISOString().split('T')[0] };
        } catch (error) {
          console.error('Error subiendo foto:', file.name, error);
          return null;
        }
      }));
      
      const successfulUploads = uploaded.filter(f => f);
      if (successfulUploads.length > 0) {
        handleChange('photos', [...(formData.photos || []), ...successfulUploads]);
      }
      
      if (successfulUploads.length < files.length) {
        alert(`${files.length - successfulUploads.length} foto(s) no se pudieron subir. Intenta nuevamente.`);
      }
    } finally {
      setUploadingPhotos(false);
      e.target.value = null;
    }
  };

  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Validar tamaño de archivos (máx 20MB por documento)
    const maxSize = 20 * 1024 * 1024;
    const invalidFiles = files.filter(f => f.size > maxSize);
    if (invalidFiles.length > 0) {
      alert(`Algunos archivos son muy grandes (máx 20MB): ${invalidFiles.map(f => f.name).join(', ')}`);
      e.target.value = null;
      return;
    }
    
    setUploadingDocs(true);
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, name: file.name, date: new Date().toISOString().split('T')[0] };
        } catch (error) {
          console.error('Error subiendo documento:', file.name, error);
          return null;
        }
      }));
      
      const successfulUploads = uploaded.filter(f => f);
      if (successfulUploads.length > 0) {
        handleChange('documents', [...(formData.documents || []), ...successfulUploads]);
      }
      
      if (successfulUploads.length < files.length) {
        alert(`${files.length - successfulUploads.length} documento(s) no se pudieron subir. Intenta nuevamente.`);
      }
    } finally {
      setUploadingDocs(false);
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    // Convert numeric string fields to numbers before submit
    const numericFields = ['year', 'kilometers', 'cost_value', 'cost_exchange_rate', 'target_price_value', 'target_price_exchange_rate', 'public_price_value', 'public_price_exchange_rate', 'infoauto_value', 'infoauto_exchange_rate'];
    const processedData = { ...formData };
    numericFields.forEach(field => {
      if (processedData[field] !== '' && processedData[field] !== undefined) {
        processedData[field] = parseFloat(processedData[field]) || 0;
      }
    });
    
    const finalData = { ...processedData, expenses };
    console.log('📤 Enviando datos del vehículo:', finalData);
    
    try {
      await onSubmit(finalData);
      console.log('✅ Vehículo guardado correctamente');
    } catch (error) {
      console.error('❌ Error al guardar vehículo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) setShowConfirm(true);
    else onOpenChange(false);
  };

  const filteredClients = clients.filter(c => !clientSearch || c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone?.includes(clientSearch));

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  const docItems = [
    { key: 'original_card', label: 'Cédula original' },
    { key: 'authorized_cards', label: 'Cédulas autorizado' },
    { key: 'cat', label: 'C.A.T.' },
    { key: 'form_08', label: '08 Firmado' },
    { key: 'police_verification', label: 'Verificación policial' },
    { key: 'domain_report', label: 'Informe dominio' },
    { key: 'fines_report', label: 'Informe multas' },
    { key: 'patent_payment', label: 'Pago patentes' },
    { key: 'sale_report', label: 'Denuncia venta' },
    { key: 'lien_cancellation', label: 'Cancel. prenda' },
    { key: 'municipal_discharge', label: 'Baja municipal' },
  ];

  const accItems = [
    { key: 'manuals', label: 'Manuales' },
    { key: 'spare_key', label: 'Duplicado llave' },
    { key: 'spare_tire', label: 'Auxilio' },
    { key: 'jack', label: 'Criquet' },
    { key: 'security_nut', label: 'Tuerca seguridad' },
    { key: 'fire_extinguisher', label: 'Matafuego' },
  ];



  return (
    <>
      <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm} onConfirm={() => onOpenChange(false)} />
      <Dialog open={open} onOpenChange={handleClose}>
        {/* Loading Overlay */}
        {(isLoading || uploadingPhotos || uploadingDocs || isSubmitting) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
          </div>
        )}
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
            <DialogTitle className="text-sm font-semibold">{vehicle?.id ? 'Editar' : 'Nuevo'} Vehículo</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {/* DATOS PRINCIPALES */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-semibold text-gray-600 mb-2">DATOS PRINCIPALES</p>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-1"><Label className={lbl}>Marca *</Label><Input className={inp} value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} required /></div>
                <div className="col-span-2"><Label className={lbl}>Modelo *</Label><Input className={inp} value={formData.model} onChange={(e) => handleChange('model', e.target.value)} required /></div>
                <div className="col-span-1"><Label className={lbl}>Año</Label><Input className={inp} type="number" value={formData.year ?? ''} onChange={(e) => handleChange('year', e.target.value)} /></div>
                <div className="col-span-1"><Label className={lbl}>Dominio</Label><Input className={inp} value={formData.plate} onChange={(e) => handleChange('plate', e.target.value.toUpperCase())} /></div>
                <div className="col-span-1"><Label className={lbl}>KM</Label><Input className={inp} type="number" value={formData.kilometers ?? ''} onChange={(e) => handleChange('kilometers', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-6 gap-3 mt-2">
                <div className="col-span-2"><Label className={lbl}>Color</Label><Input className={inp} value={formData.color} onChange={(e) => handleChange('color', e.target.value)} /></div>
                <div className="col-span-1"><Label className={lbl}>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                    <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                    <SelectContent>{['A PERITAR', 'A INGRESAR', 'EN REPARACION', 'DISPONIBLE', 'PAUSADO', 'RESERVADO', 'VENDIDO', 'ENTREGADO', 'DESCARTADO'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-1"><Label className={lbl}>Propiedad</Label>
                  <Select value={formData.ownership} onValueChange={(v) => handleChange('ownership', v)}>
                    <SelectTrigger className={inp}><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{['CONSIGNACIÓN', '100I', '100L', '100', '50I', '50L'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-1"><Label className={lbl}>F. Ingreso</Label><Input className={inp} type="date" value={formData.entry_date} onChange={(e) => handleChange('entry_date', e.target.value)} /></div>
                <div className="col-span-1"><Label className={lbl}>F. Carga</Label><Input className={inp} type="date" value={formData.load_date || new Date().toISOString().split('T')[0]} onChange={(e) => handleChange('load_date', e.target.value)} /></div>
              </div>
            </div>

            {/* DATOS TÉCNICOS */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-semibold text-gray-600 mb-2">DATOS TÉCNICOS</p>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className={lbl}>Marca Motor</Label><Input className={inp} value={formData.engine_brand} onChange={(e) => handleChange('engine_brand', e.target.value)} /></div>
                <div><Label className={lbl}>N° Motor</Label><Input className={inp} value={formData.engine_number} onChange={(e) => handleChange('engine_number', e.target.value)} /></div>
                <div><Label className={lbl}>Marca Chasis</Label><Input className={inp} value={formData.chassis_brand} onChange={(e) => handleChange('chassis_brand', e.target.value)} /></div>
                <div><Label className={lbl}>N° Chasis</Label><Input className={inp} value={formData.chassis_number} onChange={(e) => handleChange('chassis_number', e.target.value)} /></div>
              </div>
            </div>

            {/* RADICACIÓN */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-semibold text-gray-600 mb-2">RADICACIÓN</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={formData.registration_city} onChange={(e) => handleChange('registration_city', e.target.value)} /></div>
                <div><Label className={lbl}>Provincia</Label><Input className={inp} value={formData.registration_province} onChange={(e) => handleChange('registration_province', e.target.value)} /></div>
              </div>
            </div>

            {/* PROVEEDOR */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-semibold text-gray-600">PROVEEDOR</p>
                <div className="flex-1 relative">
                  {showNewClientForm ? (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1"><Label className={lbl}>Nombre *</Label><Input className={inp} value={newClientData.full_name} onChange={(e) => setNewClientData({...newClientData, full_name: e.target.value})} /></div>
                      <div className="w-32"><Label className={lbl}>Teléfono</Label><Input className={inp} value={newClientData.phone} onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})} /></div>
                      <div className="w-28"><Label className={lbl}>DNI</Label><Input className={inp} value={newClientData.dni} onChange={(e) => setNewClientData({...newClientData, dni: e.target.value})} /></div>
                      <Button type="button" size="sm" className="h-8 text-[9px]" onClick={handleCreateClient}>Crear</Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-[9px]" onClick={() => setShowNewClientForm(false)}>Cancelar</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <Input className={`${inp} pl-7`} placeholder="Buscar cliente..." value={clientSearch || formData.supplier_client_name} onChange={(e) => setClientSearch(e.target.value)} />
                        {clientSearch && filteredClients.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto">
                            {filteredClients.slice(0, 6).map(c => (
                              <div key={c.id} className="p-2 hover:bg-gray-100 cursor-pointer text-[10px] border-b last:border-b-0" onClick={() => handleClientSelect(c.id)}>
                                <p className="font-medium">{c.full_name}</p><p className="text-gray-500">{c.phone}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-[9px]" onClick={() => setShowNewClientForm(true)}>
                        <Plus className="w-3 h-3 mr-0.5" /> Nuevo
                      </Button>
                      <div className="flex items-center gap-1.5 ml-2">
                        <Checkbox id="is_owner" checked={formData.is_supplier_owner} onCheckedChange={(c) => handleChange('is_supplier_owner', c)} className="h-3.5 w-3.5" />
                        <label htmlFor="is_owner" className="text-[9px] text-gray-600 whitespace-nowrap">Es titular</label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VALORES */}
            <div className="grid grid-cols-2 gap-2">
              <PriceInputRow label="Valor de Toma" valueKey="cost_value" currencyKey="cost_currency" rateKey="cost_exchange_rate" color="gray" formData={formData} onChange={handleChange} />
              <PriceInputRow label="Precio Objetivo" valueKey="target_price_value" currencyKey="target_price_currency" rateKey="target_price_exchange_rate" color="cyan" formData={formData} onChange={handleChange} />
              <PriceInputRow label="Precio Público" valueKey="public_price_value" currencyKey="public_price_currency" rateKey="public_price_exchange_rate" color="green" formData={formData} onChange={handleChange} />
              <PriceInputRow label="Valor InfoAuto" valueKey="infoauto_value" currencyKey="infoauto_currency" rateKey="infoauto_exchange_rate" color="dark" formData={formData} onChange={handleChange} />
            </div>

            {/* GASTOS */}
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-semibold text-gray-600">GASTOS</p>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowExpenseForm(!showExpenseForm)}>
                  <Plus className="w-3 h-3 mr-1" /> Agregar
                </Button>
              </div>
              {showExpenseForm && (
                <div className="p-2 bg-white rounded border mb-2 grid grid-cols-7 gap-2 items-end">
                  <Select value={newExpense.type} onValueChange={(v) => setNewExpense({...newExpense, type: v})}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{['GESTORIA', 'TALLER', 'CHAPISTA', 'LIMPIEZA', 'VERIFICACION', 'MECANICA', 'OTRO'].map(t => <SelectItem key={t} value={t} className="text-[10px]">{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newExpense.currency} onValueChange={(v) => setNewExpense({...newExpense, currency: v})}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ARS" className="text-[10px]">ARS</SelectItem><SelectItem value="USD" className="text-[10px]">USD</SelectItem></SelectContent>
                  </Select>
                  <Input className="h-7 text-[10px]" placeholder="Valor" value={newExpense.value} onChange={(e) => setNewExpense({...newExpense, value: e.target.value})} />
                  <Input className="h-7 text-[10px]" placeholder="TC" value={newExpense.exchange_rate} onChange={(e) => setNewExpense({...newExpense, exchange_rate: e.target.value})} />
                  <Input className="h-7 text-[10px]" type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
                  <Input className="h-7 text-[10px]" placeholder="Descripción" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
                  <Button type="button" size="sm" className="h-7 text-[10px]" onClick={handleAddExpense}>OK</Button>
                </div>
              )}
              {expenses.length > 0 ? (
                <div className="space-y-1">
                  {expenses.map((exp, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white rounded text-[11px]">
                      <div><span className="font-medium">{exp.type}</span>{exp.description && <span className="text-gray-500 ml-2">{exp.description}</span>}</div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{exp.currency === 'USD' ? 'U$D' : '$'} {exp.value?.toLocaleString()}</span>
                        <button type="button" onClick={() => { setExpenses(expenses.filter((_, idx) => idx !== i)); setHasChanges(true); }}><Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[10px] text-gray-400 text-center py-2">Sin gastos registrados</p>}
            </div>

            {/* FOTOS Y DOCUMENTOS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-semibold text-gray-600 mb-2">FOTOS</p>
                <label className="border-2 border-dashed border-gray-300 rounded p-3 flex flex-col items-center cursor-pointer hover:border-gray-400 transition-all">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500">{uploadingPhotos ? 'Subiendo...' : 'Subir fotos'}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhotos} />
                </label>
                {formData.photos?.length > 0 && (
                  <div className="grid grid-cols-6 gap-1 mt-2">
                    {formData.photos.map((p, i) => (
                      <div key={i} className="relative group">
                        <img src={p.url} alt="" className="w-full h-10 object-cover rounded" />
                        <button type="button" onClick={() => handleChange('photos', formData.photos.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] font-semibold text-gray-600 mt-3 mb-2">DOCUMENTOS ADJUNTOS</p>
                <label className="border-2 border-dashed border-gray-300 rounded p-2 flex flex-col items-center cursor-pointer hover:border-gray-400 transition-all">
                  <Upload className="w-4 h-4 text-gray-400 mb-0.5" />
                  <span className="text-[9px] text-gray-500">{uploadingDocs ? 'Subiendo...' : 'Subir documentos'}</span>
                  <input type="file" multiple className="hidden" onChange={handleDocUpload} disabled={uploadingDocs} />
                </label>
                {formData.documents?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.documents.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-[9px] p-1.5 bg-white rounded border">
                        <span className="truncate flex-1">{d.name}</span>
                        <button type="button" onClick={() => handleChange('documents', formData.documents.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-semibold text-gray-600 mb-2">DOCUMENTACIÓN</p>
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="space-y-0.5">
                    {docItems.slice(0, 6).map(item => (
                      <div key={item.key} className="flex items-center gap-1.5">
                        <Checkbox id={item.key} checked={formData.documentation_checklist?.documents?.[item.key] || false} onCheckedChange={(c) => handleChecklistChange('documents', item.key, c)} className="h-3 w-3" />
                        <label htmlFor={item.key} className="text-[9px] cursor-pointer text-gray-600">{item.label}</label>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    {docItems.slice(6).map(item => (
                      <div key={item.key} className="flex items-center gap-1.5">
                        <Checkbox id={item.key} checked={formData.documentation_checklist?.documents?.[item.key] || false} onCheckedChange={(c) => handleChecklistChange('documents', item.key, c)} className="h-3 w-3" />
                        <label htmlFor={item.key} className="text-[9px] cursor-pointer text-gray-600">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-[10px] font-semibold text-gray-600 mt-3 mb-2">ACCESORIOS</p>
                <div className="grid grid-cols-2 gap-x-4">
                  {accItems.map(item => (
                    <div key={item.key} className="flex items-center gap-1.5">
                      <Checkbox id={item.key} checked={formData.documentation_checklist?.accessories?.[item.key] || false} onCheckedChange={(c) => handleChecklistChange('accessories', item.key, c)} className="h-3 w-3" />
                      <label htmlFor={item.key} className="text-[9px] cursor-pointer text-gray-600">{item.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} className="h-8 text-[11px]" disabled={isSubmitting || isLoading}>Cancelar</Button>
              <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800" disabled={isSubmitting || isLoading}>
                <Save className="w-3.5 h-3.5 mr-1.5" />{isSubmitting || isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}