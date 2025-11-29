import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Users, Plus, Car, ChevronRight, Star } from "lucide-react";
import { format } from "date-fns";

export default function StartQuoteDialog({ open, onOpenChange, vehicle, onStartQuote }) {
  const [mode, setMode] = useState(null);
  const [search, setSearch] = useState('');

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

  // Filter leads that have this vehicle in interested_vehicles or match search
  const filteredLeads = leads.filter(l => {
    if (l.status === 'Concretado' || l.status === 'Perdido') return false;
    if (vehicle) {
      const hasVehicle = l.interested_vehicles?.some(v => v.vehicle_id === vehicle.id);
      if (!hasVehicle) return false;
    }
    if (!search) return true;
    const s = search.toLowerCase();
    return l.client_name?.toLowerCase().includes(s) || 
           l.client_phone?.includes(s);
  });

  const handleSelectLead = (lead) => {
    // If vehicle is already set, use it
    if (vehicle) {
      onStartQuote({ vehicle, lead, client_id: lead.client_id, client_name: lead.client_name, client_phone: lead.client_phone });
      resetAndClose();
      return;
    }

    // If lead has vehicles, need to choose
    const interestedVehicles = lead.interested_vehicles || [];
    const vehiclesInLead = interestedVehicles.map(iv => vehicles.find(v => v.id === iv.vehicle_id)).filter(Boolean);

    if (vehiclesInLead.length === 1) {
      onStartQuote({ vehicle: vehiclesInLead[0], lead, client_id: lead.client_id, client_name: lead.client_name, client_phone: lead.client_phone });
      resetAndClose();
    } else if (vehiclesInLead.length > 1) {
      setSelectedLead(lead);
      setMode('choose-vehicle');
    } else {
      // No vehicles in lead, just pass lead data
      onStartQuote({ vehicle: null, lead, client_id: lead.client_id, client_name: lead.client_name, client_phone: lead.client_phone });
      resetAndClose();
    }
  };

  const [selectedLead, setSelectedLead] = useState(null);

  const handleSelectVehicleFromLead = (v) => {
    onStartQuote({ vehicle: v, lead: selectedLead, client_id: selectedLead.client_id, client_name: selectedLead.client_name, client_phone: selectedLead.client_phone });
    resetAndClose();
  };

  const handleNewOperation = () => {
    onStartQuote({ vehicle, lead: null });
    resetAndClose();
  };

  const resetAndClose = () => {
    setMode(null);
    setSearch('');
    setSelectedLead(null);
    onOpenChange(false);
  };

  // Get suggested option (most recent lead for this vehicle)
  const suggestedLead = useMemo(() => {
    return filteredLeads[0] || null;
  }, [filteredLeads]);

  const inp = "h-8 text-[11px] bg-white";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else onOpenChange(o); }}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Nuevo Presupuesto
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
              {/* New quote button */}
              <Button 
                variant="outline" 
                className="w-full h-12 justify-between text-left" 
                onClick={handleNewOperation}
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-[11px]">Nuevo presupuesto</p>
                    <p className="text-[9px] text-gray-500">Crear sin datos previos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Button>

              {/* Suggested option */}
              {suggestedLead && (
                <div className="pt-2 border-t">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-yellow-500" /> Sugerido
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-between text-left border-cyan-300 bg-cyan-50 hover:bg-cyan-100"
                    onClick={() => handleSelectLead(suggestedLead)}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-[11px]">{suggestedLead.client_name}</p>
                        <p className="text-[9px] text-gray-500">
                          {suggestedLead.client_phone} • {format(new Date(suggestedLead.consultation_date), 'dd/MM/yy')}
                        </p>
                      </div>
                    </div>
                    <Badge className="text-[8px] bg-purple-600 text-white">Consulta</Badge>
                  </Button>
                </div>
              )}

              {/* From lead option */}
              {filteredLeads.length > 0 && (
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 justify-between text-left" 
                    onClick={() => setMode('lead')}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-semibold text-[11px]">Desde consulta existente</p>
                        <p className="text-[9px] text-gray-500">{filteredLeads.length} consultas disponibles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {mode === 'lead' && (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] mb-2" onClick={() => setMode(null)}>
                ← Volver
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input className={`${inp} pl-8`} placeholder="Buscar por cliente o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredLeads.length > 0 ? filteredLeads.map(l => (
                  <div 
                    key={l.id} 
                    className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectLead(l)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[11px]">{l.client_name}</p>
                        <p className="text-[10px] text-gray-500">{l.client_phone}</p>
                        <p className="text-[9px] text-gray-400">{l.interested_vehicles?.length || 0} vehículos de interés</p>
                      </div>
                      <Badge className={`text-[9px] ${l.status === 'Nuevo' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-200 text-gray-700'}`}>{l.status}</Badge>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-[11px] text-gray-400 py-4">Sin consultas</p>
                )}
              </div>
            </div>
          )}

          {mode === 'choose-vehicle' && selectedLead && (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" className="h-7 text-[10px] mb-2" onClick={() => { setMode('lead'); setSelectedLead(null); }}>
                ← Volver
              </Button>
              <p className="text-[11px] text-gray-600 mb-2">Selecciona el vehículo a presupuestar:</p>
              <div className="space-y-1">
                {selectedLead.interested_vehicles?.map(iv => {
                  const v = vehicles.find(x => x.id === iv.vehicle_id);
                  if (!v) return null;
                  return (
                    <div 
                      key={v.id}
                      className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      onClick={() => handleSelectVehicleFromLead(v)}
                    >
                      <div>
                        <p className="font-medium text-[11px]">{v.brand} {v.model} {v.year}</p>
                        <p className="text-[10px] text-gray-500">{v.plate}</p>
                      </div>
                      <p className="font-bold text-[12px]">${v.public_price_value?.toLocaleString('es-AR')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}