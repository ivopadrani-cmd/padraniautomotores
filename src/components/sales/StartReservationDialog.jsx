import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Users, Plus, Car, ChevronRight, Star, Receipt } from "lucide-react";
import { format } from "date-fns";

export default function StartReservationDialog({ open, onOpenChange, vehicle, onStartReservation }) {
  const [mode, setMode] = useState(null);
  const [search, setSearch] = useState('');

  const { data: quotes = [] } = useQuery({ 
    queryKey: ['all-quotes'], 
    queryFn: () => base44.entities.Quote.list('-quote_date'),
    enabled: open 
  });

  const { data: leads = [] } = useQuery({ 
    queryKey: ['all-leads'], 
    queryFn: () => base44.entities.Lead.list('-consultation_date'),
    enabled: open 
  });

  const { data: vehicles = [] } = useQuery({ 
    queryKey: ['vehicles'], 
    queryFn: () => base44.entities.Vehicle.list(),
    enabled: open 
  });

  const filteredQuotes = quotes.filter(q => {
    if (vehicle && q.vehicle_id !== vehicle.id) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return q.client_name?.toLowerCase().includes(s) || q.vehicle_description?.toLowerCase().includes(s);
  });

  const filteredLeads = leads.filter(l => {
    if (l.status === 'Concretado' || l.status === 'Perdido') return false;
    if (vehicle) {
      const hasVehicle = l.interested_vehicles?.some(v => v.vehicle_id === vehicle.id);
      if (!hasVehicle) return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return l.client_name?.toLowerCase().includes(s) || l.client_phone?.includes(s);
  });

  const handleSelectQuote = (quote) => {
    const v = vehicles.find(x => x.id === quote.vehicle_id);
    onStartReservation({
      type: 'quote',
      vehicle: v || vehicle,
      quote,
      client_id: quote.client_id,
      client_name: quote.client_name,
      client_phone: quote.client_phone,
      agreed_price: quote.quoted_price_ars,
      trade_in: quote.trade_in,
      financing_amount: quote.financing_amount,
      financing_bank: quote.financing_bank,
      financing_installments: quote.financing_installments,
      financing_installment_value: quote.financing_installment_value
    });
    resetAndClose();
  };

  const handleSelectLead = (lead) => {
    const interestedVehicles = lead.interested_vehicles || [];
    const vehiclesInLead = vehicle ? [vehicle] : interestedVehicles.map(iv => vehicles.find(v => v.id === iv.vehicle_id)).filter(Boolean);

    onStartReservation({
      type: 'lead',
      vehicle: vehiclesInLead.length === 1 ? vehiclesInLead[0] : vehicle,
      lead,
      client_id: lead.client_id,
      client_name: lead.client_name,
      client_phone: lead.client_phone
    });
    resetAndClose();
  };

  const handleNewOperation = () => {
    onStartReservation({ type: 'new', vehicle, quote: null, lead: null });
    resetAndClose();
  };

  const resetAndClose = () => {
    setMode(null);
    setSearch('');
    onOpenChange(false);
  };

  // Prioritize quotes over leads - more complete data
  const suggestedOption = useMemo(() => {
    const vehicleQuote = filteredQuotes[0];
    const vehicleLead = filteredLeads[0];
    if (!vehicleQuote && !vehicleLead) return null;
    // Always prioritize quotes
    if (vehicleQuote) return { type: 'quote', data: vehicleQuote };
    return { type: 'lead', data: vehicleLead };
  }, [filteredQuotes, filteredLeads]);

  const inp = "h-8 text-[11px] bg-white";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else onOpenChange(o); }}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Nueva Reserva
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {vehicle && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4 flex items-center gap-3">
              <Car className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-semibold text-[12px]">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
                <p className="text-[10px] text-gray-500">{vehicle.plate}</p>
              </div>
            </div>
          )}

          {!mode && (
            <div className="space-y-3">
              <Button variant="outline" className="w-full h-12 justify-between text-left" onClick={handleNewOperation}>
                <div className="flex items-center gap-3">
                  <Plus className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-[11px]">Nueva reserva</p>
                    <p className="text-[9px] text-gray-500">Sin datos previos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>

              {suggestedOption && (
                <div className="pt-2 border-t">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-yellow-500" /> Sugerido
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-between text-left border-cyan-300 bg-cyan-50 hover:bg-cyan-100"
                    onClick={() => suggestedOption.type === 'quote' ? handleSelectQuote(suggestedOption.data) : handleSelectLead(suggestedOption.data)}
                  >
                    <div className="flex items-center gap-3">
                      {suggestedOption.type === 'quote' ? <FileText className="w-5 h-5 text-cyan-600" /> : <Users className="w-5 h-5 text-purple-600" />}
                      <div>
                        <p className="font-medium text-[11px]">{suggestedOption.data.client_name}</p>
                        <p className="text-[9px] text-gray-500">
                          {suggestedOption.type === 'quote' 
                            ? `$${suggestedOption.data.quoted_price_ars?.toLocaleString('es-AR')} • ${format(new Date(suggestedOption.data.quote_date), 'dd/MM/yy')}`
                            : `${suggestedOption.data.client_phone} • ${format(new Date(suggestedOption.data.consultation_date), 'dd/MM/yy')}`}
                        </p>
                      </div>
                    </div>
                    <Badge className="text-[8px] bg-cyan-600 text-white">{suggestedOption.type === 'quote' ? 'Presupuesto' : 'Consulta'}</Badge>
                  </Button>
                </div>
              )}

              <div className="pt-2 border-t space-y-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">O continuar desde:</p>
                <Button variant="outline" className="w-full h-12 justify-between text-left" onClick={() => setMode('quote')}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    <div>
                      <p className="font-semibold text-[11px]">Presupuesto existente</p>
                      <p className="text-[9px] text-gray-500">{filteredQuotes.length} disponibles</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="outline" className="w-full h-12 justify-between text-left" onClick={() => setMode('lead')}>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-semibold text-[11px]">Consulta existente</p>
                      <p className="text-[9px] text-gray-500">{filteredLeads.length} disponibles</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>
          )}

          {mode === 'quote' && (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] mb-2" onClick={() => setMode(null)}>← Volver</Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input className={`${inp} pl-8`} placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredQuotes.length > 0 ? filteredQuotes.map(q => (
                  <div key={q.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectQuote(q)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[11px]">{q.client_name}</p>
                        <p className="text-[10px] text-gray-500">{q.vehicle_description}</p>
                      </div>
                      <p className="font-bold text-[12px]">${q.quoted_price_ars?.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                )) : <p className="text-center text-[11px] text-gray-400 py-4">Sin presupuestos</p>}
              </div>
            </div>
          )}

          {mode === 'lead' && (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] mb-2" onClick={() => setMode(null)}>← Volver</Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input className={`${inp} pl-8`} placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredLeads.length > 0 ? filteredLeads.map(l => (
                  <div key={l.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectLead(l)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[11px]">{l.client_name}</p>
                        <p className="text-[10px] text-gray-500">{l.client_phone}</p>
                      </div>
                      <Badge className="text-[9px] bg-gray-200 text-gray-700">{l.status}</Badge>
                    </div>
                  </div>
                )) : <p className="text-center text-[11px] text-gray-400 py-4">Sin consultas</p>}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}