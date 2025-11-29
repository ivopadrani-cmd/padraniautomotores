
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ArrowLeft, Save } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from "sonner";

const availableVariables = [
  { key: '{{cliente_nombre}}', description: 'Nombre del cliente' },
  { key: '{{cliente_dni}}', description: 'DNI del cliente' },
  { key: '{{cliente_cuit}}', description: 'CUIT/CUIL del cliente' },
  { key: '{{cliente_direccion}}', description: 'Dirección del cliente' },
  { key: '{{cliente_telefono}}', description: 'Teléfono del cliente' },
  { key: '{{vehiculo_marca}}', description: 'Marca del vehículo' },
  { key: '{{vehiculo_modelo}}', description: 'Modelo del vehículo' },
  { key: '{{vehiculo_anio}}', description: 'Año del vehículo' },
  { key: '{{vehiculo_dominio}}', description: 'Dominio del vehículo' },
  { key: '{{vehiculo_motor}}', description: 'Número de motor' },
  { key: '{{vehiculo_chasis}}', description: 'Número de chasis' },
  { key: '{{vehiculo_color}}', description: 'Color del vehículo' },
  { key: '{{vehiculo_kilometros}}', description: 'Kilometraje del vehículo' },
  { key: '{{precio_venta}}', description: 'Precio de venta' },
  { key: '{{fecha}}', description: 'Fecha actual (formato corto)' },
  { key: '{{fecha_completa}}', description: 'Fecha actual (formato largo)' },
  { key: '{{venta_vendedor}}', description: 'Nombre del vendedor en la venta' },
  { key: '{{venta_precio}}', description: 'Precio total de la venta' },
  { key: '{{venta_sena}}', description: 'Monto de la seña de la venta' },
  { key: '{{empresa_nombre}}', description: 'Nombre de la empresa' },
  { key: '{{empresa_cuit}}', description: 'CUIT de la empresa' },
  { key: '{{empresa_direccion}}', description: 'Dirección de la empresa' },
  { key: '{{empresa_telefono}}', description: 'Teléfono de la empresa' },
  { key: '{{empresa_email}}', description: 'Email de la empresa' },
];

const defaultTemplates = {
  'Boleto Compraventa': `
<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 28px; font-weight: bold; color: #1e293b;">BOLETO DE COMPRAVENTA</h1>
    <p style="color: #64748b; margin-top: 10px;">Fecha: {{fecha}}</p>
  </div>

  <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 10px 0;">VENDEDOR</h3>
    <p style="margin: 5px 0;"><strong>Nombre:</strong> {{venta_vendedor}}</p>
    <p style="margin: 5px 0;"><strong>Empresa:</strong> {{empresa_nombre}}</p>
  </div>

  <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #8b5cf6; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 10px 0;">COMPRADOR</h3>
    <p style="margin: 5px 0;"><strong>Nombre:</strong> {{cliente_nombre}}</p>
    <p style="margin: 5px 0;"><strong>DNI:</strong> {{cliente_dni}}</p>
    <p style="margin: 5px 0;"><strong>CUIT/CUIL:</strong> {{cliente_cuit}}</p>
    <p style="margin: 5px 0;"><strong>Dirección:</strong> {{cliente_direccion}}</p>
  </div>

  <div style="margin: 20px 0; padding: 20px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 15px 0;">VEHÍCULO</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <p style="margin: 5px 0;"><strong>Marca:</strong> {{vehiculo_marca}}</p>
      <p style="margin: 5px 0;"><strong>Modelo:</strong> {{vehiculo_modelo}}</p>
      <p style="margin: 5px 0;"><strong>Año:</strong> {{vehiculo_anio}}</p>
      <p style="margin: 5px 0;"><strong>Dominio:</strong> {{vehiculo_dominio}}</p>
      <p style="margin: 5px 0;"><strong>Motor:</strong> {{vehiculo_motor}}</p>
      <p style="margin: 5px 0;"><strong>Chasis:</strong> {{vehiculo_chasis}}</p>
    </div>
  </div>

  <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px;">
    <h3 style="font-weight: bold; font-size: 20px; margin: 0 0 15px 0;">PRECIO DE VENTA</h3>
    <p style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 0;">{{venta_precio}}</p>
    <p style="margin: 10px 0 0 0; color: #475569;">Seña: {{venta_sena}}</p>
  </div>

  <div style="margin: 30px 0; padding: 20px; background: #fef3c7; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 10px 0;">CONDICIONES</h3>
    <p style="margin: 8px 0; text-align: justify; line-height: 1.6;">
      Ambas partes acuerdan la compraventa del vehículo descripto en las condiciones establecidas. 
      El comprador se compromete a completar el pago según los términos acordados, y el vendedor 
      garantiza la documentación en regla para la transferencia.
    </p>
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="text-align: center; flex: 1;">
      <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 80px;">
        <p style="font-weight: bold;">VENDEDOR</p>
        <p style="font-size: 14px; color: #64748b;">{{venta_vendedor}}</p>
      </div>
    </div>
    <div style="text-align: center; flex: 1;">
      <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 80px;">
        <p style="font-weight: bold;">COMPRADOR</p>
        <p style="font-size: 14px; color: #64748b;">{{cliente_nombre}}</p>
      </div>
    </div>
  </div>
</div>
  `,
  'Recibo de Seña': `
<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
    <h1 style="font-size: 32px; font-weight: bold; color: #1e293b;">RECIBO DE SEÑA</h1>
    <p style="color: #64748b; margin-top: 10px;">{{empresa_nombre}}</p>
    <p style="color: #64748b; font-size: 14px;">CUIT: {{empresa_cuit}}</p>
  </div>

  <div style="display: flex; justify-content: space-between; margin: 25px 0;">
    <div>
      <p style="margin: 5px 0;"><strong>Fecha:</strong> {{fecha_completa}}</p>
    </div>
    <div>
      <p style="margin: 5px 0;"><strong>Recibo N°:</strong> _____________</p>
    </div>
  </div>

  <div style="margin: 25px 0; padding: 20px; background: #f1f5f9; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 15px 0;">RECIBIMOS DE:</h3>
    <p style="margin: 5px 0; font-size: 18px;"><strong>{{cliente_nombre}}</strong></p>
    <p style="margin: 5px 0;">DNI: {{cliente_dni}} | CUIT/CUIL: {{cliente_cuit}}</p>
    <p style="margin: 5px 0;">Domicilio: {{cliente_direccion}}</p>
  </div>

  <div style="margin: 25px 0; padding: 25px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px;">
    <h3 style="font-weight: bold; margin: 0 0 10px 0;">CONCEPTO: SEÑA PARA COMPRA DE VEHÍCULO</h3>
    <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
      <p style="margin: 8px 0;"><strong>Vehículo:</strong> {{vehiculo_marca}} {{vehiculo_modelo}} {{vehiculo_anio}}</p>
      <p style="margin: 8px 0;"><strong>Dominio:</strong> {{vehiculo_dominio}}</p>
      <p style="margin: 8px 0;"><strong>Motor:</strong> {{vehiculo_motor}}</p>
      <p style="margin: 8px 0;"><strong>Chasis:</strong> {{vehiculo_chasis}}</p>
    </div>
  </div>

  <div style="margin: 30px 0; padding: 25px; background: #dcfce7; border: 2px solid #22c55e; border-radius: 12px; text-align: center;">
    <p style="font-size: 16px; margin: 0 0 10px 0; color: #166534;">MONTO DE LA SEÑA</p>
    <p style="font-size: 36px; font-weight: bold; color: #16a34a; margin: 0;">{{venta_sena}}</p>
  </div>

  <div style="margin: 25px 0; padding: 20px; background: #fef3c7; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 10px 0;">CONDICIONES:</h3>
    <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
      <li>Plazo de 10 días corridos para completar el pago total</li>
      <li>En caso de no concretar en el plazo establecido, la seña quedará como resarcimiento por daños y perjuicios</li>
      <li>Si hay permuta involucrada, el vehículo entregado será sometido a peritaje antes de la firma</li>
      <li>La entrega del vehículo se realizará con toda la documentación al día</li>
    </ul>
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="text-align: center; flex: 1;">
      <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px; width: 200px;">
        <p style="font-weight: bold;">FIRMA VENDEDOR</p>
        <p style="font-size: 14px; color: #64748b;">{{empresa_nombre}}</p>
      </div>
    </div>
    <div style="text-align: center; flex: 1;">
      <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px; width: 200px;">
        <p style="font-weight: bold;">FIRMA COMPRADOR</p>
        <p style="font-size: 14px; color: #64748b;">{{cliente_nombre}}</p>
      </div>
    </div>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="font-size: 12px; color: #64748b;">{{empresa_direccion}} | Tel: {{empresa_telefono}} | Email: {{empresa_email}}</p>
  </div>
</div>
  `,
  'Remito de Entrega': `
<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px;">
    <h1 style="font-size: 32px; font-weight: bold; color: #1e293b;">REMITO DE ENTREGA</h1>
    <p style="color: #64748b; margin-top: 10px;">{{empresa_nombre}}</p>
    <p style="color: #64748b; font-size: 14px;">CUIT: {{empresa_cuit}} | {{empresa_direccion}}</p>
  </div>

  <div style="display: flex; justify-content: space-between; margin: 25px 0;">
    <div>
      <p style="margin: 5px 0;"><strong>Fecha:</strong> {{fecha_completa}}</p>
    </div>
    <div>
      <p style="margin: 5px 0;"><strong>Remito N°:</strong> _____________</p>
    </div>
  </div>

  <div style="margin: 25px 0; padding: 20px; background: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 15px 0; color: #6b21a8;">ENTREGAMOS A:</h3>
    <p style="margin: 8px 0; font-size: 18px;"><strong>{{cliente_nombre}}</strong></p>
    <p style="margin: 5px 0;">DNI: {{cliente_dni}}</p>
    <p style="margin: 5px 0;">Domicilio: {{cliente_direccion}}</p>
    <p style="margin: 5px 0;">Teléfono: {{cliente_telefono}}</p>
  </div>

  <div style="margin: 25px 0; padding: 20px; background: #e0e7ff; border-radius: 12px;">
    <h3 style="font-weight: bold; margin: 0 0 15px 0; color: #3730a3;">VEHÍCULO ENTREGADO:</h3>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <p style="margin: 5px 0;"><strong>Marca:</strong> {{vehiculo_marca}}</p>
        <p style="margin: 5px 0;"><strong>Modelo:</strong> {{vehiculo_modelo}}</p>
        <p style="margin: 5px 0;"><strong>Año:</strong> {{vehiculo_anio}}</p>
        <p style="margin: 5px 0;"><strong>Dominio:</strong> {{vehiculo_dominio}}</p>
        <p style="margin: 5px 0;"><strong>N° Motor:</strong> {{vehiculo_motor}}</p>
        <p style="margin: 5px 0;"><strong>N° Chasis:</strong> {{vehiculo_chasis}}</p>
        <p style="margin: 5px 0;"><strong>Color:</strong> {{vehiculo_color}}</p>
        <p style="margin: 5px 0;"><strong>Kilometraje:</strong> {{vehiculo_kilometros}} km</p>
      </div>
    </div>
  </div>

  <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 15px 0;">DOCUMENTACIÓN ENTREGADA:</h3>
    <div style="column-count: 2; column-gap: 20px;">
      <p style="margin: 6px 0;">☐ Cédula Verde Original</p>
      <p style="margin: 6px 0;">☐ Cédulas de Autorizados</p>
      <p style="margin: 6px 0;">☐ Título del Automotor</p>
      <p style="margin: 6px 0;">☐ Formulario 08</p>
      <p style="margin: 6px 0;">☐ Verificación Policial</p>
      <p style="margin: 6px 0;">☐ Informe de Dominio</p>
      <p style="margin: 6px 0;">☐ Libre Deuda de Patentes</p>
      <p style="margin: 6px 0;">☐ C.A.T. (Certificado de Transferencia)</p>
    </div>
  </div>

  <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
    <h3 style="font-weight: bold; margin: 0 0 15px 0;">ACCESORIOS ENTREGADOS:</h3>
    <div style="column-count: 2; column-gap: 20px;">
      <p style="margin: 6px 0;">☐ Llaves (cant: ___)</p>
      <p style="margin: 6px 0;">☐ Manuales del Vehículo</p>
      <p style="margin: 6px 0;">☐ Rueda de Auxilio</p>
      <p style="margin: 6px 0;">☐ Gato y Llave de Ruedas</p>
      <p style="margin: 6px 0;">☐ Tuerca de Seguridad</p>
      <p style="margin: 6px 0;">☐ Matafuego</p>
    </div>
  </div>

  <div style="margin: 25px 0;">
    <h3 style="font-weight: bold; margin: 0 0 10px 0;">OBSERVACIONES:</h3>
    <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; min-height: 80px; background: white;"></div>
  </div>

  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="text-align: center; flex: 1;">
      <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px; width: 200px;">
        <p style="font-weight: bold;">ENTREGA</p>
        <p style="font-size: 14px; color: #64748b;">{{empresa_nombre}}</p>
      </div>
    </div>
    <div style="text-align: center; flex: 1;">
      <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px; width: 200px;">
        <p style="font-weight: bold;">RECIBE CONFORME</p>
        <p style="font-size: 14px; color: #64748b;">{{cliente_nombre}}</p>
      </div>
    </div>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="font-size: 12px; color: #64748b;">
      {{empresa_direccion}} | Tel: {{empresa_telefono}} | Email: {{empresa_email}}
    </p>
  </div>
</div>
  `
};

export default function SaleTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'Boleto Compraventa',
    template_content: defaultTemplates['Boleto Compraventa'],
    is_default: false
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['sale-templates'],
    queryFn: async () => {
      const all = await base44.entities.DocumentTemplate.list();
      return all.filter(t => ['Boleto Compraventa', 'Recibo de Seña', 'Remito de Entrega'].includes(t.template_type));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-templates'] });
      setShowForm(false);
      resetForm();
      toast.success("Plantilla creada");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-templates'] });
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      toast.success("Plantilla actualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-templates'] });
      toast.success("Plantilla eliminada");
    },
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      template_type: 'Boleto Compraventa',
      template_content: defaultTemplates['Boleto Compraventa'],
      is_default: false
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
                <CardTitle>{editingTemplate ? 'Editar' : 'Nueva'} Plantilla de Venta</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nombre de la Plantilla</Label>
                    <Input
                      value={formData.template_name}
                      onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select 
                      value={formData.template_type}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        template_type: value,
                        template_content: defaultTemplates[value] || formData.template_content // Keep current content if default not found
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boleto Compraventa">Boleto de Compraventa</SelectItem>
                        <SelectItem value="Recibo de Seña">Recibo de Seña</SelectItem>
                        <SelectItem value="Remito de Entrega">Remito de Entrega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Venta</h1>
            <p className="text-gray-500 mt-1">Boletos, Recibos de Seña y Remitos</p>
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
                      <p className="text-sm text-gray-600">{template.template_type}</p>
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
