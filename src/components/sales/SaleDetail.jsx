import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, User, DollarSign, FileText, CheckCircle, Upload, Download, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_CONFIG = {
  PENDIENTE: 'bg-gray-200 text-gray-700',
  CONFIRMADA: 'bg-cyan-100 text-cyan-700',
  ENTREGADA: 'bg-gray-300 text-gray-700',
  FINALIZADA: 'bg-gray-900 text-white',
  CANCELADA: 'bg-red-100 text-red-700'
};

export default function SaleDetail({ sale, onClose }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ['client', sale.client_id],
    queryFn: () => base44.entities.Client.list().then(clients => clients.find(c => c.id === sale.client_id)),
    enabled: !!sale.client_id
  });

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', sale.vehicle_id],
    queryFn: () => base44.entities.Vehicle.list().then(vehicles => vehicles.find(v => v.id === sale.vehicle_id)),
    enabled: !!sale.vehicle_id
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

  const updateDocsMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Sale.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); toast.success("Documentos actualizados"); },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = await Promise.all(files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return { url: file_url, name: file.name, date: new Date().toISOString().split('T')[0] };
    }));
    await updateDocsMutation.mutateAsync({ id: sale.id, data: { documents: [...(sale.documents || []), ...uploaded] } });
    setUploading(false);
    e.target.value = null;
  };

  const handleRemoveDoc = async (index) => {
    if (!window.confirm('¿Eliminar documento?')) return;
    await updateDocsMutation.mutateAsync({ id: sale.id, data: { documents: sale.documents.filter((_, i) => i !== index) } });
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-semibold">Venta</DialogTitle>
          <Badge className={`${STATUS_CONFIG[sale.sale_status]} text-[10px]`}>{sale.sale_status}</Badge>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Vehicle */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><Car className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">VEHÍCULO</span></div>
            <p className="font-bold">{sale.vehicle_description}</p>
          </div>

          {/* Client */}
          <div>
            <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">CLIENTE</span></div>
            <p className="font-semibold">{sale.client_name}</p>
            {client?.phone && <p className="text-[11px] text-gray-500">{client.phone}</p>}
            {sale.seller && <p className="text-[10px] text-gray-400 mt-1">Vendedor: {sale.seller}</p>}
          </div>

          {/* Sale Price */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">PRECIO DE VENTA</span></div>
            <p className="text-2xl font-bold">${sale.sale_price_ars?.toLocaleString('es-AR')}</p>
          </div>

          {/* Deposit */}
          {sale.deposit_amount_ars > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-[10px] font-medium text-gray-500 mb-1">SEÑA</div>
              <div className="flex justify-between items-center">
                <p className="font-bold">${sale.deposit_amount_ars?.toLocaleString('es-AR')}</p>
                <p className="text-[11px] text-gray-500">{sale.deposit_date && format(new Date(sale.deposit_date), 'dd/MM/yy')}</p>
              </div>
            </div>
          )}

          {/* Trade Ins */}
          {sale.trade_ins?.map((ti, i) => (
            <div key={i} className="p-3 border border-dashed rounded-lg">
              <div className="text-[10px] font-medium text-gray-500 mb-1">PERMUTA</div>
              <p className="font-semibold">{ti.brand} {ti.model} {ti.year}</p>
              <p className="text-[11px] text-gray-500">{ti.plate} • {ti.kilometers?.toLocaleString('es-AR')} km</p>
              <p className="font-bold text-cyan-600 mt-1">${ti.value_ars?.toLocaleString('es-AR')}</p>
            </div>
          ))}

          {/* Financing */}
          {sale.financing_amount_ars > 0 && (
            <div className="p-3 border rounded-lg">
              <div className="text-[10px] font-medium text-gray-500 mb-1">FINANCIACIÓN</div>
              <p className="font-bold">${sale.financing_amount_ars?.toLocaleString('es-AR')}</p>
              <p className="text-[11px] text-gray-500">{sale.financing_bank} • {sale.financing_installments} cuotas</p>
            </div>
          )}

          {/* Documents */}
          <div className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-medium text-gray-500">DOCUMENTOS ({sale.documents?.length || 0})</span></div>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" disabled={uploading}><Upload className="w-3 h-3 mr-1" />{uploading ? 'Subiendo...' : 'Adjuntar'}</Button>
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {sale.documents?.length > 0 ? (
              <div className="space-y-1">
                {sale.documents.map((doc, i) => (
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
          <div className="text-[10px] text-gray-400">Venta del {format(new Date(sale.sale_date), 'dd/MM/yyyy')}</div>
          {sale.observations && <div className="text-[11px] p-2 bg-gray-50 rounded">{sale.observations}</div>}

          {/* Actions */}
          {sale.sale_status !== 'FINALIZADA' && sale.sale_status !== 'CANCELADA' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button className="flex-1 h-8 text-[11px] bg-gray-900 hover:bg-gray-800" onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}>
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />{finalizeMutation.isPending ? 'Finalizando...' : 'Finalizar Venta'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}