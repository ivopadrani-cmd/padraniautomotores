import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";
import { ArrowLeft, Edit, Phone, DollarSign, Car, CheckCircle, FileText, Receipt, ShoppingCart, Trash2, MessageCircle, User, Eye, X, ChevronDown } from "lucide-react";
import WhatsAppButton, { QuickContactButton } from "../common/WhatsAppButton";
import SaleFormDialog from "../sales/SaleFormDialog";
import SaleDetail from "../sales/SaleDetail";
import ReservationForm from "../reservations/ReservationForm";
import ReservationDetail from "../reservations/ReservationDetail";
import { format } from "date-fns";
import VehicleView from "../vehicles/VehicleView";
import QuoteForm from "../quotes/QuoteForm";
import QuotePrintView from "../quotes/QuotePrintView";
import MultiQuotePrintView from "../quotes/MultiQuotePrintView";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  'Nuevo': 'bg-cyan-100 text-gray-900',
  'Contactado': 'bg-gray-200 text-gray-900',
  'En negociación': 'bg-cyan-200 text-gray-900',
  'Concretado': 'bg-gray-900 text-white',
  'Perdido': 'bg-red-100 text-gray-900'
};

const SOURCE_OPTIONS = ['Salón', 'Llamada', 'Redes sociales', 'Recomendado'];

export default function LeadDetail({ lead, onClose, onEdit, showEditModal = false, onCloseEditModal }) {
  const navigate = useNavigate();
  
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingFormData, setEditingFormData] = useState(null);
  const [isNewProspect, setIsNewProspect] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  const [selectedVehicleForQuote, setSelectedVehicleForQuote] = useState(null);
  const [showQuotePrint, setShowQuotePrint] = useState(null);
  const [showMultiQuotePrint, setShowMultiQuotePrint] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedVehicleForSale, setSelectedVehicleForSale] = useState(null);
  const [clientFormData, setClientFormData] = useState({ dni: '', cuit_cuil: '', address: '', city: '', province: '' });
  const [lastCreatedQuotes, setLastCreatedQuotes] = useState([]);
  const [lastTradeIn, setLastTradeIn] = useState(null);

  // Inicializar datos del formulario cuando se abre el modal
  React.useEffect(() => {
    if (showEditModal && lead && !editingFormData) {
      setEditingFormData({
        consultation_date: lead.consultation_date,
        consultation_time: lead.consultation_time || '',
        source: lead.source || '',
        client_id: lead.client_id || '',
        client_name: lead.client_name,
        client_phone: lead.client_phone || '',
        client_email: lead.client_email || '',
        interested_vehicles: lead.interested_vehicles || [],
        other_interests: lead.other_interests || '',
        budget: lead.budget?.toString() || '',
        preferred_contact: lead.preferred_contact || 'WhatsApp',
        trade_in: lead.trade_in || { brand: '', model: '', year: '', kilometers: '', plate: '', color: '', photos: [] },
        status: lead.status,
        interest_level: lead.interest_level || 'Medio',
        observations: lead.observations || '',
        follow_up_date: lead.follow_up_date || '',
        follow_up_time: lead.follow_up_time || '',
        isNewProspect: !lead.client_id, // Si tiene client_id es cliente existente
        clientSearch: '',
        showClientDropdown: false,
        vehicleSearch: '',
        showVehicleDropdown: false
      });
      setIsNewProspect(!lead.client_id);
      setClientSearch('');
      setShowClientDropdown(false);
      setVehicleSearch('');
      setShowVehicleDropdown(false);
    }
  }, [showEditModal, lead, editingFormData]);

  // Función para manejar el submit del formulario de edición
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingFormData) return;

    try {
      await base44.entities.Lead.update(lead.id, editingFormData);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      toast.success('Consulta actualizada correctamente');
      onCloseEditModal && onCloseEditModal();
      setEditingFormData(null);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error al actualizar la consulta');
    }
  };


  const queryClient = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ['client', lead.client_id],
    queryFn: () => base44.entities.Client.list().then(cs => cs.find(c => c.id === lead.client_id)),
    enabled: !!lead.client_id
  });

  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles'], queryFn: () => base44.entities.Vehicle.list() });

  // Funciones para el modal de edición
  const addVehicleToLead = (vehicle) => {
    if (editingFormData && !editingFormData.interested_vehicles.some(iv => iv.vehicle_id === vehicle.id)) {
      setEditingFormData({
        ...editingFormData,
        interested_vehicles: [...editingFormData.interested_vehicles, {
          vehicle_id: vehicle.id,
          vehicle_description: `${vehicle.brand} ${vehicle.model} ${vehicle.year} • ${vehicle.plate}`
        }]
      });
    }
  };

  const removeVehicleFromLead = (vehicleId) => {
    if (editingFormData) {
      setEditingFormData({
        ...editingFormData,
        interested_vehicles: editingFormData.interested_vehicles.filter(iv => iv.vehicle_id !== vehicleId)
      });
    }
  };

  // Filtros para el modal
  const filteredClientsForLead = clients.filter(c =>
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  );

  const filteredAvailableVehicles = vehicles.filter(v =>
    v.brand?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.plate?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const { data: leadQuotes = [] } = useQuery({ 
    queryKey: ['lead-quotes', lead.id], 
    queryFn: () => base44.entities.Quote.filter({ lead_id: lead.id }, '-quote_date'),
    enabled: !!lead.id 
  });

  const { data: rates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.list('-rate_date')
  });
  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

  const interestedVehicles = lead.interested_vehicles?.map(iv => vehicles.find(v => v.id === iv.vehicle_id)).filter(Boolean) || [];

  // Query para todas las ventas y reservas (para detectar si ya existen)
  const { data: allSales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date')
  });
  
  const { data: allReservations = [] } = useQuery({
    queryKey: ['all-reservations'],
    queryFn: () => base44.entities.Reservation.list('-reservation_date')
  });

  const convertToClientMutation = useMutation({
    mutationFn: async (data) => {
      const newClient = await base44.entities.Client.create({
        ...data,
        full_name: lead.client_name,
        phone: lead.client_phone,
        email: lead.client_email,
        client_status: 'Cliente'
      });
      await base44.entities.Lead.update(lead.id, { client_id: newClient.id, status: 'En negociación' });
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowConvertDialog(false);
      toast.success("Cliente creado exitosamente");
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data) => {
      // Mapear 'date' a 'quote_date' y remover 'date'
      const { date, ...restData } = data;
      const quoteData = { ...restData, quote_date: date };
      return data.id ? base44.entities.Quote.update(data.id, quoteData) : base44.entities.Quote.create(quoteData);
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['lead-quotes'] });
      setShowQuotePrint({ ...variables, id: result?.id || variables.id });
      setShowQuoteForm(false);
      setEditingQuote(null);
      toast.success(variables.id ? "Presupuesto actualizado" : "Presupuesto guardado");
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['quotes'] }); 
      queryClient.invalidateQueries({ queryKey: ['lead-quotes'] }); 
      toast.success("Presupuesto eliminado"); 
    },
  });
  
  const [editingQuote, setEditingQuote] = useState(null);

  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationPrefillData, setReservationPrefillData] = useState(null);
  const [showSaleDetail, setShowSaleDetail] = useState(null);
  const [showReservationDetail, setShowReservationDetail] = useState(null);
  const [salePrefillData, setSalePrefillData] = useState(null);

  const handleCreateQuote = (vehicle) => {
    setSelectedVehicleForQuote(vehicle);
    setShowQuoteForm(true);
  };

  const handleStartSale = (vehicle) => {
    setSelectedVehicleForSale(vehicle);
    setSalePrefillData({
      vehicle,
      lead,
      client_id: lead.client_id,
      client_name: lead.client_name,
      client_phone: lead.client_phone
    });
    setShowSaleForm(true);
  };

  const handleStartReservation = (vehicle) => {
    setSelectedVehicleForSale(vehicle);
    setReservationPrefillData({
      vehicle,
      lead,
      client_id: lead.client_id,
      client_name: lead.client_name,
      client_phone: lead.client_phone
    });
    setShowReservationForm(true);
  };


  // Render QuotePrintView as dialog
  const renderQuotePrint = showQuotePrint && (
    <QuotePrintView 
      open={!!showQuotePrint}
      onOpenChange={(open) => { if (!open) { setShowQuotePrint(null); setSelectedVehicleForQuote(null); } }}
      quote={showQuotePrint} 
      vehicle={selectedVehicleForQuote} 
      client={client}
      onEdit={(q) => { setEditingQuote(q); setShowQuotePrint(null); setShowQuoteForm(true); }}
    />
  );

  const renderMultiQuotePrint = showMultiQuotePrint && (
    <MultiQuotePrintView
      open={!!showMultiQuotePrint}
      onOpenChange={(open) => { if (!open) setShowMultiQuotePrint(null); }}
      quotes={showMultiQuotePrint}
      client={client}
      tradeIn={lastTradeIn}
    />
  );

  const inp = "h-7 text-[11px]";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <div className={`p-2 md:p-4 bg-gray-100 min-h-screen ${showEditModal ? 'blur-sm pointer-events-none' : ''}`}>
      {renderQuotePrint}
      {renderMultiQuotePrint}
      <SaleFormDialog 
        open={showSaleForm} 
        onOpenChange={(o) => { setShowSaleForm(o); if (!o) { setSelectedVehicleForSale(null); setSalePrefillData(null); } }} 
        vehicle={selectedVehicleForSale}
        prefillData={salePrefillData}
        onSaleCreated={(sale) => {
          // Abrir SaleDetail cuando faltan datos o siempre después de crear
          setShowSaleDetail(sale);
          setShowSaleForm(false);
        }}
      />
      <ReservationForm
        open={showReservationForm}
        onOpenChange={(o) => { setShowReservationForm(o); if (!o) { setReservationPrefillData(null); setSelectedVehicleForSale(null); } }}
        vehicle={reservationPrefillData?.vehicle || selectedVehicleForSale}
        quote={reservationPrefillData?.quote}
        lead={lead}
        onSubmit={async (data) => {
          await base44.entities.Reservation.create(data);
          const vehicleToUpdate = reservationPrefillData?.vehicle || selectedVehicleForSale;
          if (vehicleToUpdate) {
            await base44.entities.Vehicle.update(vehicleToUpdate.id, { status: 'RESERVADO' });
          }

          // Crear vehículo de permuta si existe
          if (data.trade_in && data.trade_in.brand && data.trade_in.model) {
            await base44.entities.Vehicle.create({
              brand: data.trade_in.brand,
              model: data.trade_in.model,
              year: parseInt(data.trade_in.year) || new Date().getFullYear(),
              plate: data.trade_in.plate || '',
              kilometers: parseFloat(data.trade_in.kilometers) || 0,
              color: data.trade_in.color || '',
              status: 'A PERITAR',
              supplier_client_id: data.client_id,
              supplier_client_name: data.client_name,
              photos: data.trade_in.photos || []
            });
            toast.success(`Vehículo ${data.trade_in.brand} ${data.trade_in.model} agregado como A PERITAR`);
          }

          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          setShowReservationForm(false);
          toast.success("Reserva creada");
        }}
      />
      <QuoteForm 
        open={showQuoteForm} 
        onOpenChange={(open) => { if (!open) { setShowQuoteForm(false); setSelectedVehicleForQuote(null); setEditingQuote(null); } }}
        vehicle={selectedVehicleForQuote} 
        lead={lead}
        editingQuote={editingQuote}
        multiVehicleMode={!selectedVehicleForQuote && !editingQuote}
        onSubmit={async (data) => {
          // Handle multiple quotes
          if (Array.isArray(data)) {
            const createdQuotes = [];
            for (const q of data) {
              const { date, ...restQ } = q;
              const result = await base44.entities.Quote.create({ ...restQ, quote_date: date, lead_id: lead.id, client_id: lead.client_id });
              createdQuotes.push({ ...q, id: result.id });
            }
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['lead-quotes'] });
            setShowQuoteForm(false);
            setLastTradeIn(data[0]?.trade_in);
            setShowMultiQuotePrint(createdQuotes);
            toast.success(`${createdQuotes.length} presupuestos creados`);
          } else {
            createQuoteMutation.mutate({ ...data, lead_id: lead.id, client_id: lead.client_id });
          }
        }}
      />
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onClose} className="h-6 text-[10px] px-2">
            <ArrowLeft className="w-3 h-3 mr-1" /> Volver
          </Button>
          <div className="flex gap-1.5">
            {lead.client_id && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] border-sky-200 text-sky-700 hover:bg-sky-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const clientUrl = `/clients/${lead.client_id}`;
                  console.log('🔵 NAVEGANDO A CLIENTE:');
                  console.log('  - lead.client_id:', lead.client_id);
                  console.log('  - URL destino:', clientUrl);
                  console.log('  - Cliente data:', client);
                  // Navegar directamente sin replace para permitir volver atrás
                  navigate(clientUrl);
                }}
              >
                <User className="w-3.5 h-3.5 mr-1.5" /> 
                {client?.client_status === 'Prospecto' ? 'Ver Prospecto' : 'Ver Cliente'}
              </Button>
            )}
            {!lead.client_id && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] border-green-200 text-green-700 hover:bg-green-50" 
                onClick={() => setShowConvertDialog(true)}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Convertir a Cliente
              </Button>
            )}
            <Button onClick={() => onEdit(lead)} className="h-7 text-[10px] bg-sky-600 hover:bg-sky-700">
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
            </Button>
          </div>
        </div>

        {/* Convert Dialog */}
        <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-sm">Completar datos del cliente</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); convertToClientMutation.mutate(clientFormData); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className={lbl}>DNI</Label><Input className={inp} value={clientFormData.dni} onChange={(e) => setClientFormData({ ...clientFormData, dni: e.target.value })} /></div>
                <div><Label className={lbl}>CUIT/CUIL</Label><Input className={inp} value={clientFormData.cuit_cuil} onChange={(e) => setClientFormData({ ...clientFormData, cuit_cuil: e.target.value })} /></div>
                <div className="col-span-2"><Label className={lbl}>Dirección</Label><Input className={inp} value={clientFormData.address} onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })} /></div>
                <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={clientFormData.city} onChange={(e) => setClientFormData({ ...clientFormData, city: e.target.value })} /></div>
                <div><Label className={lbl}>Provincia</Label><Input className={inp} value={clientFormData.province} onChange={(e) => setClientFormData({ ...clientFormData, province: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setShowConvertDialog(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="h-6 text-[10px]" disabled={convertToClientMutation.isPending}>
                  {convertToClientMutation.isPending ? 'Creando...' : 'Crear Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Main Info */}
        <Card className="shadow-sm">
          <CardHeader className="border-b p-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-bold">{lead.client_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[9px] ${STATUS_CONFIG[lead.status]}`}>{lead.status}</Badge>
                    <Badge className={`text-[9px] ${lead.interest_level === 'Alta' ? 'bg-cyan-100 text-gray-900' : lead.interest_level === 'Media' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600'}`}>
                      Interés {lead.interest_level}
                    </Badge>
                  </div>
                </div>
                <QuickContactButton phone={lead.client_phone} name={lead.client_name} />
              </div>
              <div className="text-right text-[10px] text-gray-500">
                <p>Consulta: {lead.consultation_date && format(new Date(lead.consultation_date), 'dd/MM/yy')}{lead.consultation_time && ` ${lead.consultation_time}`}</p>
                {lead.follow_up_date && <p>Seguimiento: {format(new Date(lead.follow_up_date), 'dd/MM/yy')}</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-4 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-[9px]">Teléfono</p>
                  <a href={`tel:${lead.client_phone}`} className="font-medium hover:text-cyan-600">{lead.client_phone}</a>
                </div>
              </div>
              {lead.client_email && (
                <div>
                  <p className="text-gray-400 text-[9px]">Email</p>
                  <p className="font-medium">{lead.client_email}</p>
                </div>
              )}
              {lead.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-gray-400 text-[9px]">Presupuesto</p>
                    <p className="font-bold text-green-600">{lead.budget}</p>
                  </div>
                </div>
              )}
            </div>
            {lead.observations && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-[11px]">
                <p className="text-gray-400 text-[9px] mb-1">Observaciones</p>
                <p className="text-gray-700">{lead.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade-in Vehicle */}
        {lead.trade_in && (lead.trade_in.brand || lead.trade_in.model) && (
          <Card className="shadow-sm">
            <CardHeader className="border-b p-3">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-orange-600" /> Vehículo en Permuta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="text-gray-400 text-[9px]">Vehículo</p>
                  <p className="font-medium">{lead.trade_in.brand} {lead.trade_in.model} {lead.trade_in.year}</p>
                </div>
                {lead.trade_in.plate && (
                  <div>
                    <p className="text-gray-400 text-[9px]">Dominio</p>
                    <p className="font-medium">{lead.trade_in.plate}</p>
                  </div>
                )}
                {lead.trade_in.kilometers && (
                  <div>
                    <p className="text-gray-400 text-[9px]">Kilómetros</p>
                    <p className="font-medium">{lead.trade_in.kilometers?.toLocaleString('es-AR')} km</p>
                  </div>
                )}
                {lead.trade_in.color && (
                  <div>
                    <p className="text-gray-400 text-[9px]">Color</p>
                    <p className="font-medium">{lead.trade_in.color}</p>
                  </div>
                )}
              </div>

              {/* Fotos del vehículo */}
              {lead.trade_in.photos && lead.trade_in.photos.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-400 text-[9px] mb-2">Fotos del vehículo</p>
                  <div className="grid grid-cols-3 gap-2">
                    {lead.trade_in.photos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interested Vehicles */}
        {interestedVehicles.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="border-b p-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-sky-600" /> Vehículos de Interés ({interestedVehicles.length})
              </CardTitle>
              <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => { setSelectedVehicleForQuote(null); setShowQuoteForm(true); }}>
                <FileText className="w-3 h-3 mr-1" /> Nuevo Presupuesto
              </Button>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {interestedVehicles.map(vehicle => {
                // Buscar si ya existe venta o reserva para este vehículo
                const existingSale = allSales.find(s => s.vehicle_id === vehicle.id && s.sale_status !== 'CANCELADA');
                const existingReservation = allReservations.find(r => r.vehicle_id === vehicle.id && r.status !== 'CANCELADA' && r.status !== 'CONVERTIDA');
                
                // Verificar si es del mismo cliente o de otro
                const isSaleToSameClient = existingSale && existingSale.client_id === lead.client_id;
                const isReservationToSameClient = existingReservation && existingReservation.client_id === lead.client_id;
                
                return (
                  <div key={vehicle.id} className="p-2 bg-gray-50 rounded flex justify-between items-center hover:bg-gray-100">
                    <div className="cursor-pointer flex-1" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
                      <p className="font-medium text-[12px]">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
                      <p className="text-[10px] text-gray-500">{vehicle.plate} • {vehicle.kilometers?.toLocaleString('es-AR')} km</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[12px]">${vehicle.public_price_value?.toLocaleString('es-AR')}</p>
                      
                      {/* Si ya existe venta */}
                      {existingSale ? (
                        isSaleToSameClient ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-[9px] border-green-200 text-green-700" 
                            onClick={() => setShowSaleDetail(existingSale)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> Ver Venta
                          </Button>
                        ) : (
                          <Badge className="text-[9px] px-2 py-1 bg-red-50 text-red-700 border border-red-200">
                            🚫 Vendido a otra persona
                          </Badge>
                        )
                      ) : existingReservation ? (
                        /* Si ya existe reserva */
                        isReservationToSameClient ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-6 text-[9px] border-sky-200 text-sky-700" 
                              onClick={() => setShowReservationDetail(existingReservation)}
                            >
                              <Eye className="w-3 h-3 mr-1" /> Ver Reserva
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-6 text-[9px] bg-cyan-600 hover:bg-cyan-700" 
                              onClick={() => handleStartSale(vehicle)}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" /> Vender
                            </Button>
                          </>
                        ) : (
                          <Badge className="text-[9px] px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200">
                            ⏳ Reservado a otra persona
                          </Badge>
                        )
                      ) : ['DISPONIBLE', 'A INGRESAR', 'EN REPARACION', 'PAUSADO'].includes(vehicle.status) && (
                        /* Botones normales si no hay venta ni reserva */
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-[9px]" 
                            onClick={() => handleStartReservation(vehicle)}
                          >
                            <Receipt className="w-3 h-3 mr-1" /> Reservar
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-6 text-[9px] bg-cyan-600 hover:bg-cyan-700" 
                            onClick={() => handleStartSale(vehicle)}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" /> Vender
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Lead Quotes Section */}
        {leadQuotes.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="border-b p-3">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-600" /> Presupuestos ({leadQuotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {leadQuotes.map(q => {
                const vehicle = vehicles.find(v => v.id === q.vehicle_id);
                const quoteRate = q.quoted_price_exchange_rate || currentBlueRate;
                const priceArs = q.quoted_price_ars || 0;
                const usdAtQuote = priceArs / quoteRate;
                const usdToday = priceArs / currentBlueRate;
                return (
                  <div 
                    key={q.id} 
                    className="p-3 bg-gray-50 rounded flex justify-between items-start hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedVehicleForQuote(vehicle); setShowQuotePrint(q); }}
                  >
                    <div className="text-[11px]">
                      <p className="font-medium">{q.vehicle_description || (vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : 'Vehículo')}</p>
                      <p className="text-gray-500">{format(new Date(q.quote_date), 'dd/MM/yy')}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <p className="font-bold text-[12px]">${priceArs.toLocaleString('es-AR')}</p>
                        <p className="text-[10px] font-semibold text-gray-500">ERAN: U$D {usdAtQuote.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                          <p className="text-[10px] font-semibold text-blue-700">HOY SON: U$D {usdToday.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar?')) deleteQuoteMutation.mutate(q.id); }}>
                        <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {lead.other_interests && (
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <p className="text-[9px] text-gray-400 mb-1">Otros intereses</p>
              <p className="text-[11px]">{lead.other_interests}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modales de vista de venta/reserva */}
      {showSaleDetail && (
        <SaleDetail 
          sale={showSaleDetail} 
          onClose={() => {
            setShowSaleDetail(null);
            queryClient.invalidateQueries({ queryKey: ['all-sales'] });
          }} 
        />
      )}
      {showReservationDetail && (
        <ReservationDetail 
          reservation={showReservationDetail} 
          onClose={() => {
            setShowReservationDetail(null);
            queryClient.invalidateQueries({ queryKey: ['all-reservations'] });
          }} 
        />
      )}

      {/* Modal de edición */}
      <Dialog open={showEditModal} onOpenChange={(open) => { if (!open && onCloseEditModal) onCloseEditModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
            <DialogTitle className="text-sm font-semibold">Editar Consulta</DialogTitle>
          </DialogHeader>
          {editingFormData && (
            <form onSubmit={handleEditSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Fecha *</Label><Input className="h-8 text-[11px] bg-white" type="date" value={editingFormData.consultation_date} onChange={(e) => setEditingFormData({ ...editingFormData, consultation_date: e.target.value })} required /></div>
                <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Hora</Label><Input className="h-8 text-[11px] bg-white" type="time" value={editingFormData.consultation_time} onChange={(e) => setEditingFormData({ ...editingFormData, consultation_time: e.target.value })} /></div>
                <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Fuente</Label>
                  <Select value={editingFormData.source} onValueChange={(value) => setEditingFormData({ ...editingFormData, source: value })}>
                    <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
                      editingFormData.isNewProspect
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setEditingFormData({ ...editingFormData, isNewProspect: true, client_id: '', client_name: '', client_phone: '', client_email: '' })}
                  >
                    Nuevo Prospecto
                  </button>
                  <button
                    type="button"
                    className={`flex-1 h-8 text-[10px] font-medium transition-colors ${
                      !editingFormData.isNewProspect
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setEditingFormData({ ...editingFormData, isNewProspect: false })}
                  >
                    Cliente Existente
                  </button>
                </div>

                {/* Búsqueda de Cliente (solo visible en modo existente) */}
                {!editingFormData.isNewProspect && (
                  <div className="relative">
                    <Input
                      className="h-8 text-[11px] bg-white"
                      placeholder="Buscar por nombre, DNI o teléfono..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      onClick={() => setShowClientDropdown(!showClientDropdown)}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                    />
                    {showClientDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-auto">
                        {clients.filter(c =>
                          c.full_name?.toLowerCase().includes((editingFormData.clientSearch || '').toLowerCase()) ||
                          c.phone?.includes(editingFormData.clientSearch || '')
                        ).slice(0, 10).map(c => (
                          <div
                            key={c.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer text-[11px] border-b last:border-0"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditingFormData({
                                ...editingFormData,
                                client_id: c.id,
                                client_name: c.full_name,
                                client_phone: c.phone || '',
                                client_email: c.email || '',
                                isNewProspect: false
                              });
                              setClientSearch('');
                              setShowClientDropdown(false);
                            }}
                          >
                            <p className="font-medium">{c.full_name}</p>
                            <p className="text-gray-400 text-[9px]">{c.phone} {c.client_status && `• ${c.client_status}`}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario de Datos (siempre visible) */}
                <div>
                  <Label className="text-[10px] font-medium text-gray-500 mb-0.5">
                    {editingFormData.client_id ? 'Datos del Cliente Seleccionado' : editingFormData.isNewProspect ? 'Datos del Prospecto' : 'Datos del Cliente'}
                  </Label>
                  <div className="space-y-2">
                    <Input
                      className="h-8 text-[11px] bg-white"
                      placeholder="Nombre completo *"
                      value={editingFormData.client_name}
                      onChange={(e) => setEditingFormData({ ...editingFormData, client_name: e.target.value })}
                      disabled={!editingFormData.isNewProspect && editingFormData.client_id}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        className="h-8 text-[11px] bg-white"
                        placeholder="Teléfono *"
                        value={editingFormData.client_phone}
                        onChange={(e) => setEditingFormData({ ...editingFormData, client_phone: e.target.value })}
                        disabled={!editingFormData.isNewProspect && editingFormData.client_id}
                        required
                      />
                      <Input
                        className="h-8 text-[11px] bg-white"
                        type="email"
                        placeholder="Email"
                        value={editingFormData.client_email}
                        onChange={(e) => setEditingFormData({ ...editingFormData, client_email: e.target.value })}
                        disabled={!editingFormData.isNewProspect && editingFormData.client_id}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Presupuesto</Label><Input className="h-8 text-[11px] bg-white" value={editingFormData.budget} onChange={(e) => setEditingFormData({ ...editingFormData, budget: e.target.value })} placeholder="Ej: 15.000.000 - 18.000.000" /></div>

              {/* Vehículos de interés */}
              <div>
                <Label className="text-[10px] font-medium text-gray-500 mb-1">Vehículos de interés</Label>
                <div className="relative">
                  <div className="flex gap-1">
                    <Input className="h-8 text-[11px] bg-white flex-1" placeholder="Buscar por marca, modelo, año o dominio..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} onFocus={() => setShowVehicleDropdown(true)} />
                    <Button type="button" variant="outline" className="h-8 px-2" onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}><ChevronDown className="w-3.5 h-3.5" /></Button>
                  </div>
                  {showVehicleDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto">
                      {vehicles.filter(v =>
                        v.brand?.toLowerCase().includes((editingFormData.vehicleSearch || '').toLowerCase()) ||
                        v.model?.toLowerCase().includes((editingFormData.vehicleSearch || '').toLowerCase()) ||
                        v.plate?.toLowerCase().includes((editingFormData.vehicleSearch || '').toLowerCase())
                      ).slice(0, 8).map(v => (
                        <div key={v.id} className="p-2 hover:bg-gray-50 cursor-pointer text-[11px] border-b last:border-0" onClick={() => {
                          addVehicleToLead(v);
                          setShowVehicleDropdown(false);
                        }}>
                          <span className="font-medium uppercase">{v.brand} {v.model}</span> <span className="text-gray-500">{v.year} • {v.plate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {editingFormData.interested_vehicles && editingFormData.interested_vehicles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editingFormData.interested_vehicles.map(iv => (
                      <Badge key={iv.vehicle_id} variant="secondary" className="text-[10px] pr-1 flex items-center gap-1">
                        {iv.vehicle_description}
                        <button type="button" onClick={() => setEditingFormData({
                          ...editingFormData,
                          interested_vehicles: editingFormData.interested_vehicles.filter(v => v.vehicle_id !== iv.vehicle_id)
                        })} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Otros intereses</Label><Input className="h-8 text-[11px] bg-white" value={editingFormData.other_interests} onChange={(e) => setEditingFormData({ ...editingFormData, other_interests: e.target.value })} placeholder="Vehículos que no están en stock, características buscadas..." /></div>

              {/* Trade-in */}
              <div className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-3.5 h-3.5 text-gray-500" />
                  <Label className="text-[10px] font-medium text-gray-600">Permuta (opcional)</Label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input className="h-7 text-[10px] bg-white" placeholder="Marca" value={editingFormData.trade_in?.brand || ''} onChange={(e) => setEditingFormData({ ...editingFormData, trade_in: { ...editingFormData.trade_in, brand: e.target.value } })} />
                  <Input className="h-7 text-[10px] bg-white" placeholder="Modelo" value={editingFormData.trade_in?.model || ''} onChange={(e) => setEditingFormData({ ...editingFormData, trade_in: { ...editingFormData.trade_in, model: e.target.value } })} />
                  <Input className="h-7 text-[10px] bg-white" placeholder="Año" value={editingFormData.trade_in?.year || ''} onChange={(e) => setEditingFormData({ ...editingFormData, trade_in: { ...editingFormData.trade_in, year: e.target.value } })} />
                  <Input className="h-7 text-[10px] bg-white" placeholder="Km" value={editingFormData.trade_in?.kilometers || ''} onChange={(e) => setEditingFormData({ ...editingFormData, trade_in: { ...editingFormData.trade_in, kilometers: e.target.value } })} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input className="h-7 text-[10px] bg-white" placeholder="Dominio" value={editingFormData.trade_in?.plate || ''} onChange={(e) => setEditingFormData({ ...editingFormData, trade_in: { ...editingFormData.trade_in, plate: e.target.value } })} />
                  <Input className="h-7 text-[10px] bg-white" placeholder="Color" value={editingFormData.trade_in?.color || ''} onChange={(e) => setEditingFormData({ ...editingFormData, trade_in: { ...editingFormData.trade_in, color: e.target.value } })} />
                </div>
              </div>

              <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Observaciones</Label><Textarea className="text-[11px] min-h-[60px] bg-white" value={editingFormData.observations} onChange={(e) => setEditingFormData({ ...editingFormData, observations: e.target.value })} /></div>

              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Estado</Label>
                  <Select value={editingFormData.status} onValueChange={(value) => setEditingFormData({ ...editingFormData, status: value })}>
                    <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s} className="text-[11px]">{STATUS_CONFIG[s].icon} {s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[10px] font-medium text-gray-500 mb-0.5">Interés</Label>
                  <Select value={editingFormData.interest_level} onValueChange={(value) => setEditingFormData({ ...editingFormData, interest_level: value })}>
                    <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(INTEREST_CONFIG).map(i => <SelectItem key={i} value={i} className="text-[11px]">{INTEREST_CONFIG[i].icon} {i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => { onCloseEditModal && onCloseEditModal(); setEditingFormData(null); }} className="h-8 text-[11px]">Cancelar</Button>
                <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">Guardar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}