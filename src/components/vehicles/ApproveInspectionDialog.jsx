import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ApproveInspectionDialog({ open, onOpenChange, inspection, vehicle }) {
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const approveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VehicleInspection.update(inspection.id, {
        status: 'Aprobado',
        approved_by: currentUser?.email,
        approved_date: new Date().toISOString().split('T')[0]
      });
      // Cambiar estado del vehículo a "A INGRESAR" si se aprueba
      await base44.entities.Vehicle.update(vehicle.id, {
        status: 'A INGRESAR'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-inspections'] });
      toast.success("Peritaje aprobado. El vehículo pasó a 'A INGRESAR'");
      onOpenChange(false);
    }
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VehicleInspection.update(inspection.id, {
        status: 'Revisión solicitada',
        revision_notes: revisionNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspection', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-inspections'] });
      toast.success("Se solicitó revisión al mecánico");
      onOpenChange(false);
    }
  });

  const discardMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VehicleInspection.update(inspection.id, {
        status: 'Aprobado',
        approved_by: currentUser?.email,
        approved_date: new Date().toISOString().split('T')[0]
      });
      await base44.entities.Vehicle.update(vehicle.id, {
        status: 'DESCARTADO',
        discard_date: new Date().toISOString().split('T')[0],
        discard_reason: 'Descartado tras peritaje'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['pending-inspections'] });
      toast.success("Vehículo descartado");
      onOpenChange(false);
    }
  });

  if (!inspection) return null;

  const recConfig = {
    'TOMAR': { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    'TOMAR CON REPAROS': { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
    'NO TOMAR': { icon: XCircle, color: 'bg-red-100 text-red-700' },
  };

  const RecIcon = recConfig[inspection.recommendation]?.icon || CheckCircle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Aprobar Peritaje</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Vehicle info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold text-[13px]">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
            <p className="text-[11px] text-gray-500">{vehicle?.plate || 'Sin dominio'} • Realizado por: {inspection.inspector_name}</p>
          </div>

          {/* Recommendation */}
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Recomendación del mecánico</p>
              <Badge className={`${recConfig[inspection.recommendation]?.color} mt-1`}>
                <RecIcon className="w-3 h-3 mr-1" />
                {inspection.recommendation}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">Costo estimado</p>
              <p className="text-lg font-bold">${inspection.total_estimated_cost?.toLocaleString('es-AR') || 0}</p>
            </div>
          </div>

          {/* Observations */}
          {inspection.general_observations && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase mb-1">Observaciones</p>
              <p className="text-[11px]">{inspection.general_observations}</p>
            </div>
          )}

          {/* Revision form */}
          {showRevisionForm && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Label className="text-[11px] text-amber-700">Notas de revisión para el mecánico</Label>
              <Textarea 
                className="mt-1 text-[11px]" 
                placeholder="Indicá qué debe revisar o corregir..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setShowRevisionForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700" 
                  onClick={() => requestRevisionMutation.mutate()}
                  disabled={!revisionNotes || requestRevisionMutation.isPending}
                >
                  Enviar Revisión
                </Button>
              </div>
            </div>
          )}
        </div>

        {!showRevisionForm && (
          <div className="flex justify-between gap-2 pt-2">
            <Button 
              variant="outline" 
              className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50" 
              onClick={() => { if (window.confirm('¿Descartar este vehículo?')) discardMutation.mutate(); }}
              disabled={discardMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />Descartar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="h-8 text-[11px]" 
                onClick={() => setShowRevisionForm(true)}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />Solicitar Revisión
              </Button>
              <Button 
                className="h-8 text-[11px] bg-green-600 hover:bg-green-700" 
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Peritaje'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}