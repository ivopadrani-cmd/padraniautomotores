
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
  { key: '{{cliente_dni}}', description: 'DNI del cliente' },
  { key: '{{cliente_direccion}}', description: 'Dirección del cliente' },
  { key: '{{vehiculo_marca}}', description: 'Marca del vehículo' },
  { key: '{{vehiculo_modelo}}', description: 'Modelo del vehículo' },
  { key: '{{vehiculo_anio}}', description: 'Año del vehículo' },
  { key: '{{vehiculo_dominio}}', description: 'Dominio del vehículo' },
  { key: '{{precio_minimo}}', description: 'Precio mínimo de venta' },
  { key: '{{duracion_dias}}', description: 'Duración del contrato en días' },
  { key: '{{fecha}}', description: 'Fecha actual' },
];

const defaultTemplate = `
<div style="max-width: 800px; margin: 0 auto; padding: 30px 50px; font-family: Georgia, serif; background: white; font-size: 11px; line-height: 1.3;">
  
  <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 15px;">
    <img src="{{logo_url}}" alt="Logo" style="max-width: 140px; height: auto; margin-bottom: 10px;" />
    <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #000; letter-spacing: 1px;">CONTRATO DE CONSIGNACIÓN</h1>
  </div>

  <p style="margin: 0 0 15px 0; text-align: justify;">
    En la ciudad de ________________, a los _____ días del mes de __________ del año _____, entre:
  </p>
  
  <div style="margin: 15px 0; padding: 12px; background: #f5f5f5; border-left: 3px solid #000;">
    <p style="margin: 0 0 6px 0;"><strong>CONSIGNANTE:</strong> {{cliente_nombre}}</p>
    <p style="margin: 0 0 6px 0;"><strong>DNI:</strong> {{cliente_dni}}</p>
    <p style="margin: 0;"><strong>Domicilio:</strong> {{cliente_direccion}}</p>
  </div>

  <p style="margin: 12px 0;">Y por la otra parte:</p>

  <div style="margin: 15px 0; padding: 12px; background: #f5f5f5; border-left: 3px solid #000;">
    <p style="margin: 0 0 6px 0;"><strong>CONSIGNATARIO:</strong> Padrani Automotores</p>
    <p style="margin: 0 0 6px 0;"><strong>CUIT:</strong> 20-12320784-0</p>
    <p style="margin: 0;"><strong>Domicilio:</strong> Namuncurá 283, Comodoro Rivadavia, Chubut</p>
  </div>

  <div style="margin: 15px 0 10px;">
    <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 10px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">VEHÍCULO</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 5px 0; font-weight: 600; width: 100px;">Marca:</td>
        <td style="padding: 5px 0;">{{vehiculo_marca}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 5px 0; font-weight: 600;">Modelo:</td>
        <td style="padding: 5px 0;">{{vehiculo_modelo}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 5px 0; font-weight: 600;">Año:</td>
        <td style="padding: 5px 0;">{{vehiculo_anio}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 5px 0; font-weight: 600;">Dominio:</td>
        <td style="padding: 5px 0;">{{vehiculo_dominio}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: 600;">Precio Mínimo:</td>
        <td style="padding: 5px 0; font-weight: 700;">{{precio_minimo}}</td>
      </tr>
    </table>
  </div>

  <div style="margin: 15px 0;">
    <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 10px 0; border-bottom: 1px solid #000; padding-bottom: 5px;">CLÁUSULAS</h2>
    
    <p style="margin: 8px 0; text-align: justify;"><strong>PRIMERA:</strong> El CONSIGNANTE da en consignación al CONSIGNATARIO el vehículo descripto, para su oferta en venta a terceros.</p>

    <p style="margin: 8px 0; text-align: justify;"><strong>SEGUNDA:</strong> El precio mínimo de venta acordado es de {{precio_minimo}}. El CONSIGNATARIO no podrá vender por un valor inferior sin autorización del CONSIGNANTE.</p>

    <p style="margin: 8px 0; text-align: justify;"><strong>TERCERA:</strong> La comisión del CONSIGNATARIO será del ___% sobre el precio de venta concretado.</p>

    <p style="margin: 8px 0; text-align: justify;"><strong>CUARTA:</strong> Vigencia de {{duracion_dias}} días corridos. Vencido el plazo, el CONSIGNANTE puede retirar el vehículo.</p>

    <p style="margin: 8px 0; text-align: justify;"><strong>QUINTA:</strong> El CONSIGNATARIO mantendrá el vehículo en condiciones óptimas y será responsable por daños durante su custodia.</p>

    <p style="margin: 8px 0; text-align: justify;"><strong>SEXTA:</strong> Concretada la venta, el CONSIGNATARIO liquidará al CONSIGNANTE el importe menos su comisión dentro de las 72 horas.</p>
  </div>

  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
    <div style="text-align: center; flex: 1; padding: 0 15px;">
      <div style="border-top: 1px solid #000; padding-top: 6px; margin-top: 50px;">
        <p style="margin: 0; font-weight: 600; font-size: 10px;">CONSIGNANTE</p>
        <p style="margin: 3px 0 0; font-size: 9px;">{{cliente_nombre}}</p>
      </div>
    </div>
    <div style="text-align: center; flex: 1; padding: 0 15px;">
      <div style="border-top: 1px solid #000; padding-top: 6px; margin-top: 50px;">
        <p style="margin: 0; font-weight: 600; font-size: 10px;">CONSIGNATARIO</p>
        <p style="margin: 3px 0 0; font-size: 9px;">Padrani Automotores</p>
      </div>
    </div>
  </div>

  <div style="margin-top: 20px; text-align: center; padding-top: 15px; border-top: 1px solid #ddd;">
    <p style="margin: 0; font-size: 9px;">Padrani Automotores | CUIT: 20-12320784-0 | Namuncurá 283, Comodoro Rivadavia</p>
  </div>
</div>
`;

export default function ConsignmentTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'Contrato Consignación',
    template_content: defaultTemplate,
    is_default: false,
    logo_url: ''
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['consignment-templates'],
    queryFn: async () => {
      const all = await base44.entities.DocumentTemplate.list();
      return all.filter(t => t.template_type === 'Contrato Consignación');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-templates'] });
      setShowForm(false);
      resetForm();
      toast.success("Plantilla creada");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-templates'] });
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      toast.success("Plantilla actualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-templates'] });
      toast.success("Plantilla eliminada");
    },
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      template_type: 'Contrato Consignación',
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
                <CardTitle>{editingTemplate ? 'Editar' : 'Nueva'} Plantilla de Consignación</CardTitle>
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
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Consignación</h1>
            <p className="text-gray-500 mt-1">Contratos formales de consignación</p>
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
