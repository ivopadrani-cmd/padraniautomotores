import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, FileText, Download } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from "sonner";

export default function ContractEditor({ contract, sale, onClose }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(contract.contract_content);
  const [status, setStatus] = useState(contract.status);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['sale-contract'] });
      toast.success("Boleto guardado correctamente");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: contract.id,
      data: {
        contract_content: content,
        status: status
      }
    });
  };

  const handleExportPDF = async () => {
    // Create a simple HTML document for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Boleto de Compraventa - ${sale.client_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1, h2, h3 { color: #333; }
            p { margin: 10px 0; }
            ul { margin-left: 20px; }
            strong { font-weight: bold; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
            }
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
      ['clean']
    ],
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Boleto de Compraventa
              </CardTitle>
              <Badge className={status === 'Firmado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {status}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Cliente: <strong>{sale.client_name}</strong> • Vehículo: <strong>{sale.vehicle_description}</strong>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                className="bg-white"
                style={{ height: '600px', marginBottom: '60px' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}