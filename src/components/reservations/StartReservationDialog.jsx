import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, FileText, Users, Plus } from "lucide-react";
import { format } from "date-fns";

export default function StartReservationDialog({ open, onOpenChange, vehicle, onStartReservation }) {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  const { data: quotes = [] } = useQuery({
    queryKey: ['vehicle-quotes', vehicle?.id],
    queryFn: () => base44.entities.Quote.filter({ vehicle_id: vehicle?.id }, '-quote_date'),
    enabled: !!vehicle?.id && open
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['vehicle-leads', vehicle?.id],
    queryFn: async () => {
      const allLeads = await base44.entities.Lead.list('-consultation_date');
      return allLeads.filter(l => 
        l.status !== 'Concretado' && 
        l.status !== 'Perdido' &&
        l.interested_vehicles?.some(v => v.vehicle_id === vehicle?.id)
      );
    },
    enabled: !!vehicle?.id && open
  });

  const handleStart = (type, data) => {
    onStartReservation({ type, quote: type === 'quote' ? data : null, lead: type === 'lead' ? data : null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Car className="w-4 h-4" />
            Iniciar Reserva
          </DialogTitle>
          <p className="text-[11px] text-gray-400 mt-1">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Nueva operación */}
          <Button 
            variant="outline" 
            className="w-full h-14 justify-start gap-3 text-left"
            onClick={() => handleStart('new', null)}
          >
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="font-semibold text-[12px]">Nueva operación</p>
              <p className="text-[10px] text-gray-500">Crear reserva desde cero</p>
            </div>
          </Button>

          {/* Desde presupuesto */}
          {quotes.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Desde Presupuesto
              </p>
              <div className="space-y-1.5">
                {quotes.slice(0, 5).map(quote => (
                  <Button
                    key={quote.id}
                    variant="outline"
                    className="w-full h-12 justify-start gap-3 text-left"
                    onClick={() => handleStart('quote', quote)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[11px]">{quote.client_name}</p>
                      <p className="text-[9px] text-gray-500">
                        ${quote.quoted_price_ars?.toLocaleString('es-AR')} • {format(new Date(quote.quote_date), 'dd/MM/yy')}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Desde consulta */}
          {leads.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Desde Consulta
              </p>
              <div className="space-y-1.5">
                {leads.slice(0, 5).map(lead => (
                  <Button
                    key={lead.id}
                    variant="outline"
                    className="w-full h-12 justify-start gap-3 text-left"
                    onClick={() => handleStart('lead', lead)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[11px]">{lead.client_name}</p>
                      <p className="text-[9px] text-gray-500">
                        {lead.client_phone} • {format(new Date(lead.consultation_date), 'dd/MM/yy')}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}