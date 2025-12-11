import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Car, Grid3x3, List, Trash2, Eye, Edit, Clock, Wrench, CheckCircle, PauseCircle, Tag, XCircle, DollarSign, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import VehicleView from "../components/vehicles/VehicleView";
import VehicleFormDialog from "../components/vehicles/VehicleFormDialog";
import CostPriceDialog from "../components/vehicles/CostPriceDialog";
import InfoAutoPriceDialog from "../components/vehicles/InfoAutoPriceDialog";
import TargetPriceDialog from "../components/vehicles/TargetPriceDialog";
import PublicPriceDialog from "../components/vehicles/PublicPriceDialog";
import ClientDetail from "../components/clients/ClientDetail";
import SaleFormDialog from "../components/sales/SaleFormDialog";
import ReservationForm from "../components/reservations/ReservationForm";
import RequestInspectionDialog from "../components/vehicles/RequestInspectionDialog";

const STATUS_CONFIG = {
  'A PERITAR': { bg: 'bg-amber-100 text-amber-700', icon: Wrench },
  'A INGRESAR': { bg: 'bg-cyan-100 text-cyan-700', icon: Clock },
  'EN REPARACION': { bg: 'bg-gray-200 text-gray-600', icon: Wrench },
  'DISPONIBLE': { bg: 'bg-cyan-500 text-white', icon: CheckCircle },
  'PAUSADO': { bg: 'bg-gray-200 text-gray-500', icon: PauseCircle },
  'RESERVADO': { bg: 'bg-gray-900 text-white', icon: Tag },
  'VENDIDO': { bg: 'bg-red-100 text-red-700', icon: Tag },
  'ENTREGADO': { bg: 'bg-red-600 text-white', icon: XCircle }
};

const convertValue = (value, currency, exchangeRate, targetCurrency) => {
  if (!value || !exchangeRate) return 0;
  if (currency === targetCurrency) return value;
  if (currency === 'ARS' && targetCurrency === 'USD') return value / exchangeRate;
  if (currency === 'USD' && targetCurrency === 'ARS') return value * exchangeRate;
  return value;
};

const formatPrice = (value, currency) => {
  if (!value) return '-';
  if (currency === 'USD') return `U$D ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
};

export default function Vehicles() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Sale/Reservation dialogs from list
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [actionVehicle, setActionVehicle] = useState(null);

  // Price edit dialogs from list
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [showInfoAutoDialog, setShowInfoAutoDialog] = useState(false);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [showPublicDialog, setShowPublicDialog] = useState(false);
  const [priceEditVehicle, setPriceEditVehicle] = useState(null);

  // Reset to list when clicking module in sidebar
  React.useEffect(() => {
    const handleReset = (e) => {
      if (e.detail === 'Vehicles') {
        setSelectedVehicle(null);
        setEditingVehicle(null);
        setSelectedClient(null);
      }
    };
    window.addEventListener('resetModuleView', handleReset);
    return () => window.removeEventListener('resetModuleView', handleReset);
  }, []);

  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list('-created_at'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Sincronizar URL con selectedVehicle
  useEffect(() => {
    if (vehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      } else {
        // Si el ID no existe, volver a la lista
        navigate('/vehicles', { replace: true });
      }
    } else if (!vehicleId) {
      setSelectedVehicle(null);
    }
  }, [vehicleId, vehicles, navigate]);

  // Función helper para seleccionar vehículo y actualizar URL
  const selectVehicle = (vehicle) => {
    if (vehicle) {
      navigate(`/vehicles/${vehicle.id}`);
    } else {
      navigate('/vehicles');
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setEditingVehicle(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancelar TODAS las queries relacionadas
      await queryClient.cancelQueries({ queryKey: ['vehicles'] });
      await queryClient.cancelQueries({ queryKey: ['vehicle', id] });
      
      // Snapshots
      const previousVehicles = queryClient.getQueryData(['vehicles']);
      const previousVehicle = queryClient.getQueryData(['vehicle', id]);
      const previousSelected = selectedVehicle;
      
      // Actualizar optimísticamente la lista
      queryClient.setQueryData(['vehicles'], (old) =>
        old?.map((v) => (v.id === id ? { ...v, ...data } : v))
      );
      
      // Actualizar optimísticamente la query individual (la que usa VehicleView)
      queryClient.setQueryData(['vehicle', id], (old) => {
        if (!old) return old;
        return { ...old, ...data };
      });
      
      // Actualizar vehículo seleccionado INSTANTÁNEAMENTE
      if (selectedVehicle && selectedVehicle.id === id) {
        const updatedVehicle = { ...selectedVehicle, ...data };
        setSelectedVehicle(updatedVehicle);
      }
      
      return { previousVehicles, previousVehicle, previousSelected };
    },
    onSuccess: () => { 
      setEditingVehicle(null); 
      toast.success("Vehículo actualizado");
      // Refrescar después de 1 segundo para sincronizar con servidor
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      }, 1000);
    },
    onError: (err, variables, context) => {
      // Revertir TODOS los cambios en caso de error
      if (context?.previousVehicles) {
        queryClient.setQueryData(['vehicles'], context.previousVehicles);
      }
      if (context?.previousVehicle) {
        queryClient.setQueryData(['vehicle', variables.id], context.previousVehicle);
      }
      if (context?.previousSelected) {
        setSelectedVehicle(context.previousSelected);
      }
      toast.error("Error al actualizar el vehículo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const handleSubmit = (data) => {
    if (editingVehicle?.id) updateMutation.mutate({ id: editingVehicle.id, data });
    else createMutation.mutate(data);
  };

  const handleStatusChange = (vehicleId, newStatus, vehicle) => {
    // Si hay vehículos seleccionados, cambiar estado a todos
    if (selectedVehicles.length > 0 && selectedVehicles.includes(vehicleId)) {
      handleBulkStatusChange(newStatus);
    } else if (newStatus === 'A PERITAR') {
      setActionVehicle(vehicle);
      setShowInspectionDialog(true);
    } else if (newStatus === 'VENDIDO') {
      setActionVehicle(vehicle);
      setShowSaleDialog(true);
    } else if (newStatus === 'RESERVADO') {
      setActionVehicle(vehicle);
      setShowReservationDialog(true);
    } else {
      updateMutation.mutate({ id: vehicleId, data: { status: newStatus } });
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedVehicles.length === 0) return;
    for (const id of selectedVehicles) {
      await base44.entities.Vehicle.update(id, { status: newStatus });
    }
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    toast.success(`${selectedVehicles.length} vehículo(s) actualizados a ${newStatus}`);
  };

  const handleDelete = (vehicleId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('¿Eliminar este vehículo?')) deleteMutation.mutate(vehicleId);
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedVehicles.length} vehículo(s)?`)) return;
    for (const id of selectedVehicles) {
      await base44.entities.Vehicle.delete(id);
    }
    setSelectedVehicles([]);
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    toast.success(`${selectedVehicles.length} vehículo(s) eliminado(s)`);
  };

  const handleCostEdit = (vehicle) => {
    setPriceEditVehicle(vehicle);
    setShowCostDialog(true);
  };

  const handleInfoAutoEdit = (vehicle) => {
    setPriceEditVehicle(vehicle);
    setShowInfoAutoDialog(true);
  };

  const handleTargetEdit = (vehicle) => {
    setPriceEditVehicle(vehicle);
    setShowTargetDialog(true);
  };

  const handlePublicEdit = (vehicle) => {
    setPriceEditVehicle(vehicle);
    setShowPublicDialog(true);
  };

  const handleCostSubmit = async (priceData) => {
    if (!priceEditVehicle) return;
    await updateMutation.mutateAsync({ id: priceEditVehicle.id, data: priceData });
    setShowCostDialog(false);
    setPriceEditVehicle(null);
  };

  const handleInfoAutoSubmit = async (priceData) => {
    if (!priceEditVehicle) return;
    await updateMutation.mutateAsync({ id: priceEditVehicle.id, data: priceData });
    setShowInfoAutoDialog(false);
    setPriceEditVehicle(null);
  };

  const handleTargetSubmit = async (priceData) => {
    if (!priceEditVehicle) return;
    await updateMutation.mutateAsync({ id: priceEditVehicle.id, data: priceData });
    setShowTargetDialog(false);
    setPriceEditVehicle(null);
  };

  const handlePublicSubmit = async (priceData) => {
    if (!priceEditVehicle) return;
    await updateMutation.mutateAsync({ id: priceEditVehicle.id, data: priceData });
    setShowPublicDialog(false);
    setPriceEditVehicle(null);
  };

  const toggleSelectAll = () => {
    if (selectedVehicles.length === paginatedVehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(paginatedVehicles.map(v => v.id));
    }
  };

  const toggleSelectVehicle = (id, e) => {
    e.stopPropagation();
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePrintStock = () => {
    const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const printVehicles = filteredVehicles.filter(v => v.status !== 'VENDIDO');

    const rows = printVehicles.map(v => {
      // Usar currentBlueRate como fallback cuando no hay cotización específica
      const costRate = v.cost_exchange_rate || currentBlueRate;
      const infoautoRate = v.infoauto_exchange_rate || currentBlueRate;
      const targetRate = v.target_price_exchange_rate || currentBlueRate;
      const publicRate = v.public_price_exchange_rate || currentBlueRate;

      // Calcular costo total igual que en VehicleView: convertir todo a ARS usando cotizaciones respectivas
      const valorTomaArs = convertValue(v.cost_value, v.cost_currency, v.cost_exchange_rate, 'ARS');
      const expensesArs = (v.expenses || []).reduce((sum, e) => sum + convertValue(e.value, e.currency, e.exchange_rate || v.cost_exchange_rate, 'ARS'), 0);
      const costoTotal = valorTomaArs + expensesArs;

      // Calcular costo en USD: si el costo original está en USD, usar ese valor; si no, convertir
      const valorTomaUsd = convertValue(v.cost_value, v.cost_currency, v.cost_exchange_rate, 'USD');
      const expensesUsd = (v.expenses || []).reduce((sum, e) => sum + convertValue(e.value, e.currency, e.exchange_rate || v.cost_exchange_rate, 'USD'), 0);
      const costoUsd = valorTomaUsd + expensesUsd;
      const infoautoArs = convertValue(v.infoauto_value, v.infoauto_currency, infoautoRate, 'ARS');
      const targetArs = convertValue(v.target_price_value, v.target_price_currency, targetRate, 'ARS');
      const publicArs = convertValue(v.public_price_value, v.public_price_currency, publicRate, 'ARS');

      console.log('🔍 Vehicles list - Datos del vehículo:', v.id, {
        infoauto_value: v.infoauto_value,
        infoauto_currency: v.infoauto_currency,
        target_price_value: v.target_price_value,
        target_price_currency: v.target_price_currency,
        public_price_value: v.public_price_value,
        public_price_currency: v.public_price_currency,
        rates: { infoautoRate, targetRate, publicRate },
        converted: { infoautoArs, targetArs, publicArs }
      });

      // Costo USD ya calculado arriba
      const infoautoUsd = infoautoArs ? infoautoArs / currentBlueRate : null;
      const targetUsd = targetArs ? targetArs / currentBlueRate : null;
      const publicUsd = publicArs ? publicArs / currentBlueRate : null;

      const isCons = v.ownership === 'CONSIGNACIÓN' || v.is_consignment;
      return '<tr>' +
        '<td class="uppercase">' + (isCons ? 'CONSIG.' : (v.ownership || '-')) + '</td>' +
        '<td class="uppercase">' + (v.brand || '-') + '</td>' +
        '<td class="uppercase">' + (v.model || '-') + '</td>' +
        '<td>' + (v.year || '-') + '</td>' +
        '<td class="uppercase">' + (v.plate || '-') + '</td>' +
        '<td>' + (v.kilometers ? v.kilometers.toLocaleString('es-AR') : '-') + '</td>' +
        '<td class="uppercase">' + (v.color || '-') + '</td>' +
        '<td class="text-right">' + (costoTotal ? '$' + costoTotal.toLocaleString('es-AR', {maximumFractionDigits: 0}) + '<br/><span class="text-xs text-gray-600">U$D ' + (costoUsd ? costoUsd.toLocaleString('en-US', {maximumFractionDigits: 0}) : '0') + '</span>' : '-') + '</td>' +
        '<td class="text-right">' + (infoautoArs ? '$' + infoautoArs.toLocaleString('es-AR', {maximumFractionDigits: 0}) + '<br/><span class="text-xs text-gray-600">U$D ' + infoautoUsd.toLocaleString('en-US', {maximumFractionDigits: 0}) + '</span>' : '-') + '</td>' +
        '<td class="text-right">' + (targetArs ? '$' + targetArs.toLocaleString('es-AR', {maximumFractionDigits: 0}) + '<br/><span class="text-xs text-gray-600">U$D ' + targetUsd.toLocaleString('en-US', {maximumFractionDigits: 0}) + '</span>' : '-') + '</td>' +
        '<td class="text-right">' + (publicArs ? '$' + publicArs.toLocaleString('es-AR', {maximumFractionDigits: 0}) + '<br/><span class="text-xs text-gray-600">U$D ' + publicUsd.toLocaleString('en-US', {maximumFractionDigits: 0}) + '</span>' : '-') + '</td>' +
        '<td>' + (v.status || '-') + '</td>' +
        '</tr>';
    }).join('');

    const html = '<!DOCTYPE html><html><head><title>Stock Disponible - Padrani Automotores</title>' +
      '<style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 10px; padding: 15px; } ' +
      '.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ccc; } ' +
      '.logo { font-size: 16px; font-weight: bold; } .logo span { font-size: 10px; font-weight: normal; color: #666; } .date { font-size: 10px; color: #666; } ' +
      '.title { font-size: 14px; font-weight: bold; margin-bottom: 10px; } table { width: 100%; border-collapse: collapse; } ' +
      'th { text-align: left; padding: 6px 4px; border-bottom: 1px solid #333; font-size: 9px; text-transform: uppercase; } ' +
      'td { padding: 5px 4px; border-bottom: 1px solid #eee; font-size: 9px; line-height: 1.4; } tr:nth-child(even) { background: #fafafa; } ' +
      '.text-right { text-align: right; } .uppercase { text-transform: uppercase; } .text-xs { font-size: 8px; } .text-gray-600 { color: #666; } @media print { body { padding: 10px; } }</style></head>' +
      '<body><div class="header"><div class="logo">PADRANI<br/><span>Automotores</span></div><div class="date">' + today + '</div></div>' +
      '<div class="title">Stock Disponible (' + printVehicles.length + ' unidades)</div>' +
      '<table><thead><tr><th>Propiedad</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Dominio</th><th>KM</th><th>Color</th>' +
      '<th class="text-right">Costo</th><th class="text-right">InfoAuto</th><th class="text-right">Objetivo</th><th class="text-right">Público</th><th>Estado</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></body></html>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plate?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (filterStatus === 'ALL' || v.status === filterStatus);
  }).sort((a, b) => {
    // Entregados y Descartados van al final
    const endStatuses = ['ENTREGADO', 'DESCARTADO'];
    const aIsEnd = endStatuses.includes(a.status);
    const bIsEnd = endStatuses.includes(b.status);
    
    if (aIsEnd && !bIsEnd) return 1;
    if (!aIsEnd && bIsEnd) return -1;
    
    // Ordenar por fecha de ingreso (o carga si no existe ingreso), más nuevo primero
    const aDate = a.entry_date || a.load_date || a.created_date;
    const bDate = b.entry_date || b.load_date || b.created_date;
    
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    
    return new Date(bDate) - new Date(aDate);
  });

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + rowsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, rowsPerPage]);

  // Get current blue rate for USD conversion
  const { data: rates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => base44.entities.ExchangeRate.list('-rate_date'),
  });
  const currentBlueRate = rates.find(r => r.rate_type === 'Diaria')?.usd_rate || 1200;

  // Fetch pending inspections for notification badges
  const { data: pendingInspections = [] } = useQuery({
    queryKey: ['pending-inspections'],
    queryFn: () => base44.entities.VehicleInspection.filter({ status: 'Pendiente aprobación' }, '-inspection_date'),
    refetchInterval: 15000,
  });

  // Calculate notifications for each vehicle
  const getVehicleNotifications = (vehicle) => {
    const notifications = [];
    
    // Pending inspection approval
    const hasPendingInspection = pendingInspections.some(i => i.vehicle_id === vehicle.id);
    if (hasPendingInspection) {
      notifications.push({ type: 'inspection', label: 'Peritaje pendiente de aprobación' });
    }
    
    // Pending decision after approval
    if (vehicle.inspection_decision_pending) {
      notifications.push({ type: 'decision', label: 'Decisión pendiente (tomar/descartar)' });
    }
    
    return notifications;
  };

  const getPriceDisplay = (v, type) => {
    let valueArs = 0;
    let rateForUsd = currentBlueRate;
    let historicalInfo = null;

    if (type === 'cost') {
      // Usar la cotización histórica para calcular exactamente cuánto se pagó
      const historicalRate = v.cost_exchange_rate || currentBlueRate;

      // Calcular valor de toma en ARS usando la cotización histórica
      const tomaArs = convertValue(v.cost_value, v.cost_currency, historicalRate, 'ARS');

      // Calcular gastos usando su propia cotización histórica o la del costo principal
      const gastosArs = (v.expenses || []).reduce((sum, e) => {
        // Si el gasto tiene fecha y cotización, usar esa; sino usar la del costo principal
        const expenseRate = e.exchange_rate || historicalRate;
        return sum + convertValue(e.value, e.currency, expenseRate, 'ARS');
      }, 0);

      valueArs = tomaArs + gastosArs;

      // Para USD, usar la cotización histórica del costo principal
      // Esto muestra cuánto valía realmente en dólares cuando se compró
      rateForUsd = historicalRate;
    } else {
      const keyMap = {
        'target': { value: 'target_price_value', currency: 'target_price_currency', rate: 'target_price_exchange_rate' },
        'public': { value: 'public_price_value', currency: 'public_price_currency', rate: 'public_price_exchange_rate' },
        'infoauto': { value: 'infoauto_value', currency: 'infoauto_currency', rate: 'infoauto_exchange_rate' }
      };
      const keys = keyMap[type];
      const value = v[keys.value];
      const currency = v[keys.currency] || 'ARS';
      const rate = v[keys.rate] || currentBlueRate;
      valueArs = convertValue(value, currency, rate, 'ARS');
      rateForUsd = currentBlueRate;
    }

    if (!valueArs) return { ars: '-', usd: '', historical: null };

    const valueUsd = valueArs / rateForUsd;
    return {
      ars: `$${valueArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,
      usd: `U$D ${valueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      historical: historicalInfo
    };
  };

  // Si hay vehicleId en URL pero no hay vehículo seleccionado, mostrar spinner
  if (vehicleId && !selectedVehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (selectedClient) return <ClientDetail client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={() => {}} />;
  
  // Si hay vehículo seleccionado, mostrar solo la vista de detalle
  if (selectedVehicle) return (
    <>
      <VehicleView vehicle={selectedVehicle} onClose={() => selectVehicle(null)} onEdit={(v) => { setEditingVehicle(v); }} onDelete={(id) => { deleteMutation.mutate(id); selectVehicle(null); }} />
      <VehicleFormDialog 
        open={editingVehicle !== null} 
        onOpenChange={(open) => { if (!open) setEditingVehicle(null); }} 
        vehicle={editingVehicle?.id ? editingVehicle : null} 
        onSubmit={handleSubmit} 
        isLoading={createMutation.isPending || updateMutation.isPending} 
      />
    </>
  );

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Vehículos</h1>
            <p className="text-[10px] text-gray-500">{filteredVehicles.length} unidades</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selectedVehicles.length > 0 && (
              <Button variant="outline" onClick={handleBulkDelete} className="h-8 md:h-8 text-[11px] md:text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar ({selectedVehicles.length})
              </Button>
            )}
            {selectionMode ? (
              <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedVehicles([]); }} className="h-8 md:h-8 text-[11px] md:text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                Cancelar selección
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSelectionMode(true)} className="h-8 md:h-8 text-[11px] md:text-[11px]">
                Selección múltiple
              </Button>
            )}
            <Button variant="outline" onClick={() => handlePrintStock()} className="h-8 md:h-8 text-[11px] md:text-[11px]">
              Imprimir Stock
            </Button>
            <Button onClick={() => setEditingVehicle({})} className="h-8 md:h-8 text-[11px] md:text-[11px] bg-gray-900 hover:bg-gray-800">
              <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
            </Button>
          </div>
          </div>

          <VehicleFormDialog 
          open={editingVehicle !== null} 
          onOpenChange={(open) => { if (!open) setEditingVehicle(null); }} 
          vehicle={editingVehicle?.id ? editingVehicle : null} 
          onSubmit={handleSubmit} 
          isLoading={createMutation.isPending || updateMutation.isPending} 
          />

        {/* Filters Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-7 text-[11px] bg-white" />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-7 text-[11px] bg-white">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-[11px]">Todos los estados</SelectItem>
              {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>)}
            </SelectContent>
          </Select>



          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span>Filas:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(v) => setRowsPerPage(parseInt(v))}>
                <SelectTrigger className="w-16 h-7 text-[11px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-[11px]">10</SelectItem>
                  <SelectItem value="20" className="text-[11px]">20</SelectItem>
                  <SelectItem value="30" className="text-[11px]">30</SelectItem>
                  <SelectItem value="50" className="text-[11px]">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span>Vista:</span>
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => setViewMode('table')}>
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button variant={viewMode === 'gallery' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => setViewMode('gallery')}>
                <Grid3x3 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          </div>

        {/* Table/Gallery */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600 mx-auto" /></div>
            ) : filteredVehicles.length > 0 ? (
              viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-[13px] md:text-[11px]">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        {selectionMode && (
                          <th className="px-3 py-3 w-8">
                            <Checkbox
                              checked={selectedVehicles.length === paginatedVehicles.length && paginatedVehicles.length > 0}
                              onCheckedChange={toggleSelectAll}
                              className="h-4 w-4 md:h-3.5 md:w-3.5"
                            />
                          </th>
                        )}
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">Propiedad</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">Marca</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">Modelo</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">Año</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">Dominio</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">KM</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px]">Color</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px] min-w-[130px]">Costo Total</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px] min-w-[130px]">InfoAuto</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px] min-w-[130px]">Precio Objetivo</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px] min-w-[130px]">Precio Público</th>
                        <th className="text-left px-3 py-3 font-semibold text-gray-900 text-[13px] md:text-[11px] min-w-[140px]">Estado</th>
                        <th className="px-3 py-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVehicles.map((v, index) => {
                        const isCons = v.ownership === 'CONSIGNACIÓN';
                        const StatusIcon = STATUS_CONFIG[v.status]?.icon || CheckCircle;
                        const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                        return (
                          <tr key={v.id} className={`border-b hover:bg-gray-50 cursor-pointer ${rowClass} ${selectedVehicles.includes(v.id) ? 'bg-cyan-50' : v.status === 'VENDIDO' ? 'bg-yellow-50' : ''}`} onClick={() => selectionMode ? toggleSelectVehicle(v.id, { stopPropagation: () => {} }) : selectVehicle(v)}>
                            {selectionMode && (
                              <td className="px-3 py-3" onClick={(e) => toggleSelectVehicle(v.id, e)}>
                                <Checkbox
                                  checked={selectedVehicles.includes(v.id)}
                                  className="h-4 w-4 md:h-3.5 md:w-3.5"
                                />
                              </td>
                            )}
                            <td className="px-3 py-3">
                              {(isCons || v.is_consignment) ? (
                                <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-[9px] rounded font-medium">CONSIG.</span>
                              ) : (
                                <span className="text-gray-500 uppercase">{v.ownership || '-'}</span>
                              )}
                            </td>
                            <td className="px-2 py-2 font-medium uppercase relative">
                                  {v.brand}
                                  {(() => {
                                    const notifs = getVehicleNotifications(v);
                                    if (notifs.length === 0) return null;
                                    return (
                                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                                        {notifs.length}
                                      </span>
                                    );
                                  })()}
                                </td>
                            <td className="px-3 py-3 uppercase text-[13px] md:text-[11px]">{v.model}</td>
                            <td className="px-3 py-3 text-[13px] md:text-[11px]">{v.year}</td>
                            <td className="px-3 py-3 font-mono uppercase text-[13px] md:text-[11px]">{v.plate || '-'}</td>
                            <td className="px-3 py-3 text-[13px] md:text-[11px]">{v.kilometers?.toLocaleString('es-AR') || '-'}</td>
                            <td className="px-3 py-3 uppercase text-[13px] md:text-[11px]">{v.color || '-'}</td>
                            <td className="px-3 py-4 min-w-[130px] cursor-pointer hover:bg-gray-100 rounded text-right" onClick={(e) => { e.stopPropagation(); handleCostEdit(v); }}>
                              {(() => {
                                const p = getPriceDisplay(v, 'cost');
                                const hasHistorical = p.historical;
                                return (
                                  <div className="flex flex-col relative">
                                    <div className="font-semibold text-[13px] md:text-[11px]">{p.ars}</div>
                                    <div className="flex items-center justify-end gap-1">
                                      {p.usd && <div className="text-[12px] md:text-[10px] font-semibold text-cyan-600">{p.usd}</div>}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-4 min-w-[130px] cursor-pointer hover:bg-gray-100 rounded text-right" onClick={(e) => { e.stopPropagation(); handleInfoAutoEdit(v); }}>
                              {(() => { const p = getPriceDisplay(v, 'infoauto'); return (<div className="flex flex-col"><div className="font-semibold text-[13px] md:text-[11px]">{p.ars}</div>{p.usd && <div className="text-[12px] md:text-[10px] font-semibold text-cyan-600">{p.usd}</div>}</div>); })()}
                            </td>
                            <td className="px-3 py-4 min-w-[130px] cursor-pointer hover:bg-gray-100 rounded text-right" onClick={(e) => { e.stopPropagation(); handleTargetEdit(v); }}>
                              {(() => { const p = getPriceDisplay(v, 'target'); return (<div className="flex flex-col"><div className="font-semibold text-[13px] md:text-[11px]">{p.ars}</div>{p.usd && <div className="text-[12px] md:text-[10px] font-semibold text-cyan-600">{p.usd}</div>}</div>); })()}
                            </td>
                            <td className="px-3 py-4 min-w-[130px] cursor-pointer hover:bg-gray-100 rounded text-right" onClick={(e) => { e.stopPropagation(); handlePublicEdit(v); }}>
                              {(() => { const p = getPriceDisplay(v, 'public'); return (<div className="flex flex-col"><div className="font-semibold text-[13px] md:text-[11px]">{p.ars}</div>{p.usd && <div className="text-[12px] md:text-[10px] font-semibold text-cyan-600">{p.usd}</div>}</div>); })()}
                            </td>
                            <td className="px-3 py-3 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                              {['RESERVADO', 'VENDIDO', 'ENTREGADO'].includes(v.status) ? (
                                <Badge className={`${STATUS_CONFIG[v.status]?.bg} text-[12px] md:text-[10px] h-7 md:h-6 w-36 md:w-32 justify-center flex items-center gap-1`}>
                                  <StatusIcon className="w-4 h-4 md:w-3 md:h-3 flex-shrink-0" />
                                  <span className="truncate">{v.status}</span>
                                </Badge>
                              ) : (
                                <Select value={v.status} onValueChange={(s) => handleStatusChange(v.id, s, v)}>
                                  <SelectTrigger className="h-7 md:h-6 text-[12px] md:text-[10px] w-36 md:w-32 border-0 bg-transparent p-0 [&>svg]:hidden">
                                    <Badge className={`${STATUS_CONFIG[v.status]?.bg} text-[12px] md:text-[10px] h-7 md:h-6 w-full justify-center flex items-center gap-1`}>
                                      <StatusIcon className="w-4 h-4 md:w-3 md:h-3 flex-shrink-0" />
                                      <span className="truncate">{v.status}</span>
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['A PERITAR', 'A INGRESAR', 'EN REPARACION', 'DISPONIBLE', 'PAUSADO', 'RESERVADO', 'VENDIDO'].map(s => {
                                      const Icon = STATUS_CONFIG[s]?.icon || CheckCircle;
                                      return <SelectItem key={s} value={s} className="text-[12px] md:text-[10px]"><div className="flex items-center gap-1"><Icon className="w-4 h-4 md:w-3 md:h-3" />{s}</div></SelectItem>;
                                    })}
                                  </SelectContent>
                                </Select>
                              )}
                              </td>
                            <td className="px-3 py-3 w-20" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-6 md:w-6" onClick={() => setEditingVehicle(v)}><Edit className="w-4 h-4 md:w-3 md:h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-6 md:w-6" onClick={(e) => handleDelete(v.id, e)}><Trash2 className="w-4 h-4 md:w-3 md:h-3 text-red-500" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
                  {paginatedVehicles.map((v) => (
                    <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectVehicle(v)}>
                      <div className="h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                        <Car className="w-8 h-8 text-gray-400" />
                        <Badge className={`absolute top-1 right-1 text-[8px] px-1 py-0 ${STATUS_CONFIG[v.status]?.bg}`}>{v.status}</Badge>
                      </div>
                      <CardContent className="p-1.5">
                        <p className="font-semibold text-[10px] truncate">{v.brand} {v.model}</p>
                        <p className="text-[9px] text-gray-500">{v.year} • {v.plate}</p>
                        {(() => { const p = getPriceDisplay(v, 'public'); return (<div className="mt-0.5"><div className="font-bold text-[10px] text-green-600">{p.ars}</div>{p.usd && <div className="text-[8px] text-cyan-600">{p.usd}</div>}</div>); })()}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-[11px] text-gray-500">Sin vehículos</p>
              </div>
            )}
            </CardContent>

            {/* Pagination */}
            {filteredVehicles.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
              <p className="text-[10px] text-gray-500">
                Mostrando {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredVehicles.length)} de {filteredVehicles.length}
              </p>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] px-2">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            )}
            </Card>

            {/* Sale Dialog from list */}
            <SaleFormDialog 
              open={showSaleDialog} 
              onOpenChange={(o) => { setShowSaleDialog(o); if (!o) setActionVehicle(null); }} 
              vehicle={actionVehicle}
              onSaleCreated={() => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); }}
            />

            {/* Reservation Dialog from list */}
            <ReservationForm 
              open={showReservationDialog} 
              onOpenChange={(o) => { setShowReservationDialog(o); if (!o) setActionVehicle(null); }} 
              vehicle={actionVehicle}
              onSubmit={async (data) => {
                await base44.entities.Reservation.create(data);
                await base44.entities.Vehicle.update(actionVehicle.id, { status: 'RESERVADO' });
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                setShowReservationDialog(false);
                setActionVehicle(null);
                toast.success("Reserva creada");
              }}
            />

            {/* Inspection Request Dialog from list */}
            <RequestInspectionDialog
              open={showInspectionDialog}
              onOpenChange={(o) => { setShowInspectionDialog(o); if (!o) setActionVehicle(null); }}
              vehicle={actionVehicle}
            />

            {/* Price Edit Dialogs from list */}
            <CostPriceDialog
              open={showCostDialog}
              onOpenChange={(o) => { setShowCostDialog(o); if (!o) setPriceEditVehicle(null); }}
              vehicle={priceEditVehicle}
              onSubmit={handleCostSubmit}
              isLoading={updateMutation.isPending}
            />
            <InfoAutoPriceDialog
              open={showInfoAutoDialog}
              onOpenChange={(o) => { setShowInfoAutoDialog(o); if (!o) setPriceEditVehicle(null); }}
              vehicle={priceEditVehicle}
              onSubmit={handleInfoAutoSubmit}
              isLoading={updateMutation.isPending}
            />
            <TargetPriceDialog
              open={showTargetDialog}
              onOpenChange={(o) => { setShowTargetDialog(o); if (!o) setPriceEditVehicle(null); }}
              vehicle={priceEditVehicle}
              onSubmit={handleTargetSubmit}
              isLoading={updateMutation.isPending}
            />
            <PublicPriceDialog
              open={showPublicDialog}
              onOpenChange={(o) => { setShowPublicDialog(o); if (!o) setPriceEditVehicle(null); }}
              vehicle={priceEditVehicle}
              onSubmit={handlePublicSubmit}
              isLoading={updateMutation.isPending}
              onEditExpense={(expense, index) => {
                setEditingExpense(expense);
                setEditingExpenseIndex(index);
              }}
            />
            </div>
            </div>
            );
            }