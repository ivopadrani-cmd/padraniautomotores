import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FileText, Save, X } from "lucide-react";
import { toast } from "sonner";

const defaultClausesContent = `PRIMERA: El VENDEDOR declara ser legítimo propietario del vehículo descrito, libre de todo gravamen, embargo, prenda o inhibición.

SEGUNDA: El COMPRADOR recibe el vehículo en el estado en que se encuentra, habiendo verificado su funcionamiento, declarando su conformidad.

TERCERA: La transferencia de dominio se realizará dentro de los TREINTA (30) días corridos, siendo los gastos a cargo del COMPRADOR.

CUARTA: El VENDEDOR entregará: Título del automotor, cédula de identificación, formulario 08 firmado y certificado de dominio.

QUINTA: Las partes constituyen domicilio en los indicados, donde serán válidas todas las notificaciones.

SEXTA: Para cualquier divergencia, las partes se someten a la jurisdicción de los Tribunales Ordinarios competentes.`;

export default function ClauseTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: defaultClausesContent });

  const queryClient = useQueryClient();

  // Create default templates on first load if none exist - only run once
  const [hasCheckedTemplates, setHasCheckedTemplates] = React.useState(false);
  
  React.useEffect(() => {
    if (hasCheckedTemplates) return;
    
    const createDefaultIfNeeded = async () => {
      try {
        const existing = await base44.entities.ClauseTemplate.list();
        if (existing.length === 0) {
          await base44.entities.ClauseTemplate.create({
            name: 'Cláusulas Estándar',
            content: defaultClausesContent,
            is_default: true
          });
          await base44.entities.ClauseTemplate.create({
            name: 'Transferencia Incluida',
            content: `TERCERO – CONDICIONES DE ENTREGA: El vehículo se entrega en el estado que se encuentra, y que el COMPRADOR declara conocer y aceptar, conforme inspección previa. La entrega del mismo se efectuará exclusivamente una vez finalizada y asentada la transferencia registral correspondiente.

CUARTO – GARANTÍA Y VICIOS OCULTOS: El VENDEDOR no otorga garantía sobre el bien, salvo vicios ocultos graves no registrados ni informados al momento de la venta. No se admiten reclamos por detalles estéticos o de mantenimiento que no comprometan la seguridad o funcionamiento básico del vehículo. Para las permutas tomadas, el VENDEDOR se reserva el derecho de eventual reclamo al permutante en caso de vicios ocultos no registrados ni informados al momento de la toma.

QUINTO – GASTOS: El valor de la operación incluye comisiones, gastos de transferencia, gestoría, formularios y aranceles.

SEXTO – JURISDICCIÓN: Para cualquier diferencia que surja del presente contrato, las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Comodoro Rivadavia.`,
            is_default: false
          });
          queryClient.invalidateQueries({ queryKey: ['clause-templates'] });
        }
        setHasCheckedTemplates(true);
      } catch (err) {
        console.error('Error checking templates:', err);
        setHasCheckedTemplates(true);
      }
    };
    createDefaultIfNeeded();
  }, [hasCheckedTemplates, queryClient]);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['clause-templates'],
    queryFn: () => base44.entities.ClauseTemplate.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClauseTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clause-templates'] });
      resetForm();
      toast.success("Plantilla creada");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClauseTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clause-templates'] });
      resetForm();
      toast.success("Plantilla actualizada");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClauseTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clause-templates'] });
      toast.success("Plantilla eliminada");
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({ name: '', content: defaultClausesContent });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({ name: template.name, content: template.content });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" /> Plantillas de Cláusulas
        </CardTitle>
        <Button onClick={() => setShowForm(true)} className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800">
          <Plus className="w-3 h-3 mr-1" /> Nueva Plantilla
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="text-center py-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mx-auto" /></div>
        ) : templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map(template => (
              <div key={template.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start hover:bg-gray-100">
                <div className="flex-1">
                  <p className="font-medium text-[12px]">{template.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{template.content.substring(0, 150)}...</p>
                </div>
                <div className="flex gap-1 ml-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(template)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar plantilla?')) deleteMutation.mutate(template.id); }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-[11px]">No hay plantillas creadas</p>
            <p className="text-[10px] text-gray-400 mt-1">Crea plantillas de cláusulas para usar en los boletos de compraventa</p>
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) resetForm(); else setShowForm(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
            <DialogTitle className="text-[13px] font-semibold">{editingTemplate ? 'Editar' : 'Nueva'} Plantilla</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <Label className="text-[10px] text-gray-500 uppercase">Nombre de la plantilla</Label>
              <Input className="h-8 text-[11px] mt-1" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Cláusulas estándar, Cláusulas consignación..." required />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500 uppercase">Contenido de las cláusulas</Label>
              <Textarea 
                className="text-[10px] min-h-[300px] mt-1 font-sans" 
                value={formData.content} 
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escribir las cláusulas separadas por doble salto de línea..."
                required
              />
              <p className="text-[9px] text-gray-400 mt-1">Separa cada cláusula con una línea en blanco (doble Enter)</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={resetForm} className="h-7 text-[10px]">
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
              <Button type="submit" className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-3 h-3 mr-1" /> {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}