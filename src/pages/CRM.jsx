import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Users, User, Eye, Edit, Trash2, Phone, Mail, MapPin, X, ChevronDown, Calendar, Car } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ClientDetail from "../components/clients/ClientDetail";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import LeadDetail from "../components/crm/LeadDetail";
import ScheduleFollowUpDialog from "../components/crm/ScheduleFollowUpDialog";
import { useParams, useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  'Nuevo': { bg: 'bg-cyan-100 text-cyan-700', icon: '○' },
  'Contactado': { bg: 'bg-gray-200 text-gray-700', icon: '◐' },
  'En negociación': { bg: 'bg-cyan-500 text-white', icon: '◑' },
  'Concretado': { bg: 'bg-gray-900 text-white', icon: '●' },
  'Perdido': { bg: 'bg-red-100 text-red-700', icon: '✕' }
};

const INTEREST_CONFIG = {
  'Bajo': { bg: 'bg-gray-100 text-gray-600', icon: '▽' },
  'Medio': { bg: 'bg-gray-200 text-gray-700', icon: '◇' },
  'Alto': { bg: 'bg-cyan-100 text-cyan-700', icon: '◆' },
  'Muy alto': { bg: 'bg-cyan-500 text-white', icon: '★' }
};

const SOURCE_OPTIONS = ['Salón', 'Llamada', 'Redes sociales', 'Recomendado'];

export default function CRM() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('leads');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showConfirmLead, setShowConfirmLead] = useState(false);
  const [showConfirmClient, setShowConfirmClient] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);

  const [leadFormData, setLeadFormData] = useState({
    consultation_date: new Date().toISOString().split('T')[0],
    consultation_time: new Date().toTimeString().slice(0, 5),
    source: '',
    client_id: '',
    client_name: '', client_phone: '', client_email: '',
    interested_vehicles: [],
    other_interests: '', budget: '', preferred_contact: 'WhatsApp',
    trade_in: { brand: '', model: '', year: '', kilometers: '' },
    status: 'Nuevo', interest_level: 'Medio', observations: '', follow_up_date: '', follow_up_time: ''
  });
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isNewProspect, setIsNewProspect] = useState(true); // Por defecto en modo nuevo prospecto

  // Removed time options - now using input type="time" for exact time entry

  const [clientFormData, setClientFormData] = useState({
    full_name: '', phone: '', email: '', dni: '', cuit_cuil: '',
    city: '', province: '', address: '', postal_code: '',
    marital_status: '', observations: ''
  });

  const queryClient = useQueryClient();

  const { data: leads = [], isLoading: loadingLeads } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list('-consultation_date') });
  const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-created_at') });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });

  // Query para lead específico
  const { data: specificLead, isLoading: isLoadingLead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.get(leadId),
    enabled: !!leadId,
  });

  // Sincronizar selectedLead con URL
  useEffect(() => {
    if (leadId && specificLead) {
      setSelectedLead(specificLead);
    } else if (!leadId) {
      setSelectedLead(null);
    }
  }, [leadId, specificLead]);

  const createLeadMutation = useMutation({
    mutationFn: async (data) => {
      // Si ya hay client_id seleccionado, usarlo directamente
      let clientId = data.client_id || null;
      
      // Solo crear/buscar cliente si NO hay client_id y hay datos de cliente
      if (!clientId && data.client_name && data.client_phone) {
        // Buscar por teléfono primero
        const existingClient = clients.find(c => c.phone === data.client_phone);
        if (existingClient) {
          // Cliente existente encontrado, usar ese ID
          clientId = existingClient.id;
          console.log('✅ Cliente existente encontrado:', existingClient.full_name);
        } else {
          // Crear nuevo prospecto solo si NO existe
          const newClient = await base44.entities.Client.create({ 
            full_name: data.client_name, 
            phone: data.client_phone, 
            email: data.client_email,
            client_status: 'Prospecto' 
          });
          clientId = newClient.id;
          console.log('✅ Nuevo prospecto creado:', newClient.full_name);
        }
      } else if (clientId) {
        console.log('✅ Usando cliente pre-seleccionado:', clientId);
      }
      
      const lead = await base44.entities.Lead.create({ ...data, client_id: clientId });
      
      // Create follow-up task if follow_up_date is set
      if (data.follow_up_date) {
        await base44.entities.Task.create({
          title: `Seguimiento: ${data.client_name}`,
          task_date: data.follow_up_date,
          task_time: data.follow_up_time || '10:00',
          task_type: 'Seguimiento',
          related_client_id: clientId,
          related_client_name: data.client_name,
          description: `Seguimiento de consulta - Tel: ${data.client_phone}${data.client_email ? ' - Email: ' + data.client_email : ''}`,
          status: 'Pendiente',
          priority: data.interest_level === 'Muy alto' ? 'Alta' : data.interest_level === 'Alto' ? 'Alta' : 'Media'
        });
      }
      return lead;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); queryClient.invalidateQueries({ queryKey: ['clients'] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); resetLeadForm(); toast.success("Consulta creada"); },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await base44.entities.Lead.update(id, data);
      
      // Create follow-up task if follow_up_date changed and is set
      if (data.follow_up_date && editingLead && data.follow_up_date !== editingLead.follow_up_date) {
        const existingClient = clients.find(c => c.phone === data.client_phone);
        await base44.entities.Task.create({
          title: `Seguimiento: ${data.client_name}`,
          task_date: data.follow_up_date,
          task_time: data.follow_up_time || '10:00',
          task_type: 'Seguimiento',
          related_client_id: existingClient?.id,
          related_client_name: data.client_name,
          description: `Seguimiento de consulta - Tel: ${data.client_phone}${data.client_email ? ' - Email: ' + data.client_email : ''}`,
          status: 'Pendiente',
          priority: data.interest_level === 'Muy alto' ? 'Alta' : data.interest_level === 'Alto' ? 'Alta' : 'Media'
        });
      }
      return result;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); resetLeadForm(); toast.success("Consulta actualizada"); },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); toast.success("Consulta eliminada"); },
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create({ ...data, client_status: 'Cliente' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); resetClientForm(); toast.success("Cliente creado"); },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); resetClientForm(); toast.success("Cliente actualizado"); },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success("Cliente eliminado"); },
  });

  const handleBulkDeleteLeads = async () => {
    if (selectedLeads.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedLeads.length} consulta(s)?`)) return;
    for (const id of selectedLeads) await base44.entities.Lead.delete(id);
    setSelectedLeads([]);
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success(`${selectedLeads.length} consulta(s) eliminada(s)`);
  };

  const handleBulkDeleteClients = async () => {
    if (selectedClients.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedClients.length} cliente(s)?`)) return;
    for (const id of selectedClients) await base44.entities.Client.delete(id);
    setSelectedClients([]);
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    toast.success(`${selectedClients.length} cliente(s) eliminado(s)`);
  };

  const resetLeadForm = () => {
    setShowLeadForm(false);
    setEditingLead(null);
    setLeadFormData({ consultation_date: new Date().toISOString().split('T')[0], consultation_time: new Date().toTimeString().slice(0, 5), source: '', client_id: '', client_name: '', client_phone: '', client_email: '', interested_vehicles: [], other_interests: '', budget: '', preferred_contact: 'WhatsApp', trade_in: { brand: '', model: '', year: '', kilometers: '' }, status: 'Nuevo', interest_level: 'Medio', observations: '', follow_up_date: '', follow_up_time: '' });
    setVehicleSearch('');
    setShowVehicleDropdown(false);
    setClientSearch('');
    setShowClientDropdown(false);
    setIsNewProspect(true); // Volver a modo nuevo prospecto por defecto
  };

  const filteredClientsForLead = clients.filter(c =>
    !clientSearch ||
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.dni?.includes(clientSearch) ||
    c.phone?.includes(clientSearch)
  );

  const resetClientForm = () => {
    setShowClientForm(false);
    setEditingClient(null);
    setClientFormData({ full_name: '', phone: '', email: '', dni: '', cuit_cuil: '', city: '', province: '', address: '', postal_code: '', marital_status: '', observations: '' });
  };

  const handleSelectLead = (lead) => {
    navigate(`/crm/${lead.id}`);
  };

  const handleCloseLead = () => {
    navigate('/CRM');
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setLeadFormData({
      consultation_date: lead.consultation_date, 
      consultation_time: lead.consultation_time || '',
      source: lead.source || '',
      client_name: lead.client_name, client_phone: lead.client_phone || '',
      client_email: lead.client_email || '', 
      interested_vehicles: lead.interested_vehicles || [],
      other_interests: lead.other_interests || '', budget: lead.budget?.toString() || '',
      preferred_contact: lead.preferred_contact || 'WhatsApp', 
      trade_in: lead.trade_in || { brand: '', model: '', year: '', kilometers: '' },
      status: lead.status, interest_level: lead.interest_level || 'Medio',
      observations: lead.observations || '', follow_up_date: lead.follow_up_date || '', follow_up_time: lead.follow_up_time || ''
    });
    setShowLeadForm(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientFormData({
      full_name: client.full_name, phone: client.phone || '', email: client.email || '',
      dni: client.dni || '', cuit_cuil: client.cuit_cuil || '', city: client.city || '',
      province: client.province || '', address: client.address || '', postal_code: client.postal_code || '',
      marital_status: client.marital_status || '', observations: client.observations || ''
    });
    setShowClientForm(true);
  };

  const handleSubmitLead = (e) => {
    e.preventDefault();
    const data = { ...leadFormData, budget: leadFormData.budget ? parseFloat(leadFormData.budget) : null };
    editingLead ? updateLeadMutation.mutate({ id: editingLead.id, data }) : createLeadMutation.mutate(data);
  };

  const availableVehicles = vehicles.filter(v => v.status !== 'VENDIDO');
  const filteredAvailableVehicles = availableVehicles.filter(v => {
    if (!vehicleSearch) return true;
    const search = vehicleSearch.toLowerCase();
    return v.brand?.toLowerCase().includes(search) || v.model?.toLowerCase().includes(search) || v.year?.toString().includes(search) || v.plate?.toLowerCase().includes(search);
  });

  const addVehicleToLead = (vehicle) => {
    if (leadFormData.interested_vehicles.some(iv => iv.vehicle_id === vehicle.id)) return;
    setLeadFormData(prev => ({
      ...prev,
      interested_vehicles: [...prev.interested_vehicles, { vehicle_id: vehicle.id, vehicle_description: `${vehicle.brand} ${vehicle.model} ${vehicle.year}` }]
    }));
    setVehicleSearch('');
  };

  const removeVehicleFromLead = (vehicleId) => {
    setLeadFormData(prev => ({
      ...prev,
      interested_vehicles: prev.interested_vehicles.filter(iv => iv.vehicle_id !== vehicleId)
    }));
  };

  const handleSubmitClient = (e) => {
    e.preventDefault();
    editingClient ? updateClientMutation.mutate({ id: editingClient.id, data: clientFormData }) : createClientMutation.mutate(clientFormData);
  };

  const filteredLeads = leads.filter(l => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = l.client_name?.toLowerCase().includes(search) || 
      l.client_phone?.includes(search) ||
      l.other_interests?.toLowerCase().includes(search) ||
      l.observations?.toLowerCase().includes(search);
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });



  const filteredClients = clients.filter(c => {
    const search = searchTerm.toLowerCase();
    return c.full_name?.toLowerCase().includes(search) || c.phone?.includes(search) || c.dni?.includes(search);
  });

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  // Reset to list when clicking module in sidebar
  React.useEffect(() => {
    const handleReset = (e) => {
      if (e.detail === 'CRM') {
        setSelectedLead(null);
        // selectedClient ya no se usa, se maneja con navegación
      }
    };
    window.addEventListener('resetModuleView', handleReset);
    return () => window.removeEventListener('resetModuleView', handleReset);
  }, []);

  // Mostrar spinner si está cargando un lead específico
  if (leadId && isLoadingLead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  // Cliente ahora se maneja con navegación a /clients/:clientId
  if (selectedLead) return <LeadDetail lead={selectedLead} onClose={handleCloseLead} onEdit={(l) => { handleEditLead(l); }} />;

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">CRM</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); setFilterStatus('ALL'); }}>
          <TabsList className="h-9">
            <TabsTrigger value="leads" className="text-[11px]">Consultas ({leads.length})</TabsTrigger>
            <TabsTrigger value="clients" className="text-[11px]">Clientes ({clients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-3 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input placeholder="Buscar consulta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-[11px] bg-white" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8 text-[11px] bg-white"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-[11px]">Todos</SelectItem>
                  {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedLeads.length > 0 && (
                <Button variant="outline" onClick={handleBulkDeleteLeads} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar ({selectedLeads.length})
                </Button>
              )}
              {selectionMode ? (
                <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedLeads([]); }} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">Cancelar selección</Button>
              ) : (
                <Button variant="outline" onClick={() => setSelectionMode(true)} className="h-8 text-[11px]">Selección múltiple</Button>
              )}
              <Button onClick={() => setShowLeadForm(true)} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva Consulta
              </Button>
            </div>

            <ConfirmDialog open={showConfirmLead} onOpenChange={setShowConfirmLead} onConfirm={resetLeadForm} />
            <ScheduleFollowUpDialog 
              open={showScheduleDialog} 
              onOpenChange={setShowScheduleDialog} 
              leadData={leadFormData}
              leadId={editingLead?.id}
              clients={clients}
            />
            <Dialog open={showLeadForm} onOpenChange={(open) => { if (!open) setShowConfirmLead(true); else setShowLeadForm(true); }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg"><DialogTitle className="text-sm font-semibold">{editingLead ? 'Editar' : 'Nueva'} Consulta</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitLead} className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className={lbl}>Fecha *</Label><Input className={inp} type="date" value={leadFormData.consultation_date} onChange={(e) => setLeadFormData({ ...leadFormData, consultation_date: e.target.value })} required /></div>
                    <div><Label className={lbl}>Hora</Label>
                      <Input 
                        className={inp} 
                        type="time" 
                        value={leadFormData.consultation_time} 
                        onChange={(e) => setLeadFormData({ ...leadFormData, consultation_time: e.target.value })} 
                      />
                    </div>
                    <div><Label className={lbl}>Fuente</Label>
                      <Select value={leadFormData.source} onValueChange={(v) => setLeadFormData({ ...leadFormData, source: v })}>
                        <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Sección Cliente/Prospecto */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded">
                    {/* Toggle Nuevo/Existente */}
                    <div className="flex rounded overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 h-8 text-[10px] font-medium transition-colors ${
                          isNewProspect 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setIsNewProspect(true);
                          setLeadFormData({ ...leadFormData, client_id: '', client_name: '', client_phone: '', client_email: '' });
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }}
                      >
                        Nuevo Prospecto
                      </button>
                      <button
                        type="button"
                        className={`flex-1 h-8 text-[10px] font-medium transition-colors ${
                          !isNewProspect 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setIsNewProspect(false);
                          // NO abrir dropdown automáticamente, solo cambiar modo
                        }}
                      >
                        Cliente Existente
                      </button>
                    </div>

                    {/* Búsqueda de Cliente (solo visible en modo existente) */}
                    {!isNewProspect && (
                      <div className="relative">
                        <Input 
                          className={inp} 
                          placeholder="Buscar por nombre, DNI o teléfono..." 
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            if (!showClientDropdown) setShowClientDropdown(true);
                          }}
                          onClick={() => {
                            // Toggle al hacer click
                            setShowClientDropdown(!showClientDropdown);
                          }}
                          onBlur={() => {
                            // Delay para permitir click en items
                            setTimeout(() => setShowClientDropdown(false), 200);
                          }}
                        />
                        {showClientDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded shadow-lg max-h-48 overflow-auto border">
                            {filteredClientsForLead.length > 0 ? (
                              filteredClientsForLead.slice(0, 10).map(c => (
                                <div 
                                  key={c.id} 
                                  className="p-2 hover:bg-gray-50 cursor-pointer text-[11px] border-b last:border-0"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevenir onBlur del input
                                    setLeadFormData({
                                      ...leadFormData,
                                      client_id: c.id,
                                      client_name: c.full_name,
                                      client_phone: c.phone || '',
                                      client_email: c.email || ''
                                    });
                                    setClientSearch('');
                                    setShowClientDropdown(false);
                                  }}
                                >
                                  <p className="font-medium">{c.full_name}</p>
                                  <p className="text-gray-400 text-[9px]">{c.phone} {c.client_status && `• ${c.client_status}`}</p>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-[10px] text-gray-500 text-center">
                                {clientSearch ? 'No se encontraron clientes' : 'Todos los clientes'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formulario de Datos (siempre visible) */}
                    <div>
                      <Label className={lbl}>
                        {leadFormData.client_id ? 'Datos del Cliente Seleccionado' : isNewProspect ? 'Datos del Prospecto' : 'Datos del Cliente'}
                      </Label>
                      <div className="space-y-2">
                        <Input 
                          className={inp} 
                          placeholder="Nombre completo *" 
                          value={leadFormData.client_name} 
                          onChange={(e) => setLeadFormData({ ...leadFormData, client_name: e.target.value })} 
                          disabled={!isNewProspect && leadFormData.client_id}
                          required 
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            className={inp} 
                            placeholder="Teléfono *" 
                            value={leadFormData.client_phone} 
                            onChange={(e) => setLeadFormData({ ...leadFormData, client_phone: e.target.value })} 
                            disabled={!isNewProspect && leadFormData.client_id}
                            required 
                          />
                          <Input 
                            className={inp} 
                            placeholder="Email" 
                            type="email" 
                            value={leadFormData.client_email} 
                            onChange={(e) => setLeadFormData({ ...leadFormData, client_email: e.target.value })} 
                            disabled={!isNewProspect && leadFormData.client_id}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className={lbl}>Presupuesto</Label>
                    <Input className={inp} placeholder="Ej: 10000000" value={leadFormData.budget} onChange={(e) => setLeadFormData({ ...leadFormData, budget: e.target.value })} />
                  </div>
                  
                  <div>
                    <Label className={lbl}>Vehículos de interés</Label>
                    <div className="relative">
                      <div className="flex gap-1">
                        <Input className={`${inp} flex-1`} placeholder="Buscar por marca, modelo, año o dominio..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} onFocus={() => setShowVehicleDropdown(true)} />
                        <Button type="button" variant="outline" className="h-8 px-2" onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}><ChevronDown className="w-3.5 h-3.5" /></Button>
                      </div>
                      {showVehicleDropdown && filteredAvailableVehicles.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto">
                          {filteredAvailableVehicles.slice(0, 8).map(v => (
                            <div key={v.id} className="p-2 hover:bg-gray-50 cursor-pointer text-[11px] border-b last:border-0" onClick={() => { addVehicleToLead(v); setShowVehicleDropdown(false); }}>
                              <span className="font-medium uppercase">{v.brand} {v.model}</span> <span className="text-gray-500">{v.year} • {v.plate}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {leadFormData.interested_vehicles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {leadFormData.interested_vehicles.map(iv => (
                          <Badge key={iv.vehicle_id} variant="secondary" className="text-[10px] pr-1 flex items-center gap-1">
                            {iv.vehicle_description}
                            <button type="button" onClick={() => removeVehicleFromLead(iv.vehicle_id)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div><Label className={lbl}>Otros intereses</Label><Input className={inp} value={leadFormData.other_interests} onChange={(e) => setLeadFormData({ ...leadFormData, other_interests: e.target.value })} placeholder="Vehículos que no están en stock, características buscadas..." /></div>

                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-3.5 h-3.5 text-gray-500" />
                      <Label className="text-[10px] font-medium text-gray-600">Permuta (opcional)</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input className={inp} placeholder="Marca" value={leadFormData.trade_in?.brand || ''} onChange={(e) => setLeadFormData({ ...leadFormData, trade_in: { ...leadFormData.trade_in, brand: e.target.value } })} />
                      <Input className={inp} placeholder="Modelo" value={leadFormData.trade_in?.model || ''} onChange={(e) => setLeadFormData({ ...leadFormData, trade_in: { ...leadFormData.trade_in, model: e.target.value } })} />
                      <Input className={inp} placeholder="Año" value={leadFormData.trade_in?.year || ''} onChange={(e) => setLeadFormData({ ...leadFormData, trade_in: { ...leadFormData.trade_in, year: e.target.value } })} />
                      <Input className={inp} placeholder="Km" value={leadFormData.trade_in?.kilometers || ''} onChange={(e) => setLeadFormData({ ...leadFormData, trade_in: { ...leadFormData.trade_in, kilometers: e.target.value } })} />
                    </div>
                  </div>

                  <div><Label className={lbl}>Observaciones</Label><Textarea className="text-[11px] min-h-[60px] bg-white" value={leadFormData.observations} onChange={(e) => setLeadFormData({ ...leadFormData, observations: e.target.value })} /></div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className={lbl}>Estado</Label>
                      <Select value={leadFormData.status} onValueChange={(v) => setLeadFormData({ ...leadFormData, status: v })}>
                        <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s} className="text-[11px]">{STATUS_CONFIG[s].icon} {s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={lbl}>Interés</Label>
                      <Select value={leadFormData.interest_level} onValueChange={(v) => setLeadFormData({ ...leadFormData, interest_level: v })}>
                        <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.keys(INTEREST_CONFIG).map(i => <SelectItem key={i} value={i} className="text-[11px]">{INTEREST_CONFIG[i].icon} {i}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <Label className="text-[10px] font-medium text-gray-600">Seguimiento</Label>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] px-3" onClick={() => setShowScheduleDialog(true)}>
                        <Calendar className="w-3 h-3 mr-1" />
                        Agendar seguimiento
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowConfirmLead(true)} className="h-8 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">{editingLead ? 'Guardar' : 'Crear'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                {loadingLeads ? (
                  <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" /></div>
                ) : filteredLeads.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="border-b">
                        <tr>
                          {selectionMode && (
                            <th className="px-2 py-2 w-8">
                              <Checkbox checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} onCheckedChange={() => setSelectedLeads(selectedLeads.length === filteredLeads.length ? [] : filteredLeads.map(l => l.id))} className="h-3.5 w-3.5" />
                            </th>
                          )}
                          <th className="text-left px-2 py-2 font-semibold text-gray-900">Fecha</th>
                          <th className="text-left px-2 py-2 font-semibold text-gray-900">Cliente</th>
                          <th className="text-left px-2 py-2 font-semibold text-gray-900">Contacto</th>
                          <th className="text-left px-2 py-2 font-semibold text-gray-900">Interés</th>
                          <th className="text-left px-2 py-2 font-semibold text-gray-900">Estado</th>
                          <th className="text-left px-2 py-2 font-semibold text-gray-900">Seguimiento</th>
                          <th className="px-2 py-2 w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((l) => (
                          <tr key={l.id} className={`border-b hover:bg-gray-50 cursor-pointer ${selectedLeads.includes(l.id) ? 'bg-cyan-50' : ''}`} onClick={() => selectionMode ? setSelectedLeads(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id]) : handleSelectLead(l)}>
                            {selectionMode && (
                              <td className="px-2 py-2" onClick={(e) => { e.stopPropagation(); setSelectedLeads(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id]); }}>
                                <Checkbox checked={selectedLeads.includes(l.id)} className="h-3.5 w-3.5" />
                              </td>
                            )}
                            <td className="px-2 py-2">{l.consultation_date ? format(new Date(l.consultation_date), 'dd/MM/yy') : '-'}</td>
                            <td className="px-2 py-2 font-medium">{l.client_name}</td>
                            <td className="px-2 py-2"><span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-gray-400" />{l.client_phone}</span></td>
                            <td className="px-2 py-2"><Badge className={`text-[9px] ${INTEREST_CONFIG[l.interest_level]?.bg || 'bg-gray-100 text-gray-600'}`}>{INTEREST_CONFIG[l.interest_level]?.icon} {l.interest_level || 'Medio'}</Badge></td>
                            <td className="px-2 py-2"><Badge className={`text-[9px] ${STATUS_CONFIG[l.status]?.bg || 'bg-gray-100 text-gray-600'}`}>{STATUS_CONFIG[l.status]?.icon} {l.status || 'Nuevo'}</Badge></td>
                            <td className="px-2 py-2">{l.follow_up_date ? format(new Date(l.follow_up_date), 'dd/MM/yy') : '-'}</td>
                            <td className="px-1 py-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditLead(l)}><Edit className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { if (window.confirm('¿Eliminar?')) deleteLeadMutation.mutate(l.id); }}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6"><Users className="w-8 h-8 text-gray-300 mx-auto mb-1" /><p className="text-[11px] text-gray-500">Sin consultas</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-[11px] bg-white" />
              </div>
              {selectedClients.length > 0 && (
                <Button variant="outline" onClick={handleBulkDeleteClients} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar ({selectedClients.length})
                </Button>
              )}
              {selectionMode ? (
                <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedClients([]); }} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">Cancelar selección</Button>
              ) : (
                <Button variant="outline" onClick={() => setSelectionMode(true)} className="h-8 text-[11px]">Selección múltiple</Button>
              )}
              <Button onClick={() => setShowClientForm(true)} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo Cliente
              </Button>
            </div>

            <ConfirmDialog open={showConfirmClient} onOpenChange={setShowConfirmClient} onConfirm={resetClientForm} />
            <Dialog open={showClientForm} onOpenChange={(open) => { if (!open) setShowConfirmClient(true); else setShowClientForm(true); }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg"><DialogTitle className="text-sm font-semibold">{editingClient ? 'Editar' : 'Nuevo'} Cliente</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitClient} className="p-4 space-y-3">
                  <div><Label className={lbl}>Nombre completo *</Label><Input className={inp} value={clientFormData.full_name} onChange={(e) => setClientFormData({ ...clientFormData, full_name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className={lbl}>Teléfono *</Label><Input className={inp} value={clientFormData.phone} onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })} required /></div>
                    <div><Label className={lbl}>Email</Label><Input className={inp} type="email" value={clientFormData.email} onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className={lbl}>DNI</Label><Input className={inp} value={clientFormData.dni} onChange={(e) => setClientFormData({ ...clientFormData, dni: e.target.value })} /></div>
                    <div><Label className={lbl}>CUIT/CUIL</Label><Input className={inp} value={clientFormData.cuit_cuil} onChange={(e) => setClientFormData({ ...clientFormData, cuit_cuil: e.target.value })} /></div>
                  </div>
                  <div><Label className={lbl}>Dirección</Label><Input className={inp} value={clientFormData.address} onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })} /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={clientFormData.city} onChange={(e) => setClientFormData({ ...clientFormData, city: e.target.value })} /></div>
                    <div><Label className={lbl}>Provincia</Label><Input className={inp} value={clientFormData.province} onChange={(e) => setClientFormData({ ...clientFormData, province: e.target.value })} /></div>
                    <div><Label className={lbl}>CP</Label><Input className={inp} value={clientFormData.postal_code} onChange={(e) => setClientFormData({ ...clientFormData, postal_code: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label className={lbl}>Estado civil</Label>
                    <Select value={clientFormData.marital_status} onValueChange={(v) => setClientFormData({ ...clientFormData, marital_status: v })}>
                      <SelectTrigger className={inp}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Otro'].map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className={lbl}>Observaciones</Label><Textarea className="text-[11px] min-h-[60px] bg-white" value={clientFormData.observations} onChange={(e) => setClientFormData({ ...clientFormData, observations: e.target.value })} /></div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowConfirmClient(true)} className="h-8 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">{editingClient ? 'Guardar' : 'Crear'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                {loadingClients ? (
                  <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" /></div>
                ) : filteredClients.length > 0 ? (
                  <div className="divide-y">
                    {selectionMode && (
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <Checkbox checked={selectedClients.length === filteredClients.length && filteredClients.length > 0} onCheckedChange={() => setSelectedClients(selectedClients.length === filteredClients.length ? [] : filteredClients.map(c => c.id))} className="h-3.5 w-3.5" />
                        <span className="ml-2 text-[10px] text-gray-500">Seleccionar todos</span>
                      </div>
                    )}
                    {filteredClients.map(client => (
                        <div key={client.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${selectedClients.includes(client.id) ? 'bg-cyan-50' : ''}`} onClick={(e) => {
                          if (selectionMode) {
                            setSelectedClients(prev => prev.includes(client.id) ? prev.filter(x => x !== client.id) : [...prev, client.id]);
                          } else {
                            // Navegar a la URL del cliente
                            navigate(`/clients/${client.id}`);
                          }
                        }}>
                          <div className="flex items-center gap-3">
                            {selectionMode && (
                              <Checkbox checked={selectedClients.includes(client.id)} className="h-3.5 w-3.5" onClick={(e) => e.stopPropagation()} />
                            )}
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-500" /></div>
                            <div>
                              <p className="font-medium text-[12px]">{client.full_name}</p>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                                {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                                {client.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.city}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {client.dni && <Badge variant="outline" className="text-[9px]">{client.dni}</Badge>}
                            <Badge className={`text-[9px] ${client.client_status === 'Cliente' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'}`}>{client.client_status || 'Prospecto'}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClient(client)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar?')) deleteClientMutation.mutate(client.id); }}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6"><User className="w-8 h-8 text-gray-300 mx-auto mb-1" /><p className="text-[11px] text-gray-500">Sin clientes</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}