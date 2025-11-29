import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, FileText, Info } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AVAILABLE_VARIABLES = [
  { key: '{{fecha_boleto}}', description: 'Fecha del boleto (ej: 15 de enero de 2025)' },
  { key: '{{vendedor_nombre}}', description: 'Nombre del vendedor (PADRANI AUTOMOTORES)' },
  { key: '{{vendedor_cuit}}', description: 'CUIT del vendedor' },
  { key: '{{vendedor_domicilio}}', description: 'Domicilio del vendedor' },
  { key: '{{vendedor_telefono}}', description: 'Teléfono del vendedor' },
  { key: '{{vendedor_email}}', description: 'Email del vendedor' },
  { key: '{{comprador_nombre}}', description: 'Nombre del comprador' },
  { key: '{{comprador_dni}}', description: 'DNI del comprador' },
  { key: '{{comprador_cuit}}', description: 'CUIT/CUIL del comprador' },
  { key: '{{comprador_telefono}}', description: 'Teléfono del comprador' },
  { key: '{{comprador_domicilio}}', description: 'Domicilio del comprador' },
  { key: '{{vehiculo_marca}}', description: 'Marca del vehículo' },
  { key: '{{vehiculo_modelo}}', description: 'Modelo del vehículo' },
  { key: '{{vehiculo_año}}', description: 'Año del vehículo' },
  { key: '{{vehiculo_color}}', description: 'Color del vehículo' },
  { key: '{{vehiculo_dominio}}', description: 'Dominio/patente' },
  { key: '{{vehiculo_motor}}', description: 'Número de motor' },
  { key: '{{vehiculo_chasis}}', description: 'Número de chasis' },
  { key: '{{vehiculo_radicacion}}', description: 'Ciudad y provincia de radicación' },
  { key: '{{vehiculo_kilometros}}', description: 'Kilometraje' },
  { key: '{{precio_total}}', description: 'Precio total en ARS' },
  { key: '{{seña_monto}}', description: 'Monto de la seña' },
  { key: '{{seña_fecha}}', description: 'Fecha de la seña' },
  { key: '{{contado_detalle}}', description: 'Detalle de pagos al contado' },
  { key: '{{permuta_detalle}}', description: 'Detalle de vehículos en permuta' },
  { key: '{{financiacion_detalle}}', description: 'Detalle de financiación' },
  { key: '{{observaciones}}', description: 'Observaciones de la venta' }
];

const DEFAULT_TEMPLATE = `<p><strong>BOLETO DE COMPRAVENTA DE VEHÍCULO USADO</strong></p>

<p>En la ciudad de Comodoro Rivadavia, a los {{fecha_boleto}}, entre:</p>

<p>{{vendedor_nombre}}, CUIT {{vendedor_cuit}}, con domicilio en {{vendedor_domicilio}}, teléfono {{vendedor_telefono}}, correo electrónico {{vendedor_email}}, en adelante <strong>"EL VENDEDOR"</strong>,</p>

<p>y {{comprador_nombre}}, con DNI Nº {{comprador_dni}}, CUIL/CUIT Nº {{comprador_cuit}}, teléfono {{comprador_telefono}}, con domicilio en {{comprador_domicilio}}, en adelante <strong>"EL COMPRADOR"</strong>,</p>

<p>se celebra el presente boleto de compraventa, sujeto a las siguientes cláusulas:</p>

<p><strong>PRIMERA – OBJETO</strong></p>
<p>El comprador adquiere el siguiente vehículo usado, libre de todo gravamen, prenda o inhibición, el cual ha sido revisado y aprobado a su entera satisfacción:</p>
<ul>
  <li>Marca: {{vehiculo_marca}}</li>
  <li>Modelo / Versión: {{vehiculo_modelo}}</li>
  <li>Año: {{vehiculo_año}}</li>
  <li>Color: {{vehiculo_color}}</li>
  <li>Dominio: {{vehiculo_dominio}}</li>
  <li>Motor Nº: {{vehiculo_motor}}</li>
  <li>Chasis Nº: {{vehiculo_chasis}}</li>
  <li>Radicado en: {{vehiculo_radicacion}}</li>
  <li>Kilometraje: {{vehiculo_kilometros}}</li>
</ul>

<p><strong>SEGUNDA – PRECIO Y FORMA DE PAGO</strong></p>
<p>El precio total de la operación se fija en {{precio_total}}.</p>

<p><strong>FORMA DE PAGO:</strong></p>
{{seña_detalle}}
{{contado_detalle}}
{{permuta_detalle}}
{{financiacion_detalle}}

<p>Los gastos de transferencia, formularios, aranceles y gestoría no están incluidos en el precio del vehículo.</p>

<p><strong>TERCERA – CONDICIONES DE ENTREGA</strong></p>
<p>El vehículo se entrega en el estado que se encuentra, y que EL COMPRADOR declara conocer y aceptar conforme inspección previa.</p>
<p>La entrega se efectuará una vez finalizada y asentada la transferencia registral correspondiente.</p>

<p><strong>CUARTA – GARANTÍA Y VICIOS OCULTOS</strong></p>
<p>EL VENDEDOR no otorga garantía sobre el bien, salvo por vicios ocultos graves no informados al momento de la venta.</p>
<p>No se admitirán reclamos por detalles estéticos o de mantenimiento que no afecten la seguridad ni el funcionamiento del vehículo.</p>

<p><strong>QUINTA – GASTOS</strong></p>
<p>El valor de la operación incluye comisiones y gastos básicos de intermediación.</p>
<p>Los gastos de transferencia, formularios, aranceles y gestoría no están incluidos en el precio del vehículo.</p>

<p><strong>SEXTA – JURISDICCIÓN</strong></p>
<p>Para cualquier diferencia que surja del presente contrato, las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Comodoro Rivadavia.</p>

{{observaciones}}

<p>El presente documento sirve como suficiente recibo de las sumas abonadas hasta la fecha.</p>
<p>Leído y ratificado, se firman dos ejemplares de un mismo tenor y a un solo efecto.</p>`;

export default function ContractTemplates() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: () => base44.entities.ContractTemplate.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      setEditingTemplate(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      setEditingTemplate(null);
    },
  });

  const handleSave = () => {
    if (editingTemplate.id) {
      updateMutation.mutate({ id: editingTemplate.id, data: editingTemplate });
    } else {
      createMutation.mutate(editingTemplate);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  if (editingTemplate) {
    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar Plantilla
            </Button>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-gray-100 p-6">
              <CardTitle>
                {editingTemplate.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Nombre de la Plantilla</Label>
                <Input
                  value={editingTemplate.template_name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, template_name: e.target.value})}
                  placeholder="Ej: Boleto Estándar"
                />
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="p-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Variables Disponibles</h3>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <div key={variable.key} className="text-sm">
                        <code className="bg-white px-2 py-1 rounded text-blue-700">{variable.key}</code>
                        <span className="text-gray-600 ml-2">- {variable.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Contenido de la Plantilla</Label>
                <ReactQuill
                  theme="snow"
                  value={editingTemplate.template_content}
                  onChange={(content) => setEditingTemplate({...editingTemplate, template_content: content})}
                  modules={modules}
                  className="bg-white"
                  style={{ height: '400px', marginBottom: '50px' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Boletos</h1>
            <p className="text-gray-500 mt-1">Gestión de plantillas de compraventa</p>
          </div>
          <Button onClick={() => setEditingTemplate({ template_name: '', template_content: DEFAULT_TEMPLATE, is_default: false })}>
            <FileText className="w-5 h-5 mr-2" />
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
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-lg transition-all duration-300 border border-gray-200 cursor-pointer"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-lg">{template.template_name}</h3>
                          {template.is_default && (
                            <Badge className="mt-2">Plantilla por defecto</Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hay plantillas creadas</p>
                <Button onClick={() => setEditingTemplate({ template_name: 'Boleto Estándar', template_content: DEFAULT_TEMPLATE, is_default: true })}>
                  Crear Plantilla por Defecto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}