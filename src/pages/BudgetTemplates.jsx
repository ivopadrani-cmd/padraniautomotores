
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, ArrowLeft, Save } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from "sonner";

const availableVariables = [
  { key: '{{logo_url}}', description: 'URL del logo de la empresa' },
  { key: '{{cliente_nombre}}', description: 'Nombre del cliente' },
  { key: '{{cliente_telefono}}', description: 'Teléfono del cliente' },
  { key: '{{cliente_email}}', description: 'Email del cliente' },
  { key: '{{vehiculo1_marca}}', description: 'Marca del vehículo 1' },
  { key: '{{vehiculo1_modelo}}', description: 'Modelo del vehículo 1' },
  { key: '{{vehiculo1_anio}}', description: 'Año del vehículo 1' },
  { key: '{{vehiculo1_dominio}}', description: 'Dominio del vehículo 1' },
  { key: '{{vehiculo1_precio}}', description: 'Precio del vehículo 1' },
  { key: '{{vehiculo1_kilometros}}', description: 'Kilometraje del vehículo 1' },
  { key: '{{vehiculo2_*}}', description: 'Variables para vehículo 2' },
  { key: '{{vehiculo3_*}}', description: 'Variables para vehículo 3' },
  { key: '{{fecha}}', description: 'Fecha actual' },
];

const defaultTemplate = `
<div style="max-width: 800px; margin: 0 auto; padding: 0; font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden;">
  
  <div style="text-align: center; padding: 40px 40px 30px; background: rgba(255,255,255,0.95);">
    <img src="{{logo_url}}" alt="Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));" />
    <h1 style="font-size: 42px; font-weight: 900; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1px;">PRESUPUESTO</h1>
    <div style="width: 80px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px;"></div>
    <p style="font-size: 16px; color: #666; margin: 10px 0 0;">Padrani Automotores</p>
  </div>

  <div style="padding: 40px; background: white;">
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 35px; padding: 25px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
      <div style="flex: 1;">
        <p style="margin: 0; font-size: 13px; color: #7c3aed; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Cliente</p>
        <p style="margin: 8px 0 0; font-size: 22px; color: #1e293b; font-weight: 700;">{{cliente_nombre}}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 13px; color: #7c3aed; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Fecha</p>
        <p style="margin: 8px 0 0; font-size: 18px; color: #1e293b; font-weight: 600;">{{fecha}}</p>
      </div>
    </div>

    <div style="display: flex; gap: 15px; margin-bottom: 20px; font-size: 14px;">
      <div style="flex: 1; padding: 12px 15px; background: #fef3c7; border-radius: 10px;">
        <span style="color: #92400e;">📞</span> <strong>Tel:</strong> {{cliente_telefono}}
      </div>
      <div style="flex: 1; padding: 12px 15px; background: #dbeafe; border-radius: 10px;">
        <span>✉️</span> <strong>Email:</strong> {{cliente_email}}
      </div>
    </div>

    <div style="margin: 35px 0; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); position: relative; overflow: hidden;">
      <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
      
      <div style="position: relative; z-index: 2;">
        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">🚗 Vehículo Destacado</p>
        <h2 style="margin: 10px 0 5px; font-size: 32px; color: white; font-weight: 900; text-shadow: 2px 2px 10px rgba(0,0,0,0.2);">
          {{vehiculo1_marca}} {{vehiculo1_modelo}}
        </h2>
        <p style="margin: 0 0 20px; font-size: 18px; color: rgba(255,255,255,0.95); font-weight: 500;">
          {{vehiculo1_anio}} • {{vehiculo1_dominio}} • {{vehiculo1_kilometros}} km
        </p>
        
        <div style="padding: 20px; background: rgba(255,255,255,0.95); border-radius: 15px; margin-top: 20px;">
          <p style="margin: 0; font-size: 15px; color: #667eea; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Precio Especial</p>
          <p style="margin: 8px 0 0; font-size: 42px; color: #1e293b; font-weight: 900; letter-spacing: -2px;">
            {{vehiculo1_precio}}
          </p>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 15px; margin-top: 30px; border-left: 5px solid #f59e0b;">
      <p style="margin: 0; font-size: 15px; color: #92400e; line-height: 1.7;">
        <strong style="display: block; margin-bottom: 10px; font-size: 17px;">✨ Condiciones del Presupuesto</strong>
        • Válido por 7 días desde la fecha de emisión<br/>
        • Precios sujetos a disponibilidad del vehículo<br/>
        • Consulte por financiación y planes de pago<br/>
        • Entrega con documentación al día<br/>
        • Incluye test drive sin compromiso
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 25px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">Padrani Automotores</p>
    <p style="margin: 0; font-size: 13px; opacity: 0.9;">
      📍 Namuncurá 283, Comodoro Rivadavia<br/>
      📞 WhatsApp: 2974142904 | ✉️ juancarlospadrani@hotmail.com
    </p>
  </div>
</div>
`;

export default function BudgetTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'Presupuesto',
    template_content: defaultTemplate,
    is_default: false,
    logo_url: ''
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['budget-templates'],
    queryFn: async () => {
      const all = await base44.entities.DocumentTemplate.list();
      return all.filter(t => t.template_type === 'Presupuesto');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      setShowForm(false);
      resetForm();
      toast.success("Plantilla creada");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      toast.success("Plantilla actualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-templates'] });
      toast.success("Plantilla eliminada");
    },
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      template_type: 'Presupuesto',
      template_content: defaultTemplate,
      is_default: false,
      logo_url: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      deleteMutation.mutate(id);
    }
  };

  if (showForm) {
    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" onClick={() => { setShowForm(false); setEditingTemplate(null); resetForm(); }} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <form onSubmit={handleSubmit}>
            <Card className="border-none shadow-lg mb-6">
              <CardHeader className="border-b border-gray-100 p-6">
                <CardTitle>{editingTemplate ? 'Editar' : 'Nueva'} Plantilla de Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label>Nombre de la Plantilla</Label>
                  <Input
                    value={formData.template_name}
                    onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL del Logo (para el encabezado)</Label>
                  <Input
                    type="url"
                    value={formData.logo_url || ''}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  <p className="text-xs text-gray-500">Puedes subir tu logo a un servicio como Imgur y pegar aquí la URL</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                  />
                  <Label htmlFor="is_default" className="cursor-pointer">
                    Establecer como plantilla por defecto
                  </Label>
                </div>

                <div>
                  <Label>Contenido de la Plantilla</Label>
                  <p className="text-sm text-gray-500 mb-2">Usa vehiculo2_*, vehiculo3_*, etc. para agregar más vehículos</p>
                  <ReactQuill
                    value={formData.template_content}
                    onChange={(value) => setFormData({...formData, template_content: value})}
                    className="bg-white mt-2"
                    style={{ height: '400px', marginBottom: '60px' }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-gray-100 p-6">
                <CardTitle className="text-lg">Variables Disponibles</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Usa tantos vehículos como necesites: vehiculo1_*, vehiculo2_*, vehiculo3_*, etc.
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  {availableVariables.map((variable) => (
                    <div key={variable.key} className="p-3 bg-gray-50 rounded-lg">
                      <code className="text-sm font-mono text-blue-600">{variable.key}</code>
                      <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingTemplate(null); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar Plantilla'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Presupuesto</h1>
            <p className="text-gray-500 mt-1">Diseños profesionales para cotizaciones</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : templates.length > 0 ? (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold">{template.template_name}</p>
                      {template.is_default && <span className="text-xs text-green-600 font-medium">Por defecto</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No hay plantillas creadas. Crea una nueva plantilla para comenzar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
