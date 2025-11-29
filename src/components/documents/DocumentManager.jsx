import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";
import DocumentEditor from "./DocumentEditor";
import { toast } from "sonner";

const documentTypeColors = {
  'Boleto Compraventa': 'bg-blue-100 text-blue-800',
  'Recibo de Seña': 'bg-green-100 text-green-800',
  'Remito de Entrega': 'bg-purple-100 text-purple-800',
  'Presupuesto': 'bg-yellow-100 text-yellow-800',
  'Contrato Consignación': 'bg-orange-100 text-orange-800'
};

export default function DocumentManager({ 
  saleId, 
  vehicleId, 
  clientId, 
  leadId,
  allowedTypes = ['Boleto Compraventa', 'Recibo de Seña', 'Remito de Entrega'],
  title = "Documentos"
}) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [editingDocument, setEditingDocument] = useState(null);
  const [generating, setGenerating] = useState(false);

  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', { saleId, vehicleId, clientId, leadId }],
    queryFn: async () => {
      const allDocs = await base44.entities.Document.list('-document_date');
      return allDocs.filter(doc => 
        (saleId && doc.sale_id === saleId) ||
        (vehicleId && doc.vehicle_id === vehicleId) ||
        (clientId && doc.client_id === clientId) ||
        (leadId && doc.lead_id === leadId)
      );
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => base44.entities.DocumentTemplate.list(),
  });

  const { data: sale } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => base44.entities.Sale.list().then(sales => sales.find(s => s.id === saleId)),
    enabled: !!saleId
  });

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => base44.entities.Vehicle.list().then(vehicles => vehicles.find(v => v.id === vehicleId)),
    enabled: !!vehicleId
  });

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => base44.entities.Client.list().then(clients => clients.find(c => c.id === clientId)),
    enabled: !!clientId
  });

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.list().then(leads => leads.find(l => l.id === leadId)),
    enabled: !!leadId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Documento eliminado");
    },
  });

  const handleDelete = (docId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(docId);
    }
  };

  const handleCreateDocument = () => {
    setShowTemplateSelector(true);
  };

  const generateDocument = async () => {
    if (!selectedTemplateId) {
      toast.error("Selecciona una plantilla");
      return;
    }

    setGenerating(true);
    setShowTemplateSelector(false);

    try {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) {
        toast.error("Plantilla no encontrada");
        return;
      }

      const newDoc = {
        document_type: template.template_type,
        document_name: `${template.template_name} - ${new Date().toLocaleDateString('es-AR')}`,
        document_content: template.template_content,
        document_date: new Date().toISOString().split('T')[0],
        status: 'Borrador',
        sale_id: saleId || '',
        vehicle_id: vehicleId || '',
        client_id: clientId || '',
        lead_id: leadId || '',
        template_id: template.id
      };

      const created = await base44.entities.Document.create(newDoc);
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDocument(created);
      toast.success("Documento creado");
      setSelectedTemplateId('');
    } catch (error) {
      toast.error("Error al crear documento");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredTemplates = templates.filter(t => allowedTypes.includes(t.template_type));

  if (editingDocument) {
    return (
      <DocumentEditor
        document={editingDocument}
        sale={sale}
        vehicle={vehicle}
        client={client}
        lead={lead}
        onClose={() => {
          setEditingDocument(null);
          queryClient.invalidateQueries({ queryKey: ['documents'] });
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{title}</h3>
        <Button onClick={handleCreateDocument} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Crear Documento
        </Button>
      </div>

      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Plantilla</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.length === 0 ? (
                    <SelectItem value="none" disabled>No hay plantillas disponibles</SelectItem>
                  ) : (
                    filteredTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name} {template.is_default && '(Por defecto)'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowTemplateSelector(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={generateDocument} 
                disabled={!selectedTemplateId || generating || filteredTemplates.length === 0}
              >
                {generating ? 'Generando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay documentos creados</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={documentTypeColors[doc.document_type]}>
                        {doc.document_type}
                      </Badge>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                    <p className="font-semibold">{doc.document_name}</p>
                    <p className="text-sm text-gray-500">
                      {doc.document_date && new Date(doc.document_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingDocument(doc)}
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}