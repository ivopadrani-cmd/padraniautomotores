import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wrench, Send } from "lucide-react";
import { toast } from "sonner";

export default function RequestInspectionDialog({ open, onOpenChange, vehicle }) {
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: sellers = [] } = useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const allSellers = await base44.entities.Seller.list();
      return allSellers.filter(s => s.role === 'Mecánico' && s.is_active !== false);
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const mechanic = sellers.find(s => s.id === selectedMechanic);
      await base44.entities.Vehicle.update(vehicle.id, {
        status: 'A PERITAR',
        assigned_mechanic_id: mechanic?.email || selectedMechanic,
        assigned_mechanic_name: mechanic?.full_name || '',
        inspection_requested_by: currentUser?.email || '',
        inspection_requested_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
      toast.success("Solicitud de peritaje enviada al mecánico");
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[14px] flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Solicitar Peritaje
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold text-[13px]">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
            <p className="text-[11px] text-gray-500">{vehicle?.plate || 'Sin dominio'}</p>
          </div>

          <div>
            <Label className="text-[11px]">Asignar mecánico</Label>
            <Select value={selectedMechanic} onValueChange={setSelectedMechanic}>
              <SelectTrigger className="h-9 text-[12px] mt-1">
                <SelectValue placeholder="Seleccionar mecánico..." />
              </SelectTrigger>
              <SelectContent>
                {sellers.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-[12px]">
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sellers.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">
                No hay mecánicos registrados. Agregá uno en Agencia → Usuarios con rol "Mecánico".
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 text-[11px]" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700" 
            onClick={() => requestMutation.mutate()}
            disabled={!selectedMechanic || requestMutation.isPending}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {requestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}