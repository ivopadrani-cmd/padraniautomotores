import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, User, DollarSign, FileText, CheckCircle, Upload, Download, X, Edit, Ban, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import SalesContractView from "./SalesContractView";
import DepositReceiptView from "../reservations/DepositReceiptView";
import SaleFormDialog from "./SaleFormDialog";
import CompleteBoletoDataForm from "./CompleteBoletoDataForm";

const STATUS_CONFIG = {
  PENDIENTE: 'bg-gray-200 text-gray-700',
  CONFIRMADA: 'bg-cyan-100 text-cyan-700',
  ENTREGADA: 'bg-gray-300 text-gray-700',
  FINALIZADA: 'bg-gray-900 text-white',
  CANCELADA: 'bg-red-100 text-red-700'
};

export default function SaleDetail({ sale, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [showBoleto, setShowBoleto] = useState(false);
  const [showRecibo, setShowRecibo] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCompleteDataModal, setShowCompleteDataModal] = useState(false);
  const queryClient = useQueryClient();

  // Calcular valores en ARS
  const calculateSaleValues = (currentSale) => {
    const salePriceArs = currentSale.sale_price_currency === 'USD'
      ? currentSale.sale_price * (currentSale.sale_price_exchange_rate || 1200)
      : currentSale.sale_price;

    const depositArs = currentSale.deposit
      ? (currentSale.deposit.currency === 'USD'
          ? (currentSale.deposit.amount || 0) * (currentSale.deposit.exchange_rate || 1200)
          : (currentSale.deposit.amount || 0))
      : 0;

    const cashPaymentArs = currentSale.cash_payment
      ? (currentSale.cash_payment.currency === 'USD'
          ? (currentSale.cash_payment.amount || 0) * (currentSale.cash_payment.exchange_rate || 1200)
          : (currentSale.cash_payment.amount || 0))
      : 0;

    const tradeInArs = (currentSale.trade_ins || []).reduce((sum, ti) =>
      sum + (ti.currency === 'USD'
        ? (ti.value || 0) * (ti.exchange_rate || 1200)
        : (ti.value || 0)), 0);

    const financingArs = currentSale.financing
      ? (currentSale.financing.currency === 'USD'
          ? (currentSale.financing.amount || 0) * (currentSale.financing.exchange_rate || 1200)
          : (currentSale.financing.amount || 0))
      : 0;

    const totalPaid = depositArs + cashPaymentArs + tradeInArs;
    const balanceDue = salePriceArs - totalPaid - financingArs;

    return {
      salePriceArs,
      depositArs,
      cashPaymentArs,
      tradeInArs,
      financingArs,
      totalPaid,
      balanceDue
    };
  };

  // Verificar si la venta tiene boleto creado (tiene todos los datos requeridos)
  const hasContractCreated = () => {
    const hasClientData = client && client.dni && client.cuit_cuil && client.address && client.city && client.province;
    const hasVehicleData = vehicle && vehicle.brand && vehicle.model && vehicle.year && vehicle.plate &&
                          vehicle.engine_number && vehicle.chassis_number && vehicle.chassis_brand &&
                          vehicle.engine_brand && vehicle.registration_city && vehicle.registration_province;
    return hasClientData && hasVehicleData;
  };

  // Query refetchable para la venta actual
  const { data: currentSale } = useQuery({
    queryKey: ['sale', sale.id],
    queryFn: () => base44.entities.Sale.get(sale.id),
    initialData: sale,
    enabled: !!sale.id
  });

  // Calcular valores usando la función
  const saleValues = currentSale ? calculateSaleValues(currentSale) : {
    salePriceArs: 0, depositArs: 0, cashPaymentArs: 0, tradeInArs: 0, financingArs: 0, totalPaid: 0, balanceDue: 0
  };

  const { data: client } = useQuery({
    queryKey: ['client', currentSale.client_id],
    queryFn: () => base44.entities.Client.list().then(clients => clients.find(c => c.id === currentSale.client_id)),
    enabled: !!currentSale.client_id
  });

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', currentSale.vehicle_id],
    queryFn: () => base44.entities.Vehicle.list().then(vehicles => vehicles.find(v => v.id === currentSale.vehicle_id)),
    enabled: !!currentSale.vehicle_id
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Sale.update(sale.id, { sale_status: 'FINALIZADA' });
      if (sale.vehicle_id) await base44.entities.Vehicle.update(sale.vehicle_id, { status: 'VENDIDO' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
      toast.success("Venta finalizada");
      onClose();
    },
  });

  const cancelSaleMutation = useMutation({
    mutationFn: async () => {
      console.log('🔴 Cancelando venta:', currentSale.id);
      await base44.entities.Sale.update(currentSale.id, { sale_status: 'CANCELADA' });
      if (currentSale.vehicle_id) {
        console.log('🔄 Cambiando estado del vehículo a DISPONIBLE:', currentSale.vehicle_id);
        await base44.entities.Vehicle.update(currentSale.vehicle_id, { status: 'DISPONIBLE' });
      }
    },
    onSuccess: () => {
      console.log('✅ Venta cancelada exitosamente');
      // Actualizar TODOS los queries relacionados
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', currentSale.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
      queryClient.invalidateQueries({ queryKey: ['client-sales', currentSale.client_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', currentSale.vehicle_id] });
      // Refetch inmediato de la venta actual
      queryClient.refetchQueries({ queryKey: ['sale', currentSale.id] });
      toast.success("Venta cancelada - Vehículo vuelto a DISPONIBLE");
    },
    onError: (error) => {
      console.error('❌ Error cancelando venta:', error);
      toast.error("Error al cancelar venta");
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async () => {
      console.log('🗑️ Eliminando venta:', currentSale.id);
      if (currentSale.vehicle_id) {
        console.log('🔄 Cambiando estado del vehículo a DISPONIBLE:', currentSale.vehicle_id);
        await base44.entities.Vehicle.update(currentSale.vehicle_id, { status: 'DISPONIBLE' });
      }
      await base44.entities.Sale.delete(currentSale.id);
    },
    onSuccess: () => {
      console.log('✅ Venta eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-sales'] });
      queryClient.invalidateQueries({ queryKey: ['client-sales', currentSale.client_id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', currentSale.vehicle_id] });
      toast.success("Venta eliminada - Vehículo vuelto a DISPONIBLE");
      onClose();
    },
    onError: (error) => {
      console.error('❌ Error eliminando venta:', error);
      toast.error("Error al eliminar venta");
    },
  });

  const updateDocsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Sale.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', currentSale.id] });
      toast.success("Documentos actualizados"); 
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Validar tamaño de archivos (máx 20MB por documento)
    const maxSize = 20 * 1024 * 1024;
    const invalidFiles = files.filter(f => f.size > maxSize);
    if (invalidFiles.length > 0) {
      toast.error(`Algunos archivos son muy grandes (máx 20MB): ${invalidFiles.map(f => f.name).join(', ')}`);
      e.target.value = null;
      return;
    }
    
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile(file);
      return { url: file_url, name: file.name, date: new Date().toISOString().split('T')[0] };
        } catch (error) {
          console.error('Error subiendo archivo:', file.name, error);
          return null;
        }
      });
      
      const uploaded = (await Promise.all(uploadPromises)).filter(f => f);
      
      if (uploaded.length > 0) {
        await updateDocsMutation.mutateAsync({ id: currentSale.id, data: { documents: [...(currentSale.documents || []), ...uploaded] } });
      }
      
      if (uploaded.length < files.length) {
        toast.error(`${files.length - uploaded.length} archivo(s) no se pudieron subir`);
      }
    } catch (error) {
      toast.error("Error al subir archivos");
      console.error(error);
    } finally {
    setUploading(false);
    e.target.value = null;
    }
  };

  const handleRemoveDoc = async (index) => {
    if (!window.confirm('¿Eliminar documento?')) return;
    await updateDocsMutation.mutateAsync({ id: currentSale.id, data: { documents: currentSale.documents.filter((_, i) => i !== index) } });
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-sm font-semibold">Venta</DialogTitle>
            <p className="sr-only">Detalle de venta y boleto de compraventa</p>
          </div>
          <Badge className={`${STATUS_CONFIG[currentSale.sale_status]} text-[10px]`}>{currentSale.sale_status}</Badge>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Vehicle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><Car className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">VEHÍCULO</span></div>
            <p className="font-bold">{currentSale.vehicle_description}</p>
          </div>

          {/* Client */}
          <div>
            <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">CLIENTE</span></div>
            <p className="font-semibold">{currentSale.client_name}</p>
            {client?.phone && <p className="text-[11px] text-gray-500">{client.phone}</p>}
            {currentSale.seller && <p className="text-[10px] text-gray-400 mt-1">Vendedor: {currentSale.seller}</p>}
            {currentSale.seller_dni && <p className="text-[10px] text-gray-400">DNI: {currentSale.seller_dni}</p>}
          </div>

          {/* Sale Price */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">PRECIO DE VENTA</span></div>
            <p className="text-2xl font-bold">${saleValues.salePriceArs?.toLocaleString('es-AR')}</p>
          </div>

          {/* Deposit */}
          {saleValues.depositArs > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-[10px] font-medium text-gray-500 mb-1">SEÑA</div>
              <div className="flex justify-between items-center">
                <p className="font-bold">${saleValues.depositArs?.toLocaleString('es-AR')}</p>
                <p className="text-[11px] text-gray-500">{currentSale.deposit?.date && format(new Date(currentSale.deposit.date), 'dd/MM/yy')}</p>
              </div>
            </div>
          )}

          {/* Cash Payment */}
          {saleValues.cashPaymentArs > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-[10px] font-medium text-gray-500 mb-1">PAGO DE CONTADO</div>
              <div className="flex justify-between items-center">
                <p className="font-bold">${saleValues.cashPaymentArs?.toLocaleString('es-AR')}</p>
                <p className="text-[11px] text-gray-500">{currentSale.cash_payment?.date && format(new Date(currentSale.cash_payment.date), 'dd/MM/yy')}</p>
              </div>
            </div>
          )}

          {/* Trade Ins */}
          {currentSale.trade_ins?.map((ti, i) => {
            const tiValueArs = ti.currency === 'USD' ? (ti.value || 0) * (ti.exchange_rate || 1200) : (ti.value || 0);
            return (
              <div key={i} className="p-3 border border-dashed rounded-lg">
                <div className="text-[10px] font-medium text-gray-500 mb-1">PERMUTA</div>
                <p className="font-semibold">{ti.brand} {ti.model} {ti.year}</p>
                <p className="text-[11px] text-gray-500">{ti.plate} • {ti.kilometers?.toLocaleString('es-AR')} km</p>
                <p className="font-bold text-cyan-600 mt-1">${tiValueArs?.toLocaleString('es-AR')}</p>
              </div>
            );
          })}

          {/* Financing */}
          {saleValues.financingArs > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-[10px] font-medium text-gray-500 mb-1">FINANCIACIÓN</div>
              <p className="font-bold">${saleValues.financingArs?.toLocaleString('es-AR')}</p>
              <p className="text-[11px] text-gray-500">{currentSale.financing?.bank} • {currentSale.financing?.installments} cuotas</p>
            </div>
          )}

          {/* Balance Due */}
          {saleValues.balanceDue > 0 && (
            <div className="p-3 border rounded-lg bg-amber-50 border-amber-200">
              <div className="text-[10px] font-medium text-amber-700 mb-1">SALDO PENDIENTE</div>
              <p className="font-bold text-amber-800">${saleValues.balanceDue?.toLocaleString('es-AR')}</p>
              {currentSale.balance_due_date && (
                <p className="text-[11px] text-amber-600">
                  Fecha límite: {format(new Date(currentSale.balance_due_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">DOCUMENTOS ({currentSale.documents?.length || 0})</span></div>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" disabled={uploading}><Upload className="w-3 h-3 mr-1" />{uploading ? 'Subiendo...' : 'Adjuntar'}</Button>
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {currentSale.documents?.length > 0 ? (
              <div className="space-y-1">
                {currentSale.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-[11px]">
                    <span className="truncate flex-1">{doc.name}</span>
                    <div className="flex gap-1">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-6 w-6"><Download className="w-3 h-3" /></Button></a>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveDoc(i)}><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-gray-400 text-center py-2">Sin documentos</p>}
          </div>

          {/* Date & Observations */}
          <div className="text-[10px] text-gray-400">Venta del {format(new Date(currentSale.sale_date), 'dd/MM/yyyy')}</div>
          {currentSale.observations && <div className="text-[11px] p-2 bg-gray-50 rounded">{currentSale.observations}</div>}

          {/* Document Actions */}
            <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1 h-8 text-[10px]"
              onClick={() => hasContractCreated() ? setShowBoleto(true) : setShowCompleteDataModal(true)}
              disabled={currentSale.sale_status === 'CANCELADA'}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
            {hasContractCreated() ? 'Ver Boleto' : (currentSale?.contract_clauses || currentSale?.observations ? 'Guardar cambios' : 'Crear Boleto Compraventa')}
            </Button>
            {currentSale.deposit_amount_ars > 0 && (
              <Button 
                variant="outline" 
                className="flex-1 h-8 text-[10px]" 
                onClick={() => setShowRecibo(true)}
                disabled={currentSale.sale_status === 'CANCELADA'}
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />Ver Recibo
              </Button>
            )}
          </div>

          {/* Edit & Cancel Actions */}
          {currentSale.sale_status !== 'FINALIZADA' && currentSale.sale_status !== 'CANCELADA' && (
            <>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-8 text-[10px]" 
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />Editar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-8 text-[10px] border-red-200 text-red-600 hover:bg-red-50" 
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de cancelar esta venta? El vehículo volverá a DISPONIBLE.')) {
                      cancelSaleMutation.mutate();
                    }
                  }}
                  disabled={cancelSaleMutation.isPending}
                >
                  <Ban className="w-3.5 h-3.5 mr-1.5" />
                  {cancelSaleMutation.isPending ? 'Cancelando...' : 'Cancelar Venta'}
                </Button>
              </div>
              <Button 
                className="w-full h-8 text-[11px] bg-gray-900 hover:bg-gray-800" 
                onClick={() => finalizeMutation.mutate()} 
                disabled={finalizeMutation.isPending}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                {finalizeMutation.isPending ? 'Finalizando...' : 'Finalizar Venta'}
              </Button>
            </>
          )}

          {/* Mostrar mensaje si está cancelada */}
          {currentSale.sale_status === 'CANCELADA' && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-[12px] font-bold text-red-700">❌ Venta Cancelada</p>
              <p className="text-[10px] text-red-600 mt-1">El vehículo fue devuelto a estado DISPONIBLE</p>
            </div>
          )}

          {/* Botón de eliminar (siempre disponible) */}
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full h-8 text-[10px] text-gray-500 hover:text-red-600 hover:bg-red-50" 
              onClick={() => {
                if (window.confirm('⚠️ ¿Eliminar esta venta permanentemente?\n\nEsta acción NO se puede deshacer. El vehículo volverá a estado DISPONIBLE.')) {
                  deleteSaleMutation.mutate();
                }
              }}
              disabled={deleteSaleMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {deleteSaleMutation.isPending ? 'Eliminando...' : 'Eliminar Venta'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modals */}
      {showBoleto && (
        <SalesContractView 
          open={showBoleto} 
          onOpenChange={setShowBoleto} 
          sale={currentSale} 
          vehicle={vehicle} 
          client={client} 
          spouse={client?.spouse}
        />
      )}
      {showRecibo && (
        <DepositReceiptView 
          open={showRecibo} 
          onOpenChange={setShowRecibo} 
          reservation={{ ...currentSale, reservation_date: currentSale.deposit_date, deposit_amount: currentSale.deposit_amount_ars }}
          vehicle={vehicle}
          client={client}
        />
      )}
      {showEditDialog && (
        <SaleFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          existingSale={currentSale}
          vehicle={vehicle}
          onSaleCreated={(sale) => {
            // Actualizar la venta actual y refrescar queries
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sale', currentSale.id] });
            setShowEditDialog(false);
          }}
        />
      )}

      {showCompleteDataModal && (
        <CompleteBoletoDataForm
          open={showCompleteDataModal}
          onOpenChange={setShowCompleteDataModal}
          sale={currentSale}
          vehicle={vehicle}
          client={client}
          onBoletoComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sale', currentSale.id] });
            queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle?.id] });
            queryClient.invalidateQueries({ queryKey: ['client', client?.id] });
            setShowCompleteDataModal(false);
            // Después de completar datos, mostrar el boleto
            setShowBoleto(true);
          }}
        />
      )}
    </Dialog>
  );
}