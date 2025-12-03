import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit, ExternalLink, FileText, Users, ShoppingCart, Calendar as CalendarIcon, DollarSign, User, Trash2, Download, ChevronLeft, ChevronRight, Clock, Wrench, CheckCircle, PauseCircle, Tag, XCircle, Receipt, Eye, Check, X, Share2, MapPin, Plus, Mail, MessageCircle, Send, Printer, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import ClientDetail from "../clients/ClientDetail";
import LeadDetail from "../crm/LeadDetail";
import QuoteForm from "../quotes/QuoteForm";
import QuotePrintView from "../quotes/QuotePrintView";
import ReservationForm from "../reservations/ReservationForm";
import ReservationEditForm from "../reservations/ReservationEditForm";
import StartQuoteDialog from "../quotes/StartQuoteDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ReservationDetail from "../reservations/ReservationDetail";
import SaleFormDialog from "../sales/SaleFormDialog";
import SaleDetail from "../sales/SaleDetail";
import StartSaleDialog from "../sales/StartSaleDialog";
import StartReservationDialog from "../sales/StartReservationDialog";
import SalesContractView from "../sales/SalesContractView";
import ExpenseEditDialog from "./ExpenseEditDialog";
import ConsignmentContractView from "./ConsignmentContractView";
import DocumentEditDialog from "./DocumentEditDialog";
import InspectionForm from "./InspectionForm";
import InspectionView from "./InspectionView";
import RequestInspectionDialog from "./RequestInspectionDialog";
import InspectionApprovalDialog from "./InspectionApprovalDialog";
import CostPriceDialog from "./CostPriceDialog";
import InfoAutoPriceDialog from "./InfoAutoPriceDialog";
import TargetPriceDialog from "./TargetPriceDialog";
import PublicPriceDialog from "./PublicPriceDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  'A PERITAR': { bg: 'bg-amber-100 text-amber-700', icon: Wrench },
  'A INGRESAR': { bg: 'bg-cyan-100 text-cyan-700', icon: Clock },
  'EN REPARACION': { bg: 'bg-gray-200 text-gray-600', icon: Wrench },
  'DISPONIBLE': { bg: 'bg-cyan-500 text-white', icon: CheckCircle },
  'PAUSADO': { bg: 'bg-gray-200 text-gray-500', icon: PauseCircle },
  'RESERVADO': { bg: 'bg-gray-900 text-white', icon: Tag },
  'VENDIDO': { bg: 'bg-red-100 text-red-700', icon: ShoppingCart },
  'ENTREGADO': { bg: 'bg-red-600 text-white', icon: XCircle },
  'DESCARTADO': { bg: 'bg-red-200 text-red-800', icon: XCircle }
};

const convertValue = (value, currency, exchangeRate, targetCurrency) => {
  if (!value || !exchangeRate) return 0;
  if (currency === targetCurrency) return value;
  if (currency === 'ARS' && targetCurrency === 'USD') return value / exchangeRate;
  if (currency === 'USD' && targetCurrency === 'ARS') return value * exchangeRate;
  return value;
};

export default function VehicleView({ vehicle, onClose, onEdit, onDelete }) {
  const navigate = useNavigate();
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState('ARS');
  
  // Quote states
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showQuotePrint, setShowQuotePrint] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  
  // Reservation states
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(null);
  const [reservationPrefillData, setReservationPrefillData] = useState(null);
  
  // Sale states
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showStartSale, setShowStartSale] = useState(false);
  const [showStartReservation, setShowStartReservation] = useState(false);
  const [salePrefillData, setSalePrefillData] = useState(null);
  const [showSaleDetail, setShowSaleDetail] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [showContractView, setShowContractView] = useState(null);

  // Quote dialog state
  const [showStartQuote, setShowStartQuote] = useState(false);
  const [quotePrefillData, setQuotePrefillData] = useState(null);

  // Expense edit state
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(null);

  // Lead detail state
    const [selectedLead, setSelectedLead] = useState(null);

    // Reservation edit state
    const [showReservationEdit, setShowReservationEdit] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);

    // Consignment contract state
    const [showConsignmentContract, setShowConsignmentContract] = useState(false);

    // Document edit state
    const [editingDocument, setEditingDocument] = useState(null);
    const [editingDocumentIndex, setEditingDocumentIndex] = useState(null);

    // Price edit states
    const [showCostDialog, setShowCostDialog] = useState(false);
    const [showInfoAutoDialog, setShowInfoAutoDialog] = useState(false);
    const [showTargetDialog, setShowTargetDialog] = useState(false);
    const [showPublicDialog, setShowPublicDialog] = useState(false);

    // Inspection state
    const [showInspectionForm, setShowInspectionForm] = useState(false);
    const [showInspectionView, setShowInspectionView] = useState(false);
    const [showRequestInspection, setShowRequestInspection] = useState(false);
    const [showInspectionApproval, setShowInspectionApproval] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: updatedVehicle } = useQuery({
    queryKey: ['vehicle', vehicle.id],
    queryFn: () => base44.entities.Vehicle.list().then(vs => vs.find(v => v.id === vehicle.id)),
    initialData: vehicle,
  });

  const { data: leads = [] } = useQuery({ queryKey: ['vehicle-leads', updatedVehicle.id], queryFn: async () => { const all = await base44.entities.Lead.list('-consultation_date'); return all.filter(l => l.interested_vehicles?.some(v => v.vehicle_id === updatedVehicle.id)); } });
  const { data: sales = [] } = useQuery({ queryKey: ['vehicle-sales', updatedVehicle.id], queryFn: () => base44.entities.Sale.filter({ vehicle_id: updatedVehicle.id }, '-sale_date') });
  const { data: supplier } = useQuery({ queryKey: ['supplier', updatedVehicle.supplier_client_id], queryFn: () => base44.entities.Client.list().then(cs => cs.find(c => c.id === updatedVehicle.supplier_client_id)), enabled: !!updatedVehicle.supplier_client_id });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: reservations = [] } = useQuery({ queryKey: ['vehicle-reservations', updatedVehicle.id], queryFn: () => base44.entities.Reservation.filter({ vehicle_id: updatedVehicle.id }, '-reservation_date') });
  const { data: quotes = [] } = useQuery({ queryKey: ['vehicle-quotes', updatedVehicle.id], queryFn: () => base44.entities.Quote.filter({ vehicle_id: updatedVehicle.id }, '-quote_date') });

  // Get current blue rate
  const { data: rates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.list('-rate_date'),
  });
  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;
  
  // Fetch existing inspection
  const { data: existingInspection } = useQuery({
    queryKey: ['vehicle-inspection', updatedVehicle.id],
    queryFn: async () => {
      const inspections = await base44.entities.VehicleInspection.filter({ vehicle_id: updatedVehicle.id }, '-inspection_date');
      return inspections.length > 0 ? inspections[0] : null;
    },
    enabled: !!updatedVehicle.id,
  });
    
    const isConsignment = updatedVehicle.ownership === 'CONSIGNACIÓN' || updatedVehicle.is_consignment;
    
    // Check for existing consignment contract
    const { data: consignmentContract } = useQuery({
      queryKey: ['consignment-contract', updatedVehicle.id],
      queryFn: async () => {
        const contracts = await base44.entities.Document.filter({ 
          vehicle_id: updatedVehicle.id, 
          document_type: 'Contrato Consignación' 
        });
        return contracts.length > 0 ? contracts[0] : null;
      },
      enabled: !!updatedVehicle.id && isConsignment,
    });

  const [quoteToReserve, setQuoteToReserve] = useState(null);

  const createQuoteMutation = useMutation({
    mutationFn: (data) => {
      console.log('📋 Guardando presupuesto:', data);
      // Mapear 'date' a 'quote_date' y remover 'date' 
      const { date, ...restData } = data;
      const quoteData = { ...restData, quote_date: date };
      return data.id ? base44.entities.Quote.update(data.id, quoteData) : base44.entities.Quote.create(quoteData);
    },
    onSuccess: (result, variables) => {
      console.log('✅ Presupuesto guardado:', result);
      queryClient.invalidateQueries({ queryKey: ['vehicle-quotes'] });
      setShowQuotePrint({ ...variables, id: result?.id || variables.id });
      setShowQuoteForm(false);
      setEditingQuote(null);
      toast.success(variables.id ? "Presupuesto actualizado" : "Presupuesto guardado");
    },
    onError: (error) => {
      console.error('❌ Error guardando presupuesto:', error);
      toast.error("Error al guardar el presupuesto: " + error.message);
    }
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicle-quotes'] }); toast.success("Presupuesto eliminado"); },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📝 Creando reserva:', data);
      const res = await base44.entities.Reservation.create(data);
      console.log('✅ Reserva creada:', res);
      await base44.entities.Vehicle.update(updatedVehicle.id, { status: 'RESERVADO' });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      setShowReservationForm(false);
      toast.success("Reserva creada");
    },
    onError: (error) => {
      console.error('❌ Error creando reserva:', error);
      toast.error("Error al crear la reserva: " + error.message);
    }
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (reservationId) => {
      await base44.entities.Reservation.update(reservationId, { status: 'CANCELADA' });
      await base44.entities.Vehicle.update(updatedVehicle.id, { status: 'DISPONIBLE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      setShowReservationDetail(null);
      toast.success("Reserva cancelada");
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ expenses }) => {
      await base44.entities.Vehicle.update(updatedVehicle.id, { expenses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      toast.success("Gasto actualizado");
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: async (priceData) => {
      await base44.entities.Vehicle.update(updatedVehicle.id, priceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowCostDialog(false);
      toast.success("Costo y gastos actualizados");
    },
    onError: (error) => {
      toast.error("Error al actualizar costo: " + error.message);
    }
  });

  const updateInfoAutoMutation = useMutation({
    mutationFn: async (priceData) => {
      await base44.entities.Vehicle.update(updatedVehicle.id, priceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowInfoAutoDialog(false);
      toast.success("Precio InfoAuto actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar precio InfoAuto: " + error.message);
    }
  });

  const updateTargetMutation = useMutation({
    mutationFn: async (priceData) => {
      await base44.entities.Vehicle.update(updatedVehicle.id, priceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowTargetDialog(false);
      toast.success("Precio Objetivo actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar precio objetivo: " + error.message);
    }
  });

  const updatePublicMutation = useMutation({
    mutationFn: async (priceData) => {
      await base44.entities.Vehicle.update(updatedVehicle.id, priceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowPublicDialog(false);
      toast.success("Precio Público actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar precio público: " + error.message);
    }
  });

  const handleSaveExpense = (index, expenseData) => {
    const newExpenses = [...(updatedVehicle.expenses || [])];
    if (index !== null && index >= 0) {
      newExpenses[index] = expenseData;
    } else {
      newExpenses.push(expenseData);
    }
    updateExpenseMutation.mutate({ expenses: newExpenses });
  };

  const handleDeleteExpense = (index) => {
      const newExpenses = (updatedVehicle.expenses || []).filter((_, i) => i !== index);
      updateExpenseMutation.mutate({ expenses: newExpenses });
    };

    const handleSaveDocument = async (index, docData) => {
      const newDocs = [...(updatedVehicle.documents || [])];
      newDocs[index] = docData;
      await base44.entities.Vehicle.update(updatedVehicle.id, { documents: newDocs });
      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
      toast.success("Documento actualizado");
    };

  const photos = updatedVehicle.photos || [];
  const StatusIcon = STATUS_CONFIG[updatedVehicle.status]?.icon || CheckCircle;
  const activeReservation = reservations.find(r => r.status === 'VIGENTE');

  const valorTomaArs = convertValue(updatedVehicle.cost_value, updatedVehicle.cost_currency, updatedVehicle.cost_exchange_rate, 'ARS');
  const expensesArs = (updatedVehicle.expenses || []).reduce((sum, e) => sum + convertValue(e.value, e.currency, e.exchange_rate, 'ARS'), 0);
  const totalCostArs = valorTomaArs + expensesArs;

  if (selectedClient) return <ClientDetail client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={() => {}} />;
  if (selectedLead) return <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onEdit={() => {}} />;

  const btnClass = "h-8 text-[11px] px-3";

  try {
    return (
      <div className="p-3 md:p-4 bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onClose} className={btnClass}><ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Volver</Button>
          <div className="flex gap-2">
            {['DISPONIBLE', 'A INGRESAR', 'EN REPARACION', 'PAUSADO'].includes(updatedVehicle.status) && (
              <>
                <Button variant="outline" className={btnClass} onClick={() => setShowStartQuote(true)}><FileText className="w-3.5 h-3.5 mr-1.5" />Presupuesto</Button>
                <Button variant="outline" className={btnClass} onClick={() => setShowStartReservation(true)}><Receipt className="w-3.5 h-3.5 mr-1.5" />Reservar</Button>
                <Button className={`${btnClass} bg-cyan-600 hover:bg-cyan-700`} onClick={() => setShowStartSale(true)}><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Vender</Button>
              </>
            )}
            {updatedVehicle.status === 'RESERVADO' && (
              <>
                <Button variant="outline" className={btnClass} onClick={() => cancelReservationMutation.mutate(activeReservation?.id)}><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Reactivar</Button>
                <Button className={`${btnClass} bg-cyan-600 hover:bg-cyan-700`} onClick={() => setShowSaleForm(true)}><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Vender</Button>
              </>
            )}
            {(updatedVehicle.status === 'VENDIDO' || updatedVehicle.status === 'ENTREGADO') && (
                  <Button variant="outline" className={btnClass} onClick={async () => { 
                    if (window.confirm('¿Reactivar este vehículo? Volverá a estado DISPONIBLE.')) {
                      await base44.entities.Vehicle.update(updatedVehicle.id, { status: 'DISPONIBLE' });
                      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                      queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                      toast.success("Vehículo reactivado");
                    }
                  }}><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Reactivar</Button>
                )}
            {!['VENDIDO', 'RESERVADO', 'ENTREGADO'].includes(updatedVehicle.status) && (
              <Button onClick={() => onEdit(updatedVehicle)} className={`${btnClass} bg-gray-900 hover:bg-gray-800`}><Edit className="w-3.5 h-3.5 mr-1.5" />Editar</Button>
            )}
            {(updatedVehicle.status === 'VENDIDO' || updatedVehicle.status === 'ENTREGADO') && (
              <Button onClick={() => onEdit(updatedVehicle)} variant="outline" className={btnClass}><Edit className="w-3.5 h-3.5 mr-1.5" />Editar Vehículo</Button>
            )}
            {onDelete && !['VENDIDO', 'ENTREGADO'].includes(updatedVehicle.status) && <Button variant="outline" className={`${btnClass} border-red-300 text-red-600`} onClick={() => { if (window.confirm('¿Eliminar?')) onDelete(updatedVehicle.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
          </div>
        </div>

        {/* Dialogs */}
        <StartQuoteDialog
          open={showStartQuote}
          onOpenChange={setShowStartQuote}
          vehicle={updatedVehicle}
          onStartQuote={(data) => {
            setQuotePrefillData(data);
            setShowStartQuote(false);
            setShowQuoteForm(true);
          }}
        />
        <QuoteForm open={showQuoteForm} onOpenChange={setShowQuoteForm} vehicle={quotePrefillData?.vehicle || updatedVehicle} lead={quotePrefillData?.lead} editingQuote={editingQuote} onSubmit={(data) => createQuoteMutation.mutate(data)} />
        <QuotePrintView 
          open={!!showQuotePrint} 
          onOpenChange={() => setShowQuotePrint(null)} 
          quote={showQuotePrint} 
          vehicle={updatedVehicle} 
          client={clients.find(c => c.id === showQuotePrint?.client_id)} 
          onReserve={() => { setQuoteToReserve(showQuotePrint); setShowQuotePrint(null); setShowReservationForm(true); }}
          onStartSale={() => {
            setSalePrefillData({
              vehicle: updatedVehicle,
              quote: showQuotePrint,
              client_id: showQuotePrint.client_id,
              client_name: showQuotePrint.client_name,
              sale_price_ars: showQuotePrint.quoted_price_ars,
              trade_in: showQuotePrint.trade_in,
              financing_amount_ars: showQuotePrint.financing_amount,
              financing_bank: showQuotePrint.financing_bank,
              financing_installments: showQuotePrint.financing_installments,
              financing_installment_value: showQuotePrint.financing_installment_value
            });
            setShowQuotePrint(null);
            setShowSaleForm(true);
          }}
          onEdit={(q) => { setEditingQuote(q); setShowQuotePrint(null); setShowQuoteForm(true); }}
        />

        <ReservationForm open={showReservationForm} onOpenChange={(open) => { setShowReservationForm(open); if (!open) { setQuoteToReserve(null); setReservationPrefillData(null); } }} vehicle={updatedVehicle} quote={quoteToReserve || reservationPrefillData?.quote} lead={reservationPrefillData?.lead} onSubmit={(data) => createReservationMutation.mutate(data)} />
        {showReservationDetail && <ReservationDetail open={!!showReservationDetail} onOpenChange={() => setShowReservationDetail(null)} reservation={showReservationDetail} vehicle={updatedVehicle} onCancel={() => cancelReservationMutation.mutate(showReservationDetail.id)} onConvertToSale={() => { setShowReservationDetail(null); setShowSaleForm(true); }} />}
        <ReservationEditForm open={showReservationEdit} onOpenChange={(o) => { setShowReservationEdit(o); if (!o) setEditingReservation(null); }} reservation={editingReservation} vehicle={updatedVehicle} />
        <StartSaleDialog 
          open={showStartSale} 
          onOpenChange={setShowStartSale} 
          vehicle={updatedVehicle} 
          onStartSale={(data) => { setSalePrefillData(data); setShowStartSale(false); setShowSaleForm(true); }}
        />
        <StartReservationDialog
          open={showStartReservation}
          onOpenChange={setShowStartReservation}
          vehicle={updatedVehicle}
          onStartReservation={(data) => { setReservationPrefillData(data); setShowStartReservation(false); setShowReservationForm(true); }}
        />
        <SaleFormDialog 
          open={showSaleForm} 
          onOpenChange={(o) => { setShowSaleForm(o); if (!o) { setSalePrefillData(null); setEditingSale(null); } }} 
          vehicle={salePrefillData?.vehicle || updatedVehicle} 
          reservation={activeReservation} 
          prefillData={salePrefillData}
          existingSale={editingSale}
        />
        {showContractView && (
          <SalesContractView 
            open={!!showContractView} 
            onOpenChange={() => setShowContractView(null)} 
            sale={showContractView} 
            vehicle={updatedVehicle} 
            client={clients.find(c => c.id === showContractView.client_id)}
          />
        )}
        {showSaleDetail && <SaleDetail sale={showSaleDetail} onClose={() => setShowSaleDetail(null)} />}
        <ExpenseEditDialog
          open={editingExpense !== null}
          onOpenChange={(open) => { if (!open) { setEditingExpense(null); setEditingExpenseIndex(null); } }}
          expense={editingExpense}
          index={editingExpenseIndex}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          currentBlueRate={currentBlueRate}
        />
        <ConsignmentContractView
          open={showConsignmentContract}
          onOpenChange={setShowConsignmentContract}
          vehicle={updatedVehicle}
          client={supplier}
        />
        <DocumentEditDialog
          open={editingDocument !== null}
          onOpenChange={(open) => { if (!open) { setEditingDocument(null); setEditingDocumentIndex(null); } }}
          document={editingDocument}
          index={editingDocumentIndex}
          onSave={handleSaveDocument}
        />
        <InspectionForm
          open={showInspectionForm}
          onOpenChange={(open) => { setShowInspectionForm(open); if (!open) queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', updatedVehicle.id] }); }}
          vehicle={updatedVehicle}
          existingInspection={existingInspection}
        />
        <InspectionView
          open={showInspectionView}
          onOpenChange={setShowInspectionView}
          inspection={existingInspection}
          vehicle={updatedVehicle}
          onEdit={() => { setShowInspectionView(false); setShowInspectionForm(true); }}
          onDelete={() => { 
            queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', updatedVehicle.id] }); 
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            setShowInspectionView(false);
          }}
        />
        <RequestInspectionDialog
          open={showRequestInspection}
          onOpenChange={setShowRequestInspection}
          vehicle={updatedVehicle}
        />
        <InspectionApprovalDialog
          open={showInspectionApproval}
          onOpenChange={(o) => { setShowInspectionApproval(o); if (!o) queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', updatedVehicle.id] }); }}
          inspection={existingInspection}
          vehicle={updatedVehicle}
        />

        {/* Photo Gallery */}
        <Dialog open={showPhotoGallery} onOpenChange={setShowPhotoGallery}>
          <DialogContent className="max-w-3xl">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-sm">Fotos ({photos.length})</DialogTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px]"
                  onClick={async () => {
                    const urls = photos.map(p => p.url).join('\n');
                    const shareText = `Fotos de ${updatedVehicle.brand} ${updatedVehicle.model} ${updatedVehicle.year}:\n${urls}`;
                    try {
                      await navigator.clipboard.writeText(shareText);
                      toast.success("URLs copiadas al portapapeles");
                    } catch {
                      toast.error("No se pudo copiar");
                    }
                  }}
                >
                  <Share2 className="w-3 h-3 mr-1" />Copiar URLs
                </Button>
              </div>
            </DialogHeader>
            {photos.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <img src={photos[currentPhotoIndex].url} alt="" className="w-full h-80 object-contain bg-gray-100 rounded" />
                  {photos.length > 1 && (
                    <>
                      <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setCurrentPhotoIndex(p => p === 0 ? photos.length - 1 : p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                      <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setCurrentPhotoIndex(p => p === photos.length - 1 ? 0 : p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Foto {currentPhotoIndex + 1} de {photos.length}</span>
                  <div className="flex gap-2">
                    <a href={photos[currentPhotoIndex].url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-[10px]"><Download className="w-3 h-3 mr-1" />Descargar</Button>
                    </a>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] text-red-500 border-red-300"
                      onClick={async () => {
                        if (window.confirm('¿Eliminar esta foto?')) {
                          const newPhotos = photos.filter((_, i) => i !== currentPhotoIndex);
                          await base44.entities.Vehicle.update(updatedVehicle.id, { photos: newPhotos });
                          queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                          if (currentPhotoIndex >= newPhotos.length) setCurrentPhotoIndex(Math.max(0, newPhotos.length - 1));
                          if (newPhotos.length === 0) setShowPhotoGallery(false);
                          toast.success("Foto eliminada");
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />Eliminar
                    </Button>
                  </div>
                </div>
                {/* Thumbnails */}
                <div className="grid grid-cols-8 gap-1.5">
                  {photos.map((p, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square cursor-pointer rounded overflow-hidden border-2 ${i === currentPhotoIndex ? 'border-cyan-500' : 'border-transparent'}`}
                      onClick={() => setCurrentPhotoIndex(i)}
                    >
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Price Edit Dialogs */}
        <CostPriceDialog
          open={showCostDialog}
          onOpenChange={setShowCostDialog}
          vehicle={updatedVehicle}
          onSubmit={updateCostMutation.mutate}
          isLoading={updateCostMutation.isPending}
          onEditExpense={(expense, index) => {
            setEditingExpense(expense);
            setEditingExpenseIndex(index);
          }}
        />
        <InfoAutoPriceDialog
          open={showInfoAutoDialog}
          onOpenChange={setShowInfoAutoDialog}
          vehicle={updatedVehicle}
          onSubmit={async (data) => {
            try {
              await updateInfoAutoMutation.mutateAsync(data);
            } catch (error) {
              console.error('Error saving InfoAuto:', error);
            }
          }}
          isLoading={updateInfoAutoMutation.isPending}
        />
        <TargetPriceDialog
          open={showTargetDialog}
          onOpenChange={setShowTargetDialog}
          vehicle={updatedVehicle}
          onSubmit={updateTargetMutation.mutate}
          isLoading={updateTargetMutation.isPending}
        />
        <PublicPriceDialog
          open={showPublicDialog}
          onOpenChange={setShowPublicDialog}
          vehicle={updatedVehicle}
          onSubmit={updatePublicMutation.mutate}
          isLoading={updatePublicMutation.isPending}
        />

        {/* Main Info */}
        <Card className="shadow-sm">
          <CardHeader className="border-b p-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold uppercase">{updatedVehicle.brand} {updatedVehicle.model} {updatedVehicle.year}</h1>
                <p className="text-sm font-semibold text-gray-500 mt-0.5 uppercase">{updatedVehicle.plate}</p>
              </div>
              <div className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`${STATUS_CONFIG[updatedVehicle.status]?.bg} text-[12px] px-3 py-1.5 flex items-center gap-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity border-0 font-medium`}>
                          <StatusIcon className="w-4 h-4" />
                          {updatedVehicle.status}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {['A PERITAR', 'A INGRESAR', 'EN REPARACION', 'DISPONIBLE', 'PAUSADO', 'RESERVADO', 'VENDIDO', 'ENTREGADO', 'DESCARTADO'].map(status => (
                          <DropdownMenuItem 
                            key={status} 
                            className="text-[11px] cursor-pointer"
                            onClick={async () => {
                              const previousStatus = updatedVehicle.status;
                              
                              // Actualizar INSTANTÁNEAMENTE en la query cache
                              queryClient.setQueryData(['vehicle', updatedVehicle.id], (old) => 
                                old ? { ...old, status } : old
                              );
                              queryClient.setQueryData(['vehicles'], (old) =>
                                old?.map((v) => (v.id === updatedVehicle.id ? { ...v, status } : v))
                              );
                              
                              toast.success(`Estado cambiado a ${status}`);
                              
                              // Luego guardar en el servidor
                              try {
                                await base44.entities.Vehicle.update(updatedVehicle.id, { status });
                                // Refrescar después de 500ms
                                setTimeout(() => {
                                  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                                }, 500);
                              } catch (error) {
                                // Revertir si falla
                                queryClient.setQueryData(['vehicle', updatedVehicle.id], (old) => 
                                  old ? { ...old, status: previousStatus } : old
                                );
                                queryClient.setQueryData(['vehicles'], (old) =>
                                  old?.map((v) => (v.id === updatedVehicle.id ? { ...v, status: previousStatus } : v))
                                );
                                toast.error("Error al cambiar estado");
                              }
                            }}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${STATUS_CONFIG[status]?.bg?.split(' ')[0] || 'bg-gray-200'}`} />
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isConsignment && <div className="mt-1.5 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[10px] font-semibold rounded inline-block">En consignación</div>}
                  </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex gap-3">
              {/* Photos Section - Left */}
              {photos.length > 0 && (
                <div className="w-40 flex-shrink-0">
                  <div 
                    className="w-40 h-40 rounded-lg overflow-hidden cursor-pointer group relative"
                    onClick={() => { setCurrentPhotoIndex(0); setShowPhotoGallery(true); }}
                  >
                    <img src={photos[0].url} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                      {photos.length}
                    </div>
                  </div>
                  {photos.length > 1 && (
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {photos.slice(1, 4).map((p, i) => (
                        <div 
                          key={i} 
                          className="aspect-square rounded overflow-hidden cursor-pointer hover:opacity-80 relative"
                          onClick={() => { setCurrentPhotoIndex(i + 1); setShowPhotoGallery(true); }}
                        >
                          <img src={p.url} alt="" className="w-full h-full object-cover" />
                          {i === 2 && photos.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[9px] font-semibold">
                              +{photos.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Data Section */}
              <div className="flex-1 grid grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-400 text-[9px] font-medium">KM</p>
                  <p className="font-semibold">{updatedVehicle.kilometers?.toLocaleString('es-AR') || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-400 text-[9px] font-medium">COLOR</p>
                  <p className="font-semibold uppercase">{updatedVehicle.color || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-400 text-[9px] font-medium">F. INGRESO</p>
                  <p className="font-semibold">{updatedVehicle.entry_date ? format(new Date(updatedVehicle.entry_date), 'dd/MM/yy') : '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-gray-400 text-[9px] font-medium">PROPIEDAD</p>
                  {isConsignment ? (
                    <span className="px-1 py-0.5 bg-cyan-100 text-cyan-700 text-[9px] rounded font-semibold">CONSIG.</span>
                  ) : (
                    <p className="font-semibold uppercase text-[10px]">{updatedVehicle.ownership || '-'}</p>
                  )}
                </div>
                
                {/* Technical Data - spans 4 cols */}
                <div className="col-span-4 p-2 bg-gray-50 rounded">
                  <p className="text-[9px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><Wrench className="w-3 h-3" />DATOS TÉCNICOS</p>
                  <div className="grid grid-cols-4 gap-3 text-[10px]">
                    <div><span className="text-gray-400 block text-[9px]">Marca Motor</span><span className="font-medium">{updatedVehicle.engine_brand || '-'}</span></div>
                    <div><span className="text-gray-400 block text-[9px]">N° Motor</span><span className="font-medium">{updatedVehicle.engine_number || '-'}</span></div>
                    <div><span className="text-gray-400 block text-[9px]">Marca Chasis</span><span className="font-medium">{updatedVehicle.chassis_brand || '-'}</span></div>
                    <div><span className="text-gray-400 block text-[9px]">N° Chasis</span><span className="font-medium">{updatedVehicle.chassis_number || '-'}</span></div>
                  </div>
                </div>
                
                {/* Radicación - spans 4 cols */}
                <div className="col-span-4 p-2 bg-gray-50 rounded flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-semibold text-gray-400">RADICACIÓN</span>
                  </div>
                  <p className="text-[10px] font-medium">{[updatedVehicle.registration_city, updatedVehicle.registration_province].filter(Boolean).join(', ') || '-'}</p>
                </div>

                {/* Supplier - spans all 4 cols */}
                <div className="col-span-4 p-2 bg-gray-50 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="text-[9px] text-gray-400 font-medium">PROVEEDOR</p>
                      {supplier ? (
                        <p className="font-semibold text-[11px] cursor-pointer hover:text-cyan-600" onClick={() => setSelectedClient(supplier)}>{supplier.full_name}</p>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">Sin proveedor</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                        {isConsignment && supplier && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 px-2 text-[9px] bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                            onClick={() => setShowConsignmentContract(true)}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {consignmentContract ? 'Ver contrato de consignación' : 'Crear contrato de consignación'}
                          </Button>
                        )}
                        {updatedVehicle.is_supplier_owner && <span className="px-1.5 py-0.5 bg-gray-700 text-white text-[8px] font-semibold rounded">TITULAR</span>}
                        {supplier ? (
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEdit(updatedVehicle)}><Edit className="w-2.5 h-2.5 text-gray-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={async () => { 
                          if (window.confirm('¿Quitar proveedor?')) {
                            await base44.entities.Vehicle.update(updatedVehicle.id, { supplier_client_id: null, supplier_client_name: null, is_supplier_owner: false });
                            queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                            toast.success("Proveedor eliminado");
                          }
                        }}><Trash2 className="w-2.5 h-2.5 text-gray-400 hover:text-red-500" /></Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="h-5 text-[8px] px-1.5" onClick={() => onEdit(updatedVehicle)}>
                        <Plus className="w-2.5 h-2.5 mr-0.5" />Agregar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            {(updatedVehicle.folder_url || updatedVehicle.file_url) && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {updatedVehicle.folder_url && <a href={updatedVehicle.folder_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="h-7 text-[10px]"><ExternalLink className="w-3 h-3 mr-1" />Carpeta</Button></a>}
                {updatedVehicle.file_url && <a href={updatedVehicle.file_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="h-7 text-[10px]"><FileText className="w-3 h-3 mr-1" />Ficha</Button></a>}
              </div>
            )}
            </CardContent>
            </Card>

            {/* Active Reservation */}
        {activeReservation && (
          <Card className="shadow-sm bg-gray-900 text-white">
            <CardHeader className="border-b border-gray-700 p-4">
              <h3 className="text-[12px] font-semibold flex items-center gap-2"><Receipt className="w-4 h-4" />Reserva Vigente</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{activeReservation.client_name}</p>
                  <p className="text-[11px] text-gray-400">
                    {activeReservation.deposit_amount > 0 && `Seña: $${activeReservation.deposit_amount?.toLocaleString('es-AR')} • `}
                    {format(new Date(activeReservation.reservation_date), 'dd/MM/yy')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-[11px] bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={() => setShowReservationDetail(activeReservation)}>
                    <Eye className="w-3.5 h-3.5 mr-1" />Ver
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[11px] bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={() => { setEditingReservation(activeReservation); setShowReservationEdit(true); }}>
                    <Edit className="w-3.5 h-3.5 mr-1" />Editar
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[11px] bg-transparent border-red-400 text-red-400 hover:bg-red-900" onClick={() => cancelReservationMutation.mutate(activeReservation.id)}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowSaleForm(true)}>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />Vender
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sale Card - Vendido or Entregado */}
        {(updatedVehicle.status === 'VENDIDO' || updatedVehicle.status === 'ENTREGADO') && sales.length > 0 && (() => {
          const activeSale = sales.find(s => s.sale_status === 'PENDIENTE') || sales.find(s => s.sale_status === 'FINALIZADA');
          if (!activeSale) return null;
          const isEntregado = activeSale.sale_status === 'FINALIZADA' || updatedVehicle.status === 'ENTREGADO';
          return (
            <Card className={`shadow-sm ${isEntregado ? 'bg-red-700' : 'bg-gray-900'} text-white`}>
              <CardHeader className={`border-b ${isEntregado ? 'border-red-600' : 'border-gray-700'} p-4`}>
                <h3 className="text-[12px] font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {isEntregado ? 'Vehículo Entregado' : 'Vendido'}
                </h3>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{activeSale.client_name}</p>
                    <p className="text-[11px] text-gray-300">
                      ${(activeSale.sale_price || activeSale.sale_price_ars)?.toLocaleString('es-AR')} • 
                      {activeSale.sale_date && format(new Date(activeSale.sale_date), ' dd/MM/yy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className={`h-8 text-[11px] bg-transparent ${isEntregado ? 'border-red-400' : 'border-gray-600'} text-white hover:bg-gray-800`} onClick={() => setShowContractView(activeSale)}>
                      Ver Boleto
                    </Button>
                    <Button size="sm" variant="outline" className={`h-8 text-[11px] bg-transparent ${isEntregado ? 'border-red-400' : 'border-gray-600'} text-white hover:bg-gray-800`} onClick={() => setShowSaleDetail(activeSale)}>
                      Ver venta
                    </Button>
                    {!isEntregado && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-[11px] bg-transparent border-red-400 text-red-400 hover:bg-red-900" onClick={async () => {
                            if (window.confirm('¿Cancelar esta venta? El vehículo volverá a estado DISPONIBLE.')) {
                              await base44.entities.Sale.update(activeSale.id, { sale_status: 'CANCELADA' });
                              await base44.entities.Vehicle.update(updatedVehicle.id, { status: 'DISPONIBLE' });
                              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                              queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
                              queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                              toast.success("Venta cancelada");
                            }
                          }}>
                            Cancelar
                        </Button>
                        <Button size="sm" className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700" onClick={async () => {
                            if (window.confirm('¿Marcar como entregado? Esto indica que el vehículo ya fue entregado al cliente.')) {
                              await base44.entities.Sale.update(activeSale.id, { sale_status: 'FINALIZADA' });
                              await base44.entities.Vehicle.update(updatedVehicle.id, { status: 'ENTREGADO' });
                              if (activeSale.trade_ins?.length > 0) {
                                for (const ti of activeSale.trade_ins) {
                                  if (ti.brand && ti.model) {
                                    await base44.entities.Vehicle.create({
                                      brand: ti.brand, model: ti.model, year: parseInt(ti.year) || new Date().getFullYear(),
                                      plate: ti.plate, kilometers: parseFloat(ti.kilometers) || 0,
                                      status: ti.is_peritado ? 'A INGRESAR' : 'A PERITAR', supplier_client_id: activeSale.client_id, supplier_client_name: activeSale.client_name
                                    });
                                  }
                                }
                              }
                              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                              queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
                              queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                              toast.success("Vehículo marcado como entregado");
                            }
                          }}>
                            Marcar Entregado
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Costs */}
        <Card className="shadow-sm">
          <CardHeader className="border-b p-4">
            <h3 className="text-[12px] font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" />Valores</h3>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const [expensesExpanded, setExpensesExpanded] = React.useState(false);
              const currentRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

              // Calculate USD values using their original rates
              const valorTomaUsd = updatedVehicle.cost_currency === 'USD' 
                ? updatedVehicle.cost_value 
                : (updatedVehicle.cost_exchange_rate ? updatedVehicle.cost_value / updatedVehicle.cost_exchange_rate : updatedVehicle.cost_value / currentRate);

              const expensesUsd = (updatedVehicle.expenses || []).reduce((sum, e) => {
                if (e.currency === 'USD') return sum + (e.value || 0);
                const rate = e.exchange_rate || currentRate;
                return sum + ((e.value || 0) / rate);
              }, 0);

              const totalCostUsd = valorTomaUsd + expensesUsd;
              const totalCostArsCalc = valorTomaArs + expensesArs;

              const formatValDual = (ars, usdOverride) => {
                if (!ars && !usdOverride) return { ars: '-', usd: '' };
                return {
                  ars: ars ? `$${ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '-',
                  usd: usdOverride !== undefined ? `U$D ${usdOverride.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : (ars ? `U$D ${(ars / currentRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '')
                };
              };

              const targetArs = convertValue(updatedVehicle.target_price_value, updatedVehicle.target_price_currency, updatedVehicle.target_price_exchange_rate, 'ARS');
              const publicArs = convertValue(updatedVehicle.public_price_value, updatedVehicle.public_price_currency, updatedVehicle.public_price_exchange_rate, 'ARS');
              const infoautoArs = convertValue(updatedVehicle.infoauto_value, updatedVehicle.infoauto_currency, updatedVehicle.infoauto_exchange_rate, 'ARS');

              return (
                <>
                  <div className="grid grid-cols-4 gap-3 text-[11px]">
                    <div className="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setShowCostDialog(true)}>
                      <p className="text-gray-500">Costo Total</p>
                      <p className="font-bold text-base">{formatValDual(totalCostArsCalc).ars}</p>
                      {totalCostArsCalc > 0 && <p className="text-[11px] font-semibold text-cyan-500">U$D {totalCostUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowInfoAutoDialog(true)}>
                      <p className="text-gray-500">InfoAuto</p>
                      <p className="font-bold text-base">{formatValDual(infoautoArs).ars}</p>
                      {infoautoArs > 0 && <p className="text-[11px] font-semibold text-cyan-500">{formatValDual(infoautoArs).usd}</p>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowTargetDialog(true)}>
                      <p className="text-gray-500">Objetivo</p>
                      <p className="font-bold text-base">{formatValDual(targetArs).ars}</p>
                      {targetArs > 0 && <p className="text-[11px] font-semibold text-cyan-500">{formatValDual(targetArs).usd}</p>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowPublicDialog(true)}>
                      <p className="text-gray-500">Público</p>
                      <p className="font-bold text-base">{formatValDual(publicArs).ars}</p>
                      {publicArs > 0 && <p className="text-[11px] font-semibold text-cyan-500">{formatValDual(publicArs).usd}</p>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <button 
                        onClick={() => setExpensesExpanded(!expensesExpanded)}
                        className="flex items-center gap-2 hover:text-cyan-600 transition-colors"
                      >
                        <span className="text-[13px] font-bold text-gray-800">Gastos</span>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expensesExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-3" onClick={() => { setEditingExpense({}); setEditingExpenseIndex(-1); }}>+ Agregar</Button>
                    </div>
                    {expensesExpanded && <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-100 rounded">
                        <span className="text-[12px] text-gray-600">Valor de toma</span>
                        <div className="text-right">
                          <span className="font-bold text-[14px] text-gray-900 block">{formatValDual(valorTomaArs).ars}</span>
                          {valorTomaArs > 0 && <span className="text-[10px] font-semibold text-cyan-500">U$D {valorTomaUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>}
                        </div>
                      </div>
                      {(updatedVehicle.expenses || []).map((exp, i) => {
                        const expArs = convertValue(exp.value, exp.currency, exp.exchange_rate, 'ARS');
                        const expUsd = exp.currency === 'USD' ? exp.value : (exp.exchange_rate ? exp.value / exp.exchange_rate : exp.value / currentRate);
                        return (
                          <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded group hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700 text-[11px]">{exp.type}</span>
                              {exp.description && <span className="text-gray-400 text-[10px]">{exp.description}</span>}
                            </div>
                            <div className="flex items-center">
                              <div className="text-right">
                                <span className="font-semibold text-[12px] block">{formatValDual(expArs).ars}</span>
                                {expArs > 0 && <span className="text-[10px] font-semibold text-cyan-500">U$D {expUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>}
                              </div>
                              <div className="flex gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingExpense(exp); setEditingExpenseIndex(i); }}><Edit className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteExpense(i)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {expensesArs > 0 && (
                        <div className="flex justify-between items-center font-bold pt-3 mt-2 border-t">
                          <span className="text-gray-800 text-[13px]">Total gastos</span>
                          <div className="text-right">
                            <span className="text-[14px] block">{formatValDual(expensesArs).ars}</span>
                            <span className="text-[10px] font-semibold text-cyan-500">U$D {expensesUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      )}
                    </div>}
                  </div>
              </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Quotes */}
        {quotes.length > 0 && (() => {
          const currentRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;
          return (
            <Card className="shadow-sm">
              <CardHeader className="border-b p-4"><h3 className="text-[12px] font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />Presupuestos ({quotes.length})</h3></CardHeader>
              <CardContent className="p-3 space-y-1.5">
                {quotes.map(q => {
                  const quoteRate = q.quoted_price_exchange_rate || currentRate;
                  const priceArs = q.quoted_price_ars || 0;
                  const usdAtQuote = priceArs / quoteRate;
                  const usdToday = priceArs / currentRate;
                  return (
                    <div 
                      key={q.id} 
                      className="p-3 bg-gray-50 rounded flex justify-between items-start hover:bg-gray-100 cursor-pointer"
                      onClick={() => setShowQuotePrint(q)}
                    >
                      <div className="text-[11px]"><p className="font-medium">{q.client_name}</p><p className="text-gray-500">{format(new Date(q.quote_date), 'dd/MM/yy')}</p></div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <p className="font-bold text-[12px]">${priceArs.toLocaleString('es-AR')}</p>
                          <p className="text-[10px] font-semibold text-gray-500">ERAN: U$D {usdAtQuote.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                                  <p className="text-[10px] font-semibold text-cyan-500">HOY SON: U$D {usdToday.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar?')) deleteQuoteMutation.mutate(q.id); }}><Trash2 className="w-3.5 h-3.5 text-gray-500" /></Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })()}



        {/* Estado, Documentación y Accesorios */}
        <Card className="shadow-sm">
          <CardHeader className="border-b p-4">
            <h3 className="text-[12px] font-semibold flex items-center gap-2"><Wrench className="w-4 h-4" />Estado, Documentación y Accesorios</h3>
          </CardHeader>
            <CardContent className="p-4">
              {/* Peritaje Section */}
              <div className={`mb-4 p-3 rounded-lg border ${
                existingInspection?.status === 'Pendiente aprobación' ? 'bg-blue-50 border-blue-300' :
                updatedVehicle.inspection_decision_pending ? 'bg-amber-50 border-amber-300' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-500" />
                    <span className="text-[11px] font-semibold text-gray-700">PERITAJE</span>
                    {existingInspection ? (
                      <>
                        {existingInspection.status === 'Borrador' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">En proceso</span>
                        )}
                        {existingInspection.status === 'Pendiente aprobación' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Pendiente aprobación</span>
                        )}
                        {existingInspection.status === 'Revisión solicitada' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">En revisión</span>
                        )}
                        {existingInspection.status === 'Edición solicitada' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Edición solicitada</span>
                        )}
                        {(existingInspection.status === 'Aprobado' || existingInspection.status === 'Edición aprobada') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Realizado</span>
                        )}
                      </>
                    ) : updatedVehicle.assigned_mechanic_name ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">
                        Solicitado a: {updatedVehicle.assigned_mechanic_name}
                      </span>
                    ) : null}
                    {updatedVehicle.inspection_decision_pending && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                        ⚠️ Decisión pendiente
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {!existingInspection && !updatedVehicle.assigned_mechanic_name && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] px-2"
                        onClick={() => setShowRequestInspection(true)}
                      >
                        <Send className="w-3 h-3 mr-1" />Solicitar
                      </Button>
                    )}
                    {!existingInspection && updatedVehicle.assigned_mechanic_name && (
                      <>
                        <Badge className="bg-cyan-100 text-cyan-700 text-[9px] px-2 py-1">
                          <Clock className="w-3 h-3 mr-1" />Esperando al mecánico
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-[10px] px-2 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (window.confirm('¿Cancelar la solicitud de peritaje?')) {
                              await base44.entities.Vehicle.update(updatedVehicle.id, { 
                                assigned_mechanic_id: null, 
                                assigned_mechanic_name: null,
                                inspection_requested_by: null,
                                inspection_requested_date: null,
                                status: 'A INGRESAR'
                              });
                              queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                              queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                              queryClient.invalidateQueries({ queryKey: ['vehicles-to-inspect'] });
                              toast.success("Solicitud de peritaje cancelada");
                            }
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />Cancelar solicitud
                        </Button>
                      </>
                    )}
                    {existingInspection && (
                      <>
                        {existingInspection.status === 'Pendiente aprobación' ? (
                          <Button 
                            size="sm" 
                            className="h-7 text-[10px] px-2 bg-green-600 hover:bg-green-700"
                            onClick={() => setShowInspectionApproval(true)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />Responder
                          </Button>
                        ) : existingInspection.status === 'Revisión solicitada' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px] px-2"
                              onClick={() => setShowInspectionView(true)}
                            >
                              <Eye className="w-3 h-3 mr-1" />Ver
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-[10px] px-2 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                if (window.confirm('¿Cancelar la solicitud de revisión?')) {
                                  await base44.entities.VehicleInspection.update(existingInspection.id, { status: 'Aprobado', revision_notes: '' });
                                  queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', updatedVehicle.id] });
                                  queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
                                  toast.success("Solicitud de revisión cancelada");
                                }
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />Cancelar revisión
                            </Button>
                          </>
                        ) : existingInspection.status === 'Edición solicitada' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px] px-2"
                              onClick={() => setShowInspectionView(true)}
                            >
                              <Eye className="w-3 h-3 mr-1" />Ver
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] px-2 bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                await base44.entities.VehicleInspection.update(existingInspection.id, { status: 'Edición aprobada' });
                                queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', updatedVehicle.id] });
                                queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
                                toast.success("Edición aprobada");
                              }}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />Aprobar edición
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] px-2"
                            onClick={() => setShowInspectionView(true)}
                          >
                            <Eye className="w-3 h-3 mr-1" />Ver
                          </Button>
                        )}
                        {updatedVehicle.inspection_decision_pending && (
                          <Button 
                            size="sm" 
                            className="h-7 text-[10px] px-2 bg-amber-600 hover:bg-amber-700"
                            onClick={() => setShowInspectionApproval(true)}
                          >
                            <Clock className="w-3 h-3 mr-1" />Tomar decisión
                          </Button>
                        )}
                      </>
                    )}
                    {!existingInspection && !updatedVehicle.assigned_mechanic_name && (
                      <Button 
                        size="sm" 
                        className="h-7 text-[10px] px-2 bg-cyan-600 hover:bg-cyan-700"
                        onClick={() => setShowInspectionForm(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" />Agregar
                      </Button>
                    )}
                  </div>
                </div>
                {existingInspection && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                    <div className="flex justify-between">
                      <span>Fecha: {existingInspection.inspection_date ? format(new Date(existingInspection.inspection_date), 'dd/MM/yy') : '-'}</span>
                      <span>Inspector: {existingInspection.inspector_name || '-'}</span>
                      <span>Costo estimado: ${(existingInspection.total_estimated_cost || 0).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Documentos</p>
                  <div className="space-y-1">
                    {[
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
                    ].map(item => {
                      const hasIt = updatedVehicle.documentation_checklist?.documents?.[item.key];
                      return (
                        <div key={item.key} className="flex items-center gap-2 text-[11px]">
                          {hasIt ? <Check className="w-3.5 h-3.5 text-cyan-500" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                          <span className={hasIt ? 'font-medium text-gray-700' : 'text-gray-400'}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Accesorios</p>
                  <div className="space-y-1">
                    {[
                      { key: 'manuals', label: 'Manuales' },
                      { key: 'spare_key', label: 'Duplicado llave' },
                      { key: 'spare_tire', label: 'Auxilio' },
                      { key: 'jack', label: 'Criquet' },
                      { key: 'security_nut', label: 'Tuerca seguridad' },
                      { key: 'fire_extinguisher', label: 'Matafuego' },
                    ].map(item => {
                      const hasIt = updatedVehicle.documentation_checklist?.accessories?.[item.key];
                      return (
                        <div key={item.key} className="flex items-center gap-2 text-[11px]">
                          {hasIt ? <Check className="w-3.5 h-3.5 text-cyan-500" /> : <X className="w-3.5 h-3.5 text-gray-300" />}
                          <span className={hasIt ? 'font-medium text-gray-700' : 'text-gray-400'}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Documentos Adjuntos */}
              {updatedVehicle.documents?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Documentos Adjuntos ({updatedVehicle.documents.length})</p>
                  <div className="space-y-1.5">
                    {updatedVehicle.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 group">
                        <div 
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                          onClick={() => { setEditingDocument(doc); setEditingDocumentIndex(i); }}
                        >
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-[11px] font-medium text-gray-700 truncate">{doc.name || `Documento ${i + 1}`}</span>
                          {doc.date && <span className="text-[9px] text-gray-400">{doc.date}</span>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="w-3 h-3 text-gray-500" /></Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              const text = encodeURIComponent(`${doc.name || 'Documento'}: ${doc.url}`);
                              window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}
                          >
                            <MessageCircle className="w-3 h-3 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              const subject = encodeURIComponent(doc.name || 'Documento');
                              const body = encodeURIComponent(`Te comparto el siguiente documento:\n\n${doc.url}`);
                              window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                            }}
                          >
                            <Mail className="w-3 h-3 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => { setEditingDocument(doc); setEditingDocumentIndex(i); }}
                          >
                            <Edit className="w-3 h-3 text-gray-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={async () => {
                              if (window.confirm('¿Eliminar este documento?')) {
                                const newDocs = updatedVehicle.documents.filter((_, idx) => idx !== i);
                                await base44.entities.Vehicle.update(updatedVehicle.id, { documents: newDocs });
                                queryClient.invalidateQueries({ queryKey: ['vehicle', updatedVehicle.id] });
                                toast.success("Documento eliminado");
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
        </Card>

        {/* Leads */}
        {leads.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="border-b p-4"><h3 className="text-[12px] font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Interesados ({leads.length})</h3></CardHeader>
            <CardContent className="p-3 space-y-1.5">
              {leads.slice(0, 3).map(l => (
                <div 
                  key={l.id} 
                  className="p-3 bg-gray-50 rounded text-[11px] hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/crm/${l.id}`)}
                >
                  <p className="font-medium">{l.client_name}</p>
                  <p className="text-gray-500">{l.client_phone}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        </div>
        </div>
        );
  } catch (error) {
    console.error('Error rendering VehicleView:', error);
    return (
      <div className="p-3 md:p-4 bg-gray-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="text-red-700 font-semibold">Error al cargar el vehículo</h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <Button onClick={onClose} className="mt-3">Volver</Button>
          </div>
        </div>
      </div>
    );
  }
}