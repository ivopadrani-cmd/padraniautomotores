import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Phone, Mail, MapPin, User, ShoppingCart, Car, IdCard, Home, Trash2, Upload, Download, FileText, X, MessageCircle } from "lucide-react";
import { QuickContactButton } from "../common/WhatsAppButton";
import { format } from "date-fns";
import AddEventDialog from "../events/AddEventDialog";
import SaleDetail from "../sales/SaleDetail";
import { toast } from "sonner";

export default function ClientDetail({ client, onClose, onEdit, onDelete }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', client.id],
    queryFn: () => base44.entities.Sale.filter({ client_id: client.id }, '-sale_date'),
  });

  const { data: suppliedVehicles = [] } = useQuery({
    queryKey: ['supplier-vehicles', client.id],
    queryFn: () => base44.entities.Vehicle.filter({ supplier_client_id: client.id }, '-created_at'),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      toast.success("Documento adjuntado");
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDocument = {
        url: file_url,
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        type: file.type
      };

      const updatedDocuments = [...(client.attached_documents || []), newDocument];
      
      await updateClientMutation.mutateAsync({
        id: client.id,
        data: { attached_documents: updatedDocuments }
      });
    } catch (error) {
      toast.error("Error al subir el archivo");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docIndex) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

    const updatedDocuments = client.attached_documents.filter((_, index) => index !== docIndex);
    await updateClientMutation.mutateAsync({
      id: client.id,
      data: { attached_documents: updatedDocuments }
    });
  };

  if (selectedSale) {
    return (
      <SaleDetail
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onDelete={() => {}}
      />
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-3">
            <AddEventDialog
              clientId={client.id}
              clientName={client.full_name}
            />
            <Button onClick={() => onEdit(client)} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            {onDelete && (
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onDelete(client.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-3xl mb-2">{client.full_name}</CardTitle>
                      <QuickContactButton phone={client.phone} name={client.full_name} />
                    </div>
                    <div className="flex gap-2">
                      {client.dni && <Badge variant="outline">{client.dni}</Badge>}
                      {client.cuit_cuil && <Badge variant="outline">{client.cuit_cuil}</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Información de Contacto
                    </h3>
                    <div className="space-y-3">
                      {client.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <a href={`tel:${client.phone}`} className="font-semibold hover:text-cyan-600">{client.phone}</a>
                        </div>
                      )}
                      {client.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-semibold">{client.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <IdCard className="w-5 h-5" />
                      Documentación
                    </h3>
                    <div className="space-y-3">
                      {client.dni && (
                        <div>
                          <p className="text-sm text-gray-500">DNI</p>
                          <p className="font-semibold">{client.dni}</p>
                        </div>
                      )}
                      {client.cuit_cuil && (
                        <div>
                          <p className="text-sm text-gray-500">CUIT/CUIL</p>
                          <p className="font-semibold">{client.cuit_cuil}</p>
                        </div>
                      )}
                      {client.marital_status && (
                        <div>
                          <p className="text-sm text-gray-500">Estado Civil</p>
                          <p className="font-semibold">{client.marital_status}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 mb-4">
                    <Home className="w-5 h-5" />
                    Domicilio
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {client.address && (
                      <div>
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-semibold">{client.address}</p>
                      </div>
                    )}
                    {client.city && (
                      <div>
                        <p className="text-sm text-gray-500">Ciudad</p>
                        <p className="font-semibold">{client.city}</p>
                      </div>
                    )}
                    {client.province && (
                      <div>
                        <p className="text-sm text-gray-500">Provincia</p>
                        <p className="font-semibold">{client.province}</p>
                      </div>
                    )}
                    {client.postal_code && (
                      <div>
                        <p className="text-sm text-gray-500">Código Postal</p>
                        <p className="font-semibold">{client.postal_code}</p>
                      </div>
                    )}
                  </div>
                </div>

                {client.observations && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Observaciones</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{client.observations}</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Fecha de Alta: {client.created_date ? format(new Date(client.created_date), 'dd/MM/yyyy HH:mm') : '-'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-gray-100 p-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documentos Adjuntos ({client.attached_documents?.length || 0})
                  </CardTitle>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" disabled={uploading} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Subiendo...' : 'Adjuntar'}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {client.attached_documents && client.attached_documents.length > 0 ? (
                  <div className="space-y-3">
                    {client.attached_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.date && format(new Date(doc.date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4 text-blue-600" />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDocument(index)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay documentos adjuntos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-gray-100 p-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Historial de Compras ({sales.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {sales.length > 0 ? (
                  <div className="space-y-4">
                    {sales.map((sale) => (
                      <div 
                        key={sale.id} 
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{sale.vehicle_description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(sale.sale_date), 'dd/MM/yyyy')}
                            </p>
                            <Badge className="mt-2" variant="outline">{sale.sale_status}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              ${sale.sale_price_ars?.toLocaleString('es-AR') || '0'}
                            </p>
                            {sale.sale_price_usd > 0 && (
                              <p className="text-sm text-gray-600">
                                USD {sale.sale_price_usd?.toLocaleString('en-US')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay compras registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-gray-100 p-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehículos Provistos ({suppliedVehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {suppliedVehicles.length > 0 ? (
                  <div className="space-y-3">
                    {suppliedVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-sm">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-gray-600">{vehicle.year} • {vehicle.plate}</p>
                        {vehicle.is_supplier_owner && (
                          <Badge className="mt-2 text-xs" variant="secondary">Titular</Badge>
                        )}
                        <Badge className="mt-2 ml-2 text-xs">{vehicle.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Car className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No hay vehículos provistos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}