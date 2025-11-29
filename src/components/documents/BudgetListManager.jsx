import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, User, Car, ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import DocumentEditor from "./DocumentEditor";
import ClientDetail from "../clients/ClientDetail";
import VehicleView from "../vehicles/VehicleView";
import { toast } from "sonner";

function BudgetDetail({ budget, vehicle, client, onClose, onEdit, onDelete, onViewDocument, onClientClick, onVehicleClick }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Lista
        </Button>
        <div className="flex gap-3">
          <Button onClick={() => onViewDocument(budget)} className="bg-blue-600 hover:bg-blue-700">
            <Eye className="w-4 h-4 mr-2" />
            Ver Documento
          </Button>
          <Button variant="outline" className="border-red-200 text-red-600" onClick={() => onDelete(budget.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-gray-100 p-6">
          <div>
            <CardTitle className="text-2xl mb-2">{budget.document_name}</CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">Presupuesto</Badge>
              <Badge variant="outline">{budget.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-semibold text-lg">
              {budget.document_date && format(new Date(budget.document_date), 'dd/MM/yyyy')}
            </p>
          </div>

          {client && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Cliente</p>
              <Card 
                className="bg-purple-50 border-purple-200 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onClientClick(client)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <p className="font-semibold text-lg">{client.full_name}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">📞 {client.phone}</p>
                    {client.email && <p className="text-gray-700">✉️ {client.email}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {vehicle && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Vehículo</p>
              <Card 
                className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onVehicleClick(vehicle)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-lg">
                      {vehicle.brand} {vehicle.model} {vehicle.year}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">Dominio: {vehicle.plate}</p>
                    <p className="text-gray-700">KM: {vehicle.kilometers?.toLocaleString('es-AR')}</p>
                    <p className="text-gray-700 font-bold text-lg mt-2">
                      Precio: ${vehicle.price_ars?.toLocaleString('es-AR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BudgetListManager({ vehicleId, onClose }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['vehicle-budgets', vehicleId],
    queryFn: async () => {
      const allDocs = await base44.entities.Document.list('-document_date');
      return allDocs.filter(d => d.document_type === 'Presupuesto' && d.vehicle_id === vehicleId);
    },
  });

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => base44.entities.Vehicle.list().then(vehicles => vehicles.find(v => v.id === vehicleId)),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['budget-templates'],
    queryFn: async () => {
      const allTemplates = await base44.entities.DocumentTemplate.list();
      return allTemplates.filter(t => t.template_type === 'Presupuesto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-budgets'] });
      setSelectedBudget(null);
      toast.success("Presupuesto eliminado");
    },
  });

  const handleCreateBudget = async () => {
    if (!selectedTemplateId) {
      toast.error("Selecciona una plantilla");
      return;
    }

    setGenerating(true);
    try {
      const template = templates.find(t => t.id === selectedTemplateId);
      const client = clients.find(c => c.id === selectedClientId);

      const newDoc = {
        document_type: 'Presupuesto',
        document_name: `Presupuesto - ${vehicle?.brand || ''} ${vehicle?.model || ''} - ${client?.full_name || 'Sin cliente'} - ${new Date().toLocaleDateString('es-AR')}`,
        document_content: template.template_content,
        document_date: new Date().toISOString().split('T')[0],
        status: 'Borrador',
        vehicle_id: vehicleId,
        client_id: selectedClientId || '',
        template_id: template.id
      };

      await base44.entities.Document.create(newDoc);
      await queryClient.invalidateQueries({ queryKey: ['vehicle-budgets'] });
      setShowCreateDialog(false);
      setSelectedClientId('');
      setSelectedTemplateId('');
      toast.success("Presupuesto creado");
    } catch (error) {
      toast.error("Error al crear presupuesto");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (budgetId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
      deleteMutation.mutate(budgetId);
    }
  };

  if (selectedClient) {
    return <ClientDetail client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={() => {}} />;
  }

  if (selectedVehicle) {
    return <VehicleView vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onEdit={() => {}} />;
  }

  if (editingDocument) {
    const client = clients.find(c => c.id === editingDocument.client_id);
    return (
      <DocumentEditor
        document={editingDocument}
        vehicle={vehicle}
        client={client}
        onClose={() => {
          setEditingDocument(null);
          queryClient.invalidateQueries({ queryKey: ['vehicle-budgets'] });
        }}
      />
    );
  }

  if (selectedBudget) {
    const client = clients.find(c => c.id === selectedBudget.client_id);
    return (
      <BudgetDetail
        budget={selectedBudget}
        vehicle={vehicle}
        client={client}
        onClose={() => setSelectedBudget(null)}
        onViewDocument={(budget) => {
          setEditingDocument(budget);
          setSelectedBudget(null);
        }}
        onDelete={handleDelete}
        onClientClick={setSelectedClient}
        onVehicleClick={setSelectedVehicle}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Presupuestos - {vehicle?.brand} {vehicle?.model}</h3>
          <p className="text-gray-500 text-sm mt-1">{budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''} generado{budgets.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Presupuesto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sin cliente</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plantilla *</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name} {template.is_default && '(Por defecto)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateBudget}
                disabled={!selectedTemplateId || generating}
              >
                {generating ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : budgets.length > 0 ? (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const client = clients.find(c => c.id === budget.client_id);
            
            return (
              <Card 
                key={budget.id} 
                className="hover:shadow-lg transition-all border border-gray-200 cursor-pointer"
                onClick={() => setSelectedBudget(budget)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">Presupuesto</Badge>
                        <Badge variant="outline">{budget.status}</Badge>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{budget.document_name}</p>
                        <p className="text-sm text-gray-500">
                          {budget.document_date && format(new Date(budget.document_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      {client && (
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{client.full_name}</span>
                          <span className="text-gray-500">• {client.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBudget(budget)}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDocument(budget)}
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No hay presupuestos para este vehículo</p>
            <p className="text-sm text-gray-400 mt-2">Crea uno nuevo haciendo clic en el botón "Nuevo Presupuesto"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}