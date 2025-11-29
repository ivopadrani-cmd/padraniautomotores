import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Upload, FileText, X, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SaleForm({ sale, clients, vehicles, onSubmit, onCancel, isLoading }) {
  const [uploading, setUploading] = useState(false);
  const [editingTradeInIndex, setEditingTradeInIndex] = useState(null);
  const [editingCashPaymentIndex, setEditingCashPaymentIndex] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState(sale || {
    sale_date: new Date().toISOString().split('T')[0],
    seller: '',
    client_id: '',
    client_name: '',
    vehicle_id: '',
    vehicle_description: '',
    sale_price_ars: 0,
    sale_price_usd: 0,
    sale_price_date: new Date().toISOString().split('T')[0],
    deposit_amount_ars: 0,
    deposit_date: new Date().toISOString().split('T')[0],
    deposit_description: '',
    cash_payments: [],
    trade_ins: [],
    financing_amount_ars: 0,
    financing_bank: '',
    financing_installments: 0,
    financing_installment_value: 0,
    sale_status: 'PENDIENTE',
    observations: '',
    documents: []
  });

  const [paymentMethods, setPaymentMethods] = useState(sale ? {
    useDeposit: sale.deposit_amount_ars > 0 || sale.deposit_description !== '',
    useCashPayment: sale.cash_payments && sale.cash_payments.length > 0,
    useTradeIn: sale.trade_ins && sale.trade_ins.length > 0,
    useFinancing: sale.financing_amount_ars > 0 || sale.financing_bank !== '' || sale.financing_installments > 0
  } : {
    useDeposit: false,
    useCashPayment: false,
    useTradeIn: false,
    useFinancing: false
  });

  const [newCashPayment, setNewCashPayment] = useState({ amount_ars: 0, date: new Date().toISOString().split('T')[0], description: '' });
  const [newTradeIn, setNewTradeIn] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    engine_brand: '',
    engine_number: '',
    chassis_brand: '',
    chassis_number: '',
    kilometers: 0,
    color: '',
    registration_city: '',
    registration_province: '',
    value_ars: 0,
    is_supplier_owner: false,
    observations: ''
  });

  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({
    full_name: '',
    dni: '',
    cuit_cuil: '',
    phone: '',
    email: ''
  });

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.dni?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => 
    v.brand?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.plate?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const getUSDRate = async (dateString) => {
    try {
      const date = dateString.split('T')[0];
      const response = await fetch(`https://api.exchangerate.host/${date}?base=USD&symbols=ARS`);
      const data = await response.json();
      return data.rates?.ARS || 1000;
    } catch (error) {
      console.error("Error fetching USD rate:", error);
      return 1000;
    }
  };

  useEffect(() => {
    const calculatePriceUsd = async () => {
      if (formData.sale_price_ars && formData.sale_price_date) {
        const rate = await getUSDRate(formData.sale_price_date);
        handleChange('sale_price_usd', parseFloat((formData.sale_price_ars / rate).toFixed(2)));
      }
    };
    calculatePriceUsd();
  }, [formData.sale_price_ars, formData.sale_price_date]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      handleChange('client_id', clientId);
      handleChange('client_name', client.full_name);
    }
  };

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setFormData(prev => ({
        ...prev,
        vehicle_id: vehicleId,
        vehicle_description: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        sale_price_ars: vehicle.price_ars || 0,
        sale_price_date: new Date().toISOString().split('T')[0]
      }));
    }
  };

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      handleChange('client_id', newClient.id);
      handleChange('client_name', newClient.full_name);
      setShowNewClientDialog(false);
      toast.success("Cliente creado exitosamente.");
    },
    onError: (error) => {
      toast.error("Error al crear cliente: " + error.message);
    }
  });

  const handleAddCashPayment = async () => {
    if (newCashPayment.amount_ars <= 0) {
      toast.error("El monto del pago al contado debe ser mayor a 0.");
      return;
    }
    const rate = await getUSDRate(newCashPayment.date);
    const paymentWithUsd = {
      ...newCashPayment,
      amount_usd: parseFloat((newCashPayment.amount_ars / rate).toFixed(2))
    };
    
    if (editingCashPaymentIndex !== null) {
      const updated = [...formData.cash_payments];
      updated[editingCashPaymentIndex] = paymentWithUsd;
      handleChange('cash_payments', updated);
      setEditingCashPaymentIndex(null);
    } else {
      handleChange('cash_payments', [...formData.cash_payments, paymentWithUsd]);
    }
    
    setNewCashPayment({ amount_ars: 0, date: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleEditCashPayment = (index) => {
    setNewCashPayment(formData.cash_payments[index]);
    setEditingCashPaymentIndex(index);
  };

  const handleAddTradeIn = async () => {
    if (!newTradeIn.brand || !newTradeIn.model) {
      toast.error("Complete marca y modelo de la permuta para agregarla.");
      return;
    }
    const rate = await getUSDRate(formData.sale_date);
    const tradeInWithUsd = {
      ...newTradeIn,
      value_usd: parseFloat((newTradeIn.value_ars / rate).toFixed(2))
    };
    
    if (editingTradeInIndex !== null) {
      const updated = [...formData.trade_ins];
      updated[editingTradeInIndex] = tradeInWithUsd;
      handleChange('trade_ins', updated);
      setEditingTradeInIndex(null);
    } else {
      handleChange('trade_ins', [...formData.trade_ins, tradeInWithUsd]);
    }
    
    setNewTradeIn({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      engine_brand: '',
      engine_number: '',
      chassis_brand: '',
      chassis_number: '',
      kilometers: 0,
      color: '',
      registration_city: '',
      registration_province: '',
      value_ars: 0,
      is_supplier_owner: false,
      observations: ''
    });
  };

  const handleEditTradeIn = (index) => {
    setNewTradeIn(formData.trade_ins[index]);
    setEditingTradeInIndex(index);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return {
        url: file_url,
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        type: file.type
      };
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      handleChange('documents', [...(formData.documents || []), ...uploadedFiles]);
      toast.success("Archivos subidos exitosamente.");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error al subir los archivos: " + error.message);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleRemoveDocument = (index) => {
    handleChange('documents', formData.documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const saleData = { ...formData };
    if (!paymentMethods.useDeposit) {
      saleData.deposit_amount_ars = 0;
      saleData.deposit_date = new Date().toISOString().split('T')[0];
      saleData.deposit_description = '';
    }
    if (!paymentMethods.useCashPayment) {
        saleData.cash_payments = [];
    }
    if (!paymentMethods.useTradeIn) {
        saleData.trade_ins = [];
    }
    if (!paymentMethods.useFinancing) {
        saleData.financing_amount_ars = 0;
        saleData.financing_bank = '';
        saleData.financing_installments = 0;
        saleData.financing_installment_value = 0;
    }

    onSubmit(saleData);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Button variant="outline" onClick={onCancel} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="text-2xl">{sale ? 'Editar Venta' : 'Nueva Venta'}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => handleChange('sale_date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <Input
                    value={formData.seller}
                    onChange={(e) => handleChange('seller', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Cliente *</Label>
                  <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Nombre completo *" value={newClientData.full_name} onChange={(e) => setNewClientData(prev => ({ ...prev, full_name: e.target.value }))} required />
                        <Input placeholder="DNI" value={newClientData.dni} onChange={(e) => setNewClientData(prev => ({ ...prev, dni: e.target.value }))} />
                        <Input placeholder="CUIT/CUIL" value={newClientData.cuit_cuil} onChange={(e) => setNewClientData(prev => ({ ...prev, cuit_cuil: e.target.value }))} />
                        <Input placeholder="Teléfono *" value={newClientData.phone} onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))} required />
                        <Input placeholder="Email" type="email" value={newClientData.email} onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))} />
                        <Button type="button" onClick={() => createClientMutation.mutate(newClientData)} className="w-full" disabled={createClientMutation.isPending || !newClientData.full_name || !newClientData.phone}>
                          {createClientMutation.isPending ? 'Creando...' : 'Crear Cliente'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input placeholder="Buscar cliente por nombre, DNI o teléfono..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                <Select value={formData.client_id} onValueChange={handleClientChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.full_name} - {client.phone} {client.dni ? `- ${client.dni}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vehículo *</Label>
                <Input placeholder="Buscar vehículo por marca, modelo o dominio..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} />
                <Select value={formData.vehicle_id} onValueChange={handleVehicleChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} {vehicle.year} - {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold mb-4">Precio de Venta</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Precio ARS</Label>
                    <Input type="number" value={formData.sale_price_ars} onChange={(e) => handleChange('sale_price_ars', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Precio</Label>
                    <Input type="date" value={formData.sale_price_date} onChange={(e) => handleChange('sale_price_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio USD (Auto)</Label>
                    <Input type="number" value={formData.sale_price_usd} disabled />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">Métodos de Pago</h3>
                
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox id="useDeposit" checked={paymentMethods.useDeposit} onCheckedChange={(checked) => setPaymentMethods({...paymentMethods, useDeposit: checked})} />
                  <label htmlFor="useDeposit" className="text-sm font-medium cursor-pointer">Seña</label>
                </div>

                {paymentMethods.useDeposit && (
                  <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold">Seña</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input type="number" placeholder="Monto ARS" value={formData.deposit_amount_ars} onChange={(e) => handleChange('deposit_amount_ars', parseFloat(e.target.value))} />
                        <Input type="date" value={formData.deposit_date} onChange={(e) => handleChange('deposit_date', e.target.value)} />
                        <Input placeholder="Descripción" value={formData.deposit_description} onChange={(e) => handleChange('deposit_description', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox id="useCashPayment" checked={paymentMethods.useCashPayment} onCheckedChange={(checked) => setPaymentMethods({...paymentMethods, useCashPayment: checked})} />
                  <label htmlFor="useCashPayment" className="text-sm font-medium cursor-pointer">Pago al Contado</label>
                </div>

                {paymentMethods.useCashPayment && (
                  <Card className="mb-6 border-2 border-green-200 bg-green-50">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold">Pagos al Contado</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input type="number" placeholder="Monto ARS" value={newCashPayment.amount_ars} onChange={(e) => setNewCashPayment({...newCashPayment, amount_ars: parseFloat(e.target.value)})} />
                        <Input type="date" value={newCashPayment.date} onChange={(e) => setNewCashPayment({...newCashPayment, date: e.target.value})} />
                        <Input placeholder="Descripción" value={newCashPayment.description} onChange={(e) => setNewCashPayment({...newCashPayment, description: e.target.value})} />
                      </div>
                      <Button type="button" onClick={handleAddCashPayment} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        {editingCashPaymentIndex !== null ? 'Actualizar Pago' : 'Agregar Pago'}
                      </Button>
                      {formData.cash_payments.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {formData.cash_payments.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded">
                              <span>${payment.amount_ars?.toLocaleString('es-AR')} - {payment.date} - {payment.description}</span>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleEditCashPayment(index)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleChange('cash_payments', formData.cash_payments.filter((_, i) => i !== index))}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox id="useTradeIn" checked={paymentMethods.useTradeIn} onCheckedChange={(checked) => setPaymentMethods({...paymentMethods, useTradeIn: checked})} />
                  <label htmlFor="useTradeIn" className="text-sm font-medium cursor-pointer">Permuta</label>
                </div>

                {paymentMethods.useTradeIn && (
                  <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold">Vehículo en Permuta</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input placeholder="Marca *" value={newTradeIn.brand} onChange={(e) => setNewTradeIn({...newTradeIn, brand: e.target.value})} />
                        <Input placeholder="Modelo *" value={newTradeIn.model} onChange={(e) => setNewTradeIn({...newTradeIn, model: e.target.value})} />
                        <Input type="number" placeholder="Año" value={newTradeIn.year} onChange={(e) => setNewTradeIn({...newTradeIn, year: parseInt(e.target.value)})} />
                        <Input placeholder="Dominio" value={newTradeIn.plate} onChange={(e) => setNewTradeIn({...newTradeIn, plate: e.target.value})} />
                        <Input placeholder="Color" value={newTradeIn.color} onChange={(e) => setNewTradeIn({...newTradeIn, color: e.target.value})} />
                        <Input type="number" placeholder="Kilometraje" value={newTradeIn.kilometers} onChange={(e) => setNewTradeIn({...newTradeIn, kilometers: parseInt(e.target.value)})} />
                        <Input placeholder="Marca Motor" value={newTradeIn.engine_brand} onChange={(e) => setNewTradeIn({...newTradeIn, engine_brand: e.target.value})} />
                        <Input placeholder="N° Motor" value={newTradeIn.engine_number} onChange={(e) => setNewTradeIn({...newTradeIn, engine_number: e.target.value})} />
                        <Input placeholder="Marca Chasis" value={newTradeIn.chassis_brand} onChange={(e) => setNewTradeIn({...newTradeIn, chassis_brand: e.target.value})} />
                        <Input placeholder="N° Chasis" value={newTradeIn.chassis_number} onChange={(e) => setNewTradeIn({...newTradeIn, chassis_number: e.target.value})} />
                        <Input placeholder="Ciudad Radicación" value={newTradeIn.registration_city} onChange={(e) => setNewTradeIn({...newTradeIn, registration_city: e.target.value})} />
                        <Input placeholder="Provincia Radicación" value={newTradeIn.registration_province} onChange={(e) => setNewTradeIn({...newTradeIn, registration_province: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor de Toma (ARS)</Label>
                        <Input type="number" value={newTradeIn.value_ars} onChange={(e) => setNewTradeIn({...newTradeIn, value_ars: parseFloat(e.target.value)})} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="is_supplier_owner_tradein" checked={newTradeIn.is_supplier_owner} onCheckedChange={(checked) => setNewTradeIn({...newTradeIn, is_supplier_owner: checked})} />
                        <label htmlFor="is_supplier_owner_tradein" className="text-sm font-medium cursor-pointer">El proveedor es titular</label>
                      </div>
                      <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea value={newTradeIn.observations} onChange={(e) => setNewTradeIn({...newTradeIn, observations: e.target.value})} rows={2} />
                      </div>
                      <Button type="button" onClick={handleAddTradeIn} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        {editingTradeInIndex !== null ? 'Actualizar Permuta' : 'Agregar Permuta'}
                      </Button>
                      {formData.trade_ins && formData.trade_ins.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {formData.trade_ins.map((tradeIn, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded">
                              <div>
                                <p className="font-semibold">{tradeIn.brand} {tradeIn.model} {tradeIn.year}</p>
                                <p className="text-sm">Dom: {tradeIn.plate || 'N/A'} | Motor: {tradeIn.engine_number || 'N/A'} | Chasis: {tradeIn.chassis_number || 'N/A'}</p>
                                <p className="text-sm">Valor: ${tradeIn.value_ars?.toLocaleString('es-AR')} {tradeIn.is_supplier_owner && '• Titular'}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleEditTradeIn(index)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleChange('trade_ins', formData.trade_ins.filter((_, i) => i !== index))}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox id="useFinancing" checked={paymentMethods.useFinancing} onCheckedChange={(checked) => setPaymentMethods({...paymentMethods, useFinancing: checked})} />
                  <label htmlFor="useFinancing" className="text-sm font-medium cursor-pointer">Financiación</label>
                </div>

                {paymentMethods.useFinancing && (
                  <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold">Financiación</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Monto (ARS)</Label>
                          <Input type="number" value={formData.financing_amount_ars} onChange={(e) => handleChange('financing_amount_ars', parseFloat(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Banco</Label>
                          <Input value={formData.financing_bank} onChange={(e) => handleChange('financing_bank', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cuotas</Label>
                          <Input type="number" value={formData.financing_installments} onChange={(e) => handleChange('financing_installments', parseInt(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Cuota (ARS)</Label>
                          <Input type="number" value={formData.financing_installment_value} onChange={(e) => handleChange('financing_installment_value', parseFloat(e.target.value))} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Documentos Adjuntos</h3>
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Button type="button" size="sm" disabled={uploading} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Subiendo...' : 'Adjuntar'}
                      </span>
                    </Button>
                  </label>
                  <input id="document-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                </div>
                
                {formData.documents && formData.documents.length > 0 && (
                  <div className="space-y-2">
                    {formData.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm truncate">{doc.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDocument(index)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={formData.observations} onChange={(e) => handleChange('observations', e.target.value)} rows={3} />
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-100 p-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Guardar Venta'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}