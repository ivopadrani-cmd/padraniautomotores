import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Download, Eye } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const numberToWords = (num) => {
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (num === 0) return 'cero';
  if (num === 100) return 'cien';

  let words = '';

  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    words += (millions === 1 ? 'un millón' : numberToWords(millions) + ' millones') + ' ';
    num %= 1000000;
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      words += 'mil ';
    } else {
      words += numberToWords(thousands) + ' mil ';
    }
    num %= 1000;
  }

  if (num >= 100) {
    words += hundreds[Math.floor(num / 100)];
    if (num % 100 === 0 && Math.floor(num / 100) === 1) {
      words = words.replace('ciento', 'cien');
    }
    words += ' ';
    num %= 100;
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)];
    if (num % 10 > 0) {
      words += ' y ' + units[num % 10];
    }
  } else if (num >= 10) {
    words += teens[num - 10];
  } else if (num > 0) {
    words += units[num];
  }

  return words.trim();
};

const formatCurrencyWithWords = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '$0 (cero pesos)';
  const formatted = `$${amount.toLocaleString('es-AR')}`;
  const integerPart = Math.floor(amount);
  const words = numberToWords(integerPart);
  return `${formatted} (${words} pesos)`;
};

const replaceTemplateVariables = (template, vehicle, client, sale) => {
  let content = template;
  const now = new Date();

  content = content.replace(/{{DIA}}/g, now.getDate().toString());
  content = content.replace(/{{MES}}/g, format(now, 'MMMM', { locale: es }));
  content = content.replace(/{{ANIO}}/g, now.getFullYear().toString());
  content = content.replace(/{{fecha}}/g, format(now, 'dd/MM/yyyy'));
  content = content.replace(/{{fecha_completa}}/g, format(now, "dd 'de' MMMM 'de' yyyy", { locale: es }));

  if (client) {
    content = content.replace(/{{CLIENTE}}/g, client.full_name || '');
    content = content.replace(/{{cliente_nombre}}/g, client.full_name || '');
    content = content.replace(/{{TIPO_DOC}}/g, 'DNI');
    content = content.replace(/{{DNI}}/g, client.dni || '');
    content = content.replace(/{{cliente_dni}}/g, client.dni || '');
    content = content.replace(/{{CUIL}}/g, client.cuit_cuil || '');
    content = content.replace(/{{cliente_cuit}}/g, client.cuit_cuil || '');
    content = content.replace(/{{TELEFONO}}/g, client.phone || '');
    content = content.replace(/{{cliente_telefono}}/g, client.phone || '');
    content = content.replace(/{{DOMICILIO}}/g, client.address || '');
    content = content.replace(/{{cliente_direccion}}/g, client.address || '');
    content = content.replace(/{{cliente_email}}/g, client.email || '');
    content = content.replace(/{{cliente_ciudad}}/g, client.city || '');
    content = content.replace(/{{cliente_provincia}}/g, client.province || '');
  } else {
    content = content.replace(/{{CLIENTE}}/g, '________________________');
    content = content.replace(/{{cliente_nombre}}/g, '________________________');
    content = content.replace(/{{DNI}}/g, '________________________');
    content = content.replace(/{{cliente_dni}}/g, '________________________');
    content = content.replace(/{{CUIL}}/g, '________________________');
    content = content.replace(/{{cliente_cuit}}/g, '________________________');
    content = content.replace(/{{TELEFONO}}/g, '________________________');
    content = content.replace(/{{cliente_telefono}}/g, '________________________');
    content = content.replace(/{{DOMICILIO}}/g, '________________________');
    content = content.replace(/{{cliente_direccion}}/g, '________________________');
  }

  if (vehicle) {
    content = content.replace(/{{MARCA}}/g, vehicle.brand || '');
    content = content.replace(/{{vehiculo_marca}}/g, vehicle.brand || '');
    content = content.replace(/{{MODELO}}/g, vehicle.model || '');
    content = content.replace(/{{vehiculo_modelo}}/g, vehicle.model || '');
    content = content.replace(/{{VERSION}}/g, '');
    content = content.replace(/{{ANIO_VEHICULO}}/g, vehicle.year?.toString() || '');
    content = content.replace(/{{vehiculo_anio}}/g, vehicle.year?.toString() || '');
    content = content.replace(/{{COLOR}}/g, vehicle.color || '');
    content = content.replace(/{{vehiculo_color}}/g, vehicle.color || '');
    content = content.replace(/{{DOMINIO}}/g, vehicle.plate || '');
    content = content.replace(/{{vehiculo_dominio}}/g, vehicle.plate || '');
    content = content.replace(/{{MOTOR}}/g, vehicle.engine_number || '');
    content = content.replace(/{{vehiculo_motor}}/g, vehicle.engine_number || '');
    content = content.replace(/{{CHASIS}}/g, vehicle.chassis_number || '');
    content = content.replace(/{{vehiculo_chasis}}/g, vehicle.chassis_number || '');
    content = content.replace(/{{LOCALIDAD_RADICACION}}/g, vehicle.registration_city || '');
    content = content.replace(/{{PROVINCIA_RADICACION}}/g, vehicle.registration_province || '');
    content = content.replace(/{{KILOMETROS}}/g, vehicle.kilometers?.toLocaleString('es-AR') || '0');
    content = content.replace(/{{vehiculo_kilometros}}/g, vehicle.kilometers?.toLocaleString('es-AR') || '0');
    content = content.replace(/{{vehiculo_precio}}/g, formatCurrencyWithWords(vehicle.price_ars || 0));
    content = content.replace(/{{precio_minimo}}/g, formatCurrencyWithWords(vehicle.price_ars || 0));
  }

  if (sale) {
    content = content.replace(/{{PRECIO_TOTAL}}/g, sale.sale_price_ars ? `$${sale.sale_price_ars.toLocaleString('es-AR')}` : '$0');
    content = content.replace(/{{PRECIO_TOTAL_LETRAS}}/g, sale.sale_price_ars ? numberToWords(Math.floor(sale.sale_price_ars)) + ' pesos' : 'cero pesos');
    content = content.replace(/{{venta_fecha}}/g, sale.sale_date ? format(new Date(sale.sale_date), 'dd/MM/yyyy') : '');
    content = content.replace(/{{venta_precio}}/g, formatCurrencyWithWords(sale.sale_price_ars || 0));
    content = content.replace(/{{venta_sena}}/g, formatCurrencyWithWords(sale.deposit_amount_ars || 0));
    content = content.replace(/{{venta_vendedor}}/g, sale.seller || 'Padrani Automotores');

    let seccionSena = '';
    if (sale.deposit_amount_ars && sale.deposit_amount_ars > 0) {
      const senaWords = formatCurrencyWithWords(sale.deposit_amount_ars);
      const senaDate = sale.deposit_date ? format(new Date(sale.deposit_date), 'dd/MM/yyyy') : format(now, 'dd/MM/yyyy');
      seccionSena = `Se abona en concepto de SEÑA la suma de ${senaWords} en fecha ${senaDate}${sale.deposit_description ? `. Detalle: ${sale.deposit_description}` : ''}.`;
    }
    content = content.replace(/{{SECCION_SENA}}/g, seccionSena);

    let seccionContado1 = '';
    let seccionContado2 = '';
    if (sale.cash_payments && sale.cash_payments.length > 0) {
      sale.cash_payments.forEach((payment, index) => {
        const paymentWords = formatCurrencyWithWords(payment.amount_ars || 0);
        const paymentDate = payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : '';
        const paymentText = `Pago al contado de ${paymentWords} en fecha ${paymentDate}${payment.description ? `. Detalle: ${payment.description}` : ''}.`;
        
        if (index === 0) seccionContado1 = paymentText;
        else if (index === 1) seccionContado2 = paymentText;
      });
    }
    content = content.replace(/{{SECCION_CONTADO}}/g, seccionContado1);
    content = content.replace(/{{SECCION_CONTADO_2}}/g, seccionContado2);

    let seccionPermuta1 = '';
    let seccionPermuta2 = '';
    if (sale.trade_ins && sale.trade_ins.length > 0) {
      sale.trade_ins.forEach((tradeIn, index) => {
        const valueWords = formatCurrencyWithWords(tradeIn.value_ars || 0);
        const permutaText = `Permuta de vehículo marca ${tradeIn.brand || ''} modelo ${tradeIn.model || ''} año ${tradeIn.year || ''}, dominio ${tradeIn.plate || 'a definir'}, motor N° ${tradeIn.engine_number || 'N/A'}, chasis N° ${tradeIn.chassis_number || 'N/A'}, radicado en ${tradeIn.registration_city || ''} ${tradeIn.registration_province || ''}, color ${tradeIn.color || ''}, kilometraje ${tradeIn.kilometers?.toLocaleString('es-AR') || '0'} km, valuado en ${valueWords}${tradeIn.observations ? `. Observaciones: ${tradeIn.observations}` : ''}.`;
        
        if (index === 0) seccionPermuta1 = permutaText;
        else if (index === 1) seccionPermuta2 = permutaText;
      });
    }
    content = content.replace(/{{SECCION_PERMUTA}}/g, seccionPermuta1);
    content = content.replace(/{{SECCION_PERMUTA_2}}/g, seccionPermuta2);

    let seccionFinanciacion = '';
    if (sale.financing_amount_ars && sale.financing_amount_ars > 0) {
      const financingWords = formatCurrencyWithWords(sale.financing_amount_ars);
      const installmentWords = formatCurrencyWithWords(sale.financing_installment_value || 0);
      seccionFinanciacion = `Financiación bancaria por ${financingWords} a través de ${sale.financing_bank || 'entidad bancaria'}, en ${sale.financing_installments || 0} cuotas de ${installmentWords} cada una.`;
    }
    content = content.replace(/{{SECCION_FINANCIACION}}/g, seccionFinanciacion);

    const seccionGastos = 'Los gastos de transferencia, formularios, aranceles y gestoría NO están incluidos en el precio del vehículo y son a cargo del comprador.';
    content = content.replace(/{{SECCION_GASTOS_TRANSFERENCIA}}/g, seccionGastos);
  } else {
    content = content.replace(/{{PRECIO_TOTAL}}/g, '$0');
    content = content.replace(/{{PRECIO_TOTAL_LETRAS}}/g, 'cero pesos');
    content = content.replace(/{{SECCION_SENA}}/g, '');
    content = content.replace(/{{SECCION_CONTADO}}/g, '');
    content = content.replace(/{{SECCION_CONTADO_2}}/g, '');
    content = content.replace(/{{SECCION_PERMUTA}}/g, '');
    content = content.replace(/{{SECCION_PERMUTA_2}}/g, '');
    content = content.replace(/{{SECCION_FINANCIACION}}/g, '');
    content = content.replace(/{{SECCION_GASTOS_TRANSFERENCIA}}/g, 'Los gastos de transferencia son a cargo del comprador.');
  }

  content = content.replace(/{{OBSERVACIONES}}/g, sale?.observations || '');
  content = content.replace(/{{empresa_nombre}}/g, 'Padrani Automotores');
  content = content.replace(/{{empresa_direccion}}/g, 'Namuncurá 235, Comodoro Rivadavia');
  content = content.replace(/{{empresa_telefono}}/g, '297 536-1370');
  content = content.replace(/{{empresa_email}}/g, 'ivopadrani@gmail.com');
  content = content.replace(/{{empresa_cuit}}/g, '20-12320784-0');
  content = content.replace(/{{duracion_dias}}/g, '30');

  return content;
};

export default function DocumentEditor({ document, sale, vehicle, client, lead, onClose }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(document.status || 'Borrador');
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (document.document_content) {
      const replacedContent = replaceTemplateVariables(
        document.document_content,
        vehicle,
        client,
        sale
      );
      setContent(replacedContent);
    }
  }, [document.document_content, vehicle, client, sale]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.update(document.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Documento guardado");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      document_content: content,
      status: status
    });
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.document_name}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 20px;
              font-family: Arial, sans-serif;
              line-height: 1.6;
            }
            @media print { 
              body { margin: 0; padding: 20px; }
              @page { 
                margin: 15mm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Editar' : 'Vista Previa'}
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl mb-2">{document.document_name}</CardTitle>
                <Badge className="text-sm">{document.document_type}</Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Borrador">Borrador</SelectItem>
                    <SelectItem value="Generado">Generado</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Firmado">Firmado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Fecha: {document.document_date && format(new Date(document.document_date), 'dd/MM/yyyy')}
                </p>
              </div>

              {showPreview ? (
                <div className="border rounded-lg p-6 bg-white min-h-[500px]">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} style={{ minHeight: '500px' }} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}