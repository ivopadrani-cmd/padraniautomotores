import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Plus, Trash2, Car, User, DollarSign, MapPin, Wrench, Image, FileText, X, Upload } from "lucide-react";

export default function VehicleForm({ vehicle, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    status: vehicle?.status || 'DISPONIBLE',
    entry_date: vehicle?.entry_date || new Date().toISOString().split('T')[0],
    load_date: vehicle?.load_date || new Date().toISOString().split('T')[0],
    ownership: vehicle?.ownership || '',
    supplier_client_id: vehicle?.supplier_client_id || '',
    supplier_client_name: vehicle?.supplier_client_name || '',
    is_supplier_owner: vehicle?.is_supplier_owner || false,
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    plate: vehicle?.plate || '',
    kilometers: vehicle?.kilometers || 0,
    color: vehicle?.color || '',
    registration_city: vehicle?.registration_city || '',
    registration_province: vehicle?.registration_province || '',
    engine_brand: vehicle?.engine_brand || '',
    engine_number: vehicle?.engine_number || '',
    chassis_brand: vehicle?.chassis_brand || '',
    chassis_number: vehicle?.chassis_number || '',
    cost_value: vehicle?.cost_value || 0,
    cost_currency: vehicle?.cost_currency || 'ARS',
    cost_exchange_rate: vehicle?.cost_exchange_rate || 1000,
    cost_date: vehicle?.cost_date || new Date().toISOString().split('T')[0],
    target_price_value: vehicle?.target_price_value || 0,
    target_price_currency: vehicle?.target_price_currency || 'ARS',
    target_price_exchange_rate: vehicle?.target_price_exchange_rate || 1000,
    public_price_value: vehicle?.public_price_value || 0,
    public_price_currency: vehicle?.public_price_currency || 'ARS',
    public_price_exchange_rate: vehicle?.public_price_exchange_rate || 1000,
    infoauto_value: vehicle?.infoauto_value || 0,
    infoauto_currency: vehicle?.infoauto_currency || 'ARS',
    infoauto_exchange_rate: vehicle?.infoauto_exchange_rate || 1000,
    folder_url: vehicle?.folder_url || '',
    file_url: vehicle?.file_url || '',
    photos_url: vehicle?.photos_url || '',
    photos: vehicle?.photos || [],
    documents: vehicle?.documents || [],
    expenses: vehicle?.expenses || [],
    documentation_checklist: vehicle?.documentation_checklist || { documents: {}, accessories: {} }
  });
  
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ full_name: '', phone: '', dni: '' });

  const [expenses, setExpenses] = useState(vehicle?.expenses || []);
  const [newExpense, setNewExpense] = useState({ type: 'GESTORIA', value: '', currency: 'ARS', exchange_rate: '1000', date: new Date().toISOString().split('T')[0], description: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.dni?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  
  const handleChecklistChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      documentation_checklist: {
        ...prev.documentation_checklist,
        [section]: { ...prev.documentation_checklist[section], [field]: value }
      }
    }));
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    handleChange('supplier_client_id', client ? clientId : '');
    handleChange('supplier_client_name', client ? client.full_name : '');
  };

  const handleAddExpense = () => {
    const val = parseFloat(newExpense.value) || 0;
    const rate = parseFloat(newExpense.exchange_rate) || 1000;
    if (val <= 0) return;
    setExpenses([...expenses, { ...newExpense, value: val, exchange_rate: rate }]);
    setNewExpense({ type: 'GESTORIA', value: '', currency: 'ARS', exchange_rate: '1000', date: new Date().toISOString().split('T')[0], description: '' });
    setShowExpenseForm(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhotos(true);
    const uploaded = await Promise.all(files.map(async (file) => {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { url: file_url, name: file.name, date: new Date().toISOString().split('T')[0] };
      } catch { return null; }
    }));
    handleChange('photos', [...(formData.photos || []), ...uploaded.filter(f => f)]);
    setUploadingPhotos(false);
    e.target.value = null;
  };

  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingDocs(true);
    const uploaded = await Promise.all(files.map(async (file) => {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { url: file_url, name: file.name, date: new Date().toISOString().split('T')[0] };
      } catch { return null; }
    }));
    handleChange('documents', [...(formData.documents || []), ...uploaded.filter(f => f)]);
    setUploadingDocs(false);
    e.target.value = null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, expenses });
  };

  const inp = "h-7 text-[11px]";
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
  
  const handleCreateClient = async () => {
    if (!newClientData.full_name) return;
    const newClient = await base44.entities.Client.create({ ...newClientData, client_status: 'Cliente' });
    handleChange('supplier_client_id', newClient.id);
    handleChange('supplier_client_name', newClient.full_name);
    setShowNewClientForm(false);
    setNewClientData({ full_name: '', phone: '', dni: '' });
  };

  const PriceInput = ({ label, valueKey, currencyKey, rateKey, color = "gray" }) => {
    const [localValue, setLocalValue] = useState(formData[valueKey]?.toString() || '0');
    const [localRate, setLocalRate] = useState(formData[rateKey]?.toString() || '1000');

    useEffect(() => {
      setLocalValue(formData[valueKey]?.toString() || '0');
    }, [formData[valueKey]]);

    useEffect(() => {
      setLocalRate(formData[rateKey]?.toString() || '1000');
    }, [formData[rateKey]]);

    return (
      <div className={`p-2 rounded border ${color === 'green' ? 'bg-green-50 border-green-200' : color === 'orange' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className={`text-[9px] font-semibold mb-1 uppercase tracking-wide ${color === 'green' ? 'text-green-700' : color === 'orange' ? 'text-orange-700' : 'text-gray-600'}`}>{label}</p>
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <Label className={lbl}>Moneda</Label>
            <Select value={formData[currencyKey]} onValueChange={(v) => handleChange(currencyKey, v)}>
              <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS" className="text-[11px]">ARS</SelectItem>
                <SelectItem value="USD" className="text-[11px]">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={lbl}>Valor</Label>
            <Input 
              className={inp} 
              type="text" 
              inputMode="numeric"
              value={localValue} 
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={() => handleChange(valueKey, parseFloat(localValue) || 0)}
            />
          </div>
          <div>
            <Label className={lbl}>Valor Dólar</Label>
            <Input 
              className={inp} 
              type="text"
              inputMode="numeric"
              value={localRate} 
              onChange={(e) => setLocalRate(e.target.value)}
              onBlur={() => handleChange(rateKey, parseFloat(localRate) || 1000)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onCancel} className="mb-2 h-6 text-[10px] px-2">
          <ArrowLeft className="w-3 h-3 mr-1" /> Volver
        </Button>

        <form onSubmit={handleSubmit} className="space-y-2">
          
          {/* IDENTIFICACIÓN + FOTOS */}
          <div className="grid lg:grid-cols-3 gap-2">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="py-1.5 px-3 border-b">
                <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-600" /> Identificación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-6 gap-1.5">
                  <div><Label className={lbl}>Marca *</Label><Input className={inp} value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} required /></div>
                  <div className="col-span-2"><Label className={lbl}>Modelo *</Label><Input className={inp} value={formData.model} onChange={(e) => handleChange('model', e.target.value)} required /></div>
                  <div><Label className={lbl}>Año *</Label><Input className={inp} type="number" value={formData.year} onChange={(e) => handleChange('year', parseInt(e.target.value) || 0)} required /></div>
                  <div><Label className={lbl}>Color</Label><Input className={inp} value={formData.color} onChange={(e) => handleChange('color', e.target.value)} /></div>
                  <div><Label className={lbl}>KM</Label><Input className={inp} type="number" value={formData.kilometers} onChange={(e) => handleChange('kilometers', parseFloat(e.target.value) || 0)} /></div>
                </div>
                <div className="grid grid-cols-6 gap-1.5 mt-2 pt-2 border-t">
                  <div><Label className={lbl}>Dominio</Label><Input className={inp} value={formData.plate} onChange={(e) => handleChange('plate', e.target.value.toUpperCase())} /></div>
                  <div>
                    <Label className={lbl}>Estado</Label>
                    <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                      <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['A INGRESAR', 'EN REPARACION', 'DISPONIBLE', 'PAUSADO', 'RESERVADO', 'VENDIDO'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={lbl}>Propiedad</Label>
                    <Select value={formData.ownership} onValueChange={(v) => handleChange('ownership', v)}>
                      <SelectTrigger className={inp}><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {['CONSIGNACIÓN', '100I', '100L', '100', '50I', '50L'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className={lbl}>F. Ingreso</Label><Input className={inp} type="date" value={formData.entry_date} onChange={(e) => handleChange('entry_date', e.target.value)} /></div>
                  <div><Label className={lbl}>F. Carga</Label><Input className={inp} type="date" value={formData.load_date} onChange={(e) => handleChange('load_date', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-1.5 px-3 border-b">
                <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-sky-600" /> Fotos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <label className="border-2 border-dashed border-gray-300 rounded p-3 flex flex-col items-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all">
                  <Upload className="w-5 h-5 text-gray-400 mb-0.5" />
                  <span className="text-[9px] text-gray-500">{uploadingPhotos ? 'Subiendo...' : 'Subir fotos'}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhotos} />
                </label>
                {formData.photos?.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 mt-1.5">
                    {formData.photos.slice(0, 8).map((p, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={p.url} alt="" className="w-full h-full object-cover rounded" />
                        <button type="button" onClick={() => handleChange('photos', formData.photos.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* PROVEEDOR + TÉCNICOS + RADICACIÓN */}
          <div className="grid md:grid-cols-3 gap-2">
            <Card className="shadow-sm">
              <CardHeader className="py-1.5 px-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" /> Proveedor
                </CardTitle>
                <Button type="button" variant="ghost" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => setShowNewClientForm(!showNewClientForm)}>
                  <Plus className="w-3 h-3 mr-0.5" /> Nuevo
                </Button>
              </CardHeader>
              <CardContent className="p-2">
                {showNewClientForm ? (
                  <div className="space-y-1.5 p-2 bg-gray-50 rounded mb-2">
                    <div><Label className={lbl}>Nombre *</Label><Input className={inp} value={newClientData.full_name} onChange={(e) => setNewClientData({...newClientData, full_name: e.target.value})} /></div>
                    <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={newClientData.phone} onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})} /></div>
                    <div><Label className={lbl}>DNI</Label><Input className={inp} value={newClientData.dni} onChange={(e) => setNewClientData({...newClientData, dni: e.target.value})} /></div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" className="h-6 text-[9px] flex-1" onClick={handleCreateClient}>Crear</Button>
                      <Button type="button" variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => setShowNewClientForm(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Input className={`${inp} mb-1`} placeholder="Buscar..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                    <Select value={formData.supplier_client_id} onValueChange={handleClientChange}>
                      <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {filteredClients.map(c => <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <Checkbox id="is_owner" checked={formData.is_supplier_owner} onCheckedChange={(c) => handleChange('is_supplier_owner', c)} className="h-3 w-3" />
                  <label htmlFor="is_owner" className="text-[9px] cursor-pointer">Es titular</label>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-1.5 px-3 border-b">
                <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-gray-600" /> Datos Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div><Label className={lbl}>Marca Motor</Label><Input className={inp} value={formData.engine_brand} onChange={(e) => handleChange('engine_brand', e.target.value)} /></div>
                  <div><Label className={lbl}>N° Motor</Label><Input className={inp} value={formData.engine_number} onChange={(e) => handleChange('engine_number', e.target.value)} /></div>
                  <div><Label className={lbl}>Marca Chasis</Label><Input className={inp} value={formData.chassis_brand} onChange={(e) => handleChange('chassis_brand', e.target.value)} /></div>
                  <div><Label className={lbl}>N° Chasis</Label><Input className={inp} value={formData.chassis_number} onChange={(e) => handleChange('chassis_number', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-1.5 px-3 border-b">
                <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-600" /> Radicación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={formData.registration_city} onChange={(e) => handleChange('registration_city', e.target.value)} /></div>
                  <div><Label className={lbl}>Provincia</Label><Input className={inp} value={formData.registration_province} onChange={(e) => handleChange('registration_province', e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VALORES */}
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3 border-b">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-green-600" /> Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="grid md:grid-cols-4 gap-2">
                <PriceInput label="Valor de Toma" valueKey="cost_value" currencyKey="cost_currency" rateKey="cost_exchange_rate" color="gray" />
                <PriceInput label="Precio Objetivo (Mínimo)" valueKey="target_price_value" currencyKey="target_price_currency" rateKey="target_price_exchange_rate" color="orange" />
                <PriceInput label="Precio Público" valueKey="public_price_value" currencyKey="public_price_currency" rateKey="public_price_exchange_rate" color="green" />
                <PriceInput label="Valor InfoAuto" valueKey="infoauto_value" currencyKey="infoauto_currency" rateKey="infoauto_exchange_rate" color="gray" />
              </div>
            </CardContent>
          </Card>

          {/* GASTOS */}
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] font-semibold">Gastos</CardTitle>
              <Button type="button" variant="ghost" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => setShowExpenseForm(!showExpenseForm)}>
                <Plus className="w-3 h-3 mr-0.5" /> Agregar
              </Button>
            </CardHeader>
            <CardContent className="p-2">
              {showExpenseForm && (
                <div className="p-2 bg-gray-50 rounded mb-2">
                  <div className="grid grid-cols-6 gap-1.5 mb-1">
                    <Label className={lbl}>Tipo de gasto</Label>
                    <Label className={lbl}>Moneda</Label>
                    <Label className={lbl}>Valor</Label>
                    <Label className={lbl}>Valor dolar</Label>
                    <Label className={lbl}>Fecha</Label>
                    <span></span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 items-end">
                    <Select value={newExpense.type} onValueChange={(v) => setNewExpense({...newExpense, type: v})}>
                      <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['GESTORIA', 'TALLER', 'CHAPISTA', 'LIMPIEZA', 'VERIFICACION', 'MECANICA', 'OTRO'].map(t => <SelectItem key={t} value={t} className="text-[11px]">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={newExpense.currency} onValueChange={(v) => setNewExpense({...newExpense, currency: v})}>
                      <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS" className="text-[11px]">ARS</SelectItem>
                        <SelectItem value="USD" className="text-[11px]">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className={inp} type="text" inputMode="numeric" placeholder="0" value={newExpense.value} onChange={(e) => setNewExpense({...newExpense, value: e.target.value})} />
                    <Input className={inp} type="text" inputMode="numeric" placeholder="1000" value={newExpense.exchange_rate} onChange={(e) => setNewExpense({...newExpense, exchange_rate: e.target.value})} />
                    <Input className={inp} type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
                    <Button type="button" size="sm" className="h-7 text-[9px]" onClick={handleAddExpense}>OK</Button>
                  </div>
                </div>
              )}
              {expenses.length > 0 ? (
                <div className="space-y-1">
                  {expenses.map((exp, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-semibold text-[11px]">{exp.type}</span>
                        {exp.description && <span className="text-gray-500 text-[10px] ml-2">{exp.description}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[12px]">{exp.currency === 'USD' ? 'U$D' : '$'} {exp.value?.toLocaleString()}</span>
                        <span className="text-gray-400 text-[10px]">Valor dolar: {exp.exchange_rate}</span>
                        <button type="button" onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[10px] text-gray-400 text-center py-2">Sin gastos registrados</p>}
            </CardContent>
          </Card>

          {/* DOCUMENTACIÓN */}
          <Card className="shadow-sm">
            <CardHeader className="py-1.5 px-3 border-b">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-600" /> Documentación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="border-2 border-dashed border-gray-300 rounded p-2 flex flex-col items-center cursor-pointer hover:border-orange-400 transition-all">
                    <FileText className="w-4 h-4 text-gray-400 mb-0.5" />
                    <span className="text-[8px] text-gray-500">{uploadingDocs ? 'Subiendo...' : 'Subir docs'}</span>
                    <input type="file" multiple className="hidden" onChange={handleDocUpload} disabled={uploadingDocs} />
                  </label>
                  {formData.documents?.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {formData.documents.map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-[8px] p-0.5 bg-gray-50 rounded">
                          <span className="truncate flex-1">{d.name}</span>
                          <button type="button" onClick={() => handleChange('documents', formData.documents.filter((_, idx) => idx !== i))}><X className="w-2.5 h-2.5 text-red-400" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-medium text-gray-500 mb-1.5">DOCUMENTOS</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {docItems.map(item => (
                      <div key={item.key} className="flex items-center gap-1.5">
                        <Checkbox id={item.key} checked={formData.documentation_checklist?.documents?.[item.key] || false} onCheckedChange={(c) => handleChecklistChange('documents', item.key, c)} className="h-3 w-3" />
                        <label htmlFor={item.key} className="text-[10px] cursor-pointer text-gray-600">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-medium text-gray-500 mb-1.5">ACCESORIOS</p>
                  <div className="space-y-1">
                    {accItems.map(item => (
                      <div key={item.key} className="flex items-center gap-1.5">
                        <Checkbox id={item.key} checked={formData.documentation_checklist?.accessories?.[item.key] || false} onCheckedChange={(c) => handleChecklistChange('accessories', item.key, c)} className="h-3 w-3" />
                        <label htmlFor={item.key} className="text-[10px] cursor-pointer text-gray-600">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t">
                <div><Label className={lbl}>Carpeta Drive</Label><Input className={inp} value={formData.folder_url} onChange={(e) => handleChange('folder_url', e.target.value)} placeholder="https://..." /></div>
                <div><Label className={lbl}>Ficha</Label><Input className={inp} value={formData.file_url} onChange={(e) => handleChange('file_url', e.target.value)} placeholder="https://..." /></div>
                <div><Label className={lbl}>Fotos Drive</Label><Input className={inp} value={formData.photos_url} onChange={(e) => handleChange('photos_url', e.target.value)} placeholder="https://..." /></div>
              </div>
            </CardContent>
          </Card>

          {/* ACCIONES */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="h-6 text-[10px]">Cancelar</Button>
            <Button type="submit" className="h-6 text-[10px] bg-sky-600 hover:bg-sky-700" disabled={isLoading}>
              <Save className="w-3 h-3 mr-1" /> {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}