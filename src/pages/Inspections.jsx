import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Car, CheckCircle, AlertTriangle, XCircle, Clock, User, Calendar, Eye, Edit, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import InspectionForm from "@/components/vehicles/InspectionForm";
import InspectionView from "@/components/vehicles/InspectionView";
import { useParams, useNavigate } from "react-router-dom";

export default function Inspections() {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showInspectionView, setShowInspectionView] = useState(false);
  const [showEditRequest, setShowEditRequest] = useState(false);
  const [editRequestNotes, setEditRequestNotes] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Solo vehículos "A PERITAR" asignados a este mecánico
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles-to-inspect'],
    queryFn: () => base44.entities.Vehicle.filter({ status: 'A PERITAR' }, '-inspection_requested_date'),
    refetchInterval: 15000,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['my-inspections'],
    queryFn: () => base44.entities.VehicleInspection.list('-inspection_date'),
    refetchInterval: 15000,
  });

  // Query para inspección específica
  const { data: specificInspection, isLoading: isLoadingInspection } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => base44.entities.VehicleInspection.get(inspectionId),
    enabled: !!inspectionId,
  });

  // Query para el vehículo de la inspección específica
  const { data: inspectionVehicle } = useQuery({
    queryKey: ['vehicle', specificInspection?.vehicle_id],
    queryFn: () => base44.entities.Vehicle.get(specificInspection.vehicle_id),
    enabled: !!specificInspection?.vehicle_id,
  });

  // Sincronizar con URL
  useEffect(() => {
    if (inspectionId && specificInspection && inspectionVehicle) {
      setSelectedInspection(specificInspection);
      setSelectedVehicle(inspectionVehicle);
      setShowInspectionView(true);
    } else if (!inspectionId) {
      setSelectedInspection(null);
      setSelectedVehicle(null);
      setShowInspectionView(false);
    }
  }, [inspectionId, specificInspection, inspectionVehicle]);

  // Filtrar solo los asignados a este mecánico (por email)
  const myVehicles = vehicles.filter(v => 
    v.assigned_mechanic_id === currentUser?.email || 
    v.assigned_mechanic_name === currentUser?.full_name
  );

  // Mostrar todos los vehículos asignados que no estén completamente aprobados y decididos
  const pendingVehicles = myVehicles.filter(v => {
    const inspection = inspections.find(i => i.vehicle_id === v.id);
    // Mostrar si:
    // - No hay peritaje
    // - Está en borrador
    // - Requiere revisión
    // - Pendiente de aprobación (mecánico espera respuesta)
    // - Aprobado pero vehículo sigue en A PERITAR (decisión pendiente)
    if (!inspection) return true;
    if (inspection.status === 'Borrador') return true;
    if (inspection.status === 'Revisión solicitada') return true;
    if (inspection.status === 'Pendiente aprobación') return true;
    // Si está aprobado pero el vehículo sigue en A PERITAR, mostrar
    if (inspection.status === 'Aprobado' && v.status === 'A PERITAR') return true;
    return false;
  });

  const getInspection = (vehicleId) => inspections.find(i => i.vehicle_id === vehicleId);

  const handleStartInspection = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedInspection(getInspection(vehicle.id));
    setShowInspectionForm(true);
  };

  const handleViewInspection = (vehicle) => {
    const inspection = getInspection(vehicle.id);
    if (inspection) {
      navigate(`/inspections/${inspection.id}`);
    }
  };

  const handleCloseInspectionView = () => {
    navigate('/Inspections');
  };

  const handleRequestEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedInspection(getInspection(vehicle.id));
    setEditRequestNotes('');
    setShowEditRequest(true);
  };

  const requestEditMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.VehicleInspection.update(selectedInspection.id, {
        status: 'Edición solicitada',
        revision_notes: editRequestNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-inspections'] });
      setIsSubmitting(false);
      setShowEditRequest(false);
      toast.success("Solicitud de edición enviada");
    },
    onError: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmitEditRequest = () => {
    if (isSubmitting || !editRequestNotes.trim()) return;
    setIsSubmitting(true);
    requestEditMutation.mutate();
  };

  const getStatusConfig = (inspection, vehicle) => {
    if (!inspection) return { color: 'bg-gray-100 text-gray-600', label: 'Pendiente', canEdit: true, canView: false, canRequestEdit: false };
    if (inspection.status === 'Borrador') return { color: 'bg-gray-100 text-gray-600', label: 'Borrador', canEdit: true, canView: false, canRequestEdit: false };
    if (inspection.status === 'Revisión solicitada') return { color: 'bg-amber-100 text-amber-700', label: 'Revisión solicitada', canEdit: true, canView: false, canRequestEdit: false };
    if (inspection.status === 'Edición solicitada') return { color: 'bg-purple-100 text-purple-700', label: 'Esperando aprobación de edición', canEdit: false, canView: true, canRequestEdit: false };
    if (inspection.status === 'Edición aprobada') return { color: 'bg-green-100 text-green-700', label: 'Edición aprobada', canEdit: true, canView: true, canRequestEdit: false };
    if (inspection.status === 'Pendiente aprobación') return { color: 'bg-blue-100 text-blue-700', label: 'Esperando respuesta', canEdit: false, canView: true, canRequestEdit: true };
    if (inspection.status === 'Aprobado' && vehicle?.status === 'A PERITAR') return { color: 'bg-green-100 text-green-700', label: 'Aprobado - Esperando decisión', canEdit: false, canView: true, canRequestEdit: true };
    if (inspection.status === 'Aprobado') return { color: 'bg-green-100 text-green-700', label: 'Aprobado', canEdit: false, canView: true, canRequestEdit: true };
    return { color: 'bg-green-100 text-green-700', label: 'Completado', canEdit: false, canView: true, canRequestEdit: false };
  };

  if (!currentUser) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Mis Peritajes
          </h1>
          <p className="text-[11px] text-gray-500 mt-1">Solicitudes de peritaje asignadas</p>
        </div>

        {/* Lista de solicitudes */}
        <div className="space-y-3">
          {loadingVehicles ? (
            <div className="text-center py-8 text-gray-500 text-[12px]">Cargando...</div>
          ) : pendingVehicles.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[13px] text-gray-500">No tenés solicitudes de peritaje pendientes</p>
              </CardContent>
            </Card>
          ) : (
            pendingVehicles.map(vehicle => {
              const inspection = getInspection(vehicle.id);
              const status = getStatusConfig(inspection, vehicle);

              return (
                <Card key={vehicle.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-bold text-[14px]">
                            {vehicle.brand} {vehicle.model} {vehicle.year}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {vehicle.plate || 'Sin dominio'} • {vehicle.kilometers?.toLocaleString('es-AR') || '-'} km
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {vehicle.inspection_requested_date ? format(new Date(vehicle.inspection_requested_date), 'dd/MM/yyyy') : '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {vehicle.inspection_requested_by || '-'}
                            </span>
                          </div>
                          {inspection?.status === 'Revisión solicitada' && inspection.revision_notes && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                              <strong>Revisión solicitada:</strong> {inspection.revision_notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${status.color} text-[10px]`}>
                          {status.label}
                        </Badge>
                        <div className="flex gap-2">
                          {status.canView && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-[11px] px-3"
                              onClick={() => handleViewInspection(vehicle)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />Ver
                            </Button>
                          )}
                          {status.canRequestEdit && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-[11px] px-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => handleRequestEdit(vehicle)}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />Solicitar edición
                            </Button>
                          )}
                          {status.canEdit && (
                            <Button 
                              size="sm" 
                              className="h-8 text-[11px] px-3 bg-cyan-600 hover:bg-cyan-700"
                              onClick={() => handleStartInspection(vehicle)}
                            >
                              <Wrench className="w-3.5 h-3.5 mr-1" />
                              {inspection?.status === 'Revisión solicitada' ? 'Revisar' : 
                               inspection?.status === 'Edición aprobada' ? 'Editar' :
                               inspection ? 'Continuar' : 'Realizar'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Inspection Form Dialog */}
      <InspectionForm
        open={showInspectionForm}
        onOpenChange={(open) => { 
          setShowInspectionForm(open); 
          if (!open) {
            setSelectedVehicle(null);
            setSelectedInspection(null);
            queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles-to-inspect'] });
          }
        }}
        vehicle={selectedVehicle}
        existingInspection={selectedInspection}
        isMechanicView={true}
      />

      {/* Inspection View Dialog */}
      {inspectionId && isLoadingInspection ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
        </div>
      ) : (
        <InspectionView 
          open={showInspectionView}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseInspectionView();
            }
          }}
          inspection={selectedInspection}
          vehicle={selectedVehicle}
          onEdit={null}
          onDelete={null}
        />
      )}

      {/* Edit Request Dialog */}
      <Dialog open={showEditRequest} onOpenChange={setShowEditRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px] flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Solicitar edición del peritaje
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-[12px]">{selectedVehicle?.brand} {selectedVehicle?.model} {selectedVehicle?.year}</p>
              <p className="text-[10px] text-gray-500">{selectedVehicle?.plate || 'Sin dominio'}</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">
                ¿Qué necesitás corregir o modificar?
              </label>
              <Textarea
                className="text-[11px]"
                placeholder="Describí qué cambios necesitás hacer..."
                value={editRequestNotes}
                onChange={(e) => setEditRequestNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="h-8 text-[11px]" onClick={() => setShowEditRequest(false)}>
                Cancelar
              </Button>
              <Button 
                className="h-8 text-[11px] bg-amber-600 hover:bg-amber-700"
                onClick={handleSubmitEditRequest}
                disabled={!editRequestNotes.trim() || isSubmitting}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}