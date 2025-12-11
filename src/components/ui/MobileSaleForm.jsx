import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, Car, User, Search, ChevronDown, ChevronUp, Plus, DollarSign, CreditCard, FileText } from "lucide-react";
import BottomSheet from "./BottomSheet";
import { toast } from "sonner";
import { useDollarHistory } from "@/hooks/useDollarHistory";

export default function MobileSaleForm({
  open,
  onOpenChange,
  vehicle,
  onSaleCreated
}) {
  const queryClient = useQueryClient();
  const { getHistoricalRate } = useDollarHistory();

  // Form state
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    client_name: '',
    seller: '',
    sale_price_value: '',
    sale_price_currency: 'ARS',
    sale_price_exchange_rate: '',
    observations: ''
  });

  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    full_name: '', phone: '', dni: '', email: ''
  });

  // Payment methods
  const [includeDeposit, setIncludeDeposit] = useState(false);
  const [includeCashPayment, setIncludeCashPayment] = useState(false);
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [includeFinancing, setIncludeFinancing] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    client: true,
    price: false,
    payments: false
  });

  // Load clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  // Filtered clients for search
  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone?.includes(clientSearch) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Initialize form data
  useEffect(() => {
    if (vehicle && open) {
      const initializeForm = async () => {
        const blueRate = await getHistoricalRate(new Date().toISOString().split('T')[0]);
        let publicPriceArs = vehicle.public_price_value || '';

        if (vehicle.public_price_currency === 'USD' && vehicle.public_price_value) {
          const rate = vehicle.public_price_exchange_rate || blueRate || 1200;
          publicPriceArs = Math.round(vehicle.public_price_value * rate);
        }

        setFormData({
          sale_date: new Date().toISOString().split('T')[0],
          client_name: '',
          seller: '',
          sale_price_value: publicPriceArs || '',
          sale_price_currency: 'ARS',
          sale_price_exchange_rate: blueRate || '',
          observations: ''
        });
      };

      initializeForm();
    }
  }, [vehicle, open]);

  // Handle form changes
  const handleChange = async (field, value) => {
    if (field === 'sale_date' && value) {
      try {
        const historicalRate = await getHistoricalRate(value);
        if (historicalRate) {
          setFormData(prev => ({
            ...prev,
            sale_date: value,
            sale_price_exchange_rate: historicalRate.toString()
          }));
          return;
        }
      } catch (error) {
        console.error('Error obteniendo cotización histórica:', error);
      }
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested changes for payment methods
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle client selection
  const handleClientSelect = (client) => {
    setSelectedClientId(client.id);
    setFormData(prev => ({ ...prev, client_name: client.full_name }));
    setClientSearch(client.full_name);
  };

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (data) => {
      // Create client if new
      let clientId = selectedClientId;
      if (isNewClient && showNewClientForm) {
        const newClient = await base44.entities.Client.create({
          ...newClientData,
          created_at: new Date().toISOString()
        });
        clientId = newClient.id;
      }

      // Create sale
      const saleData = {
        ...data,
        vehicle_id: vehicle.id,
        client_id: clientId,
        created_at: new Date().toISOString()
      };

      return await base44.entities.Sale.create(saleData);
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Venta creada exitosamente');
      onSaleCreated?.(sale);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creando venta:', error);
      toast.error('Error al crear la venta');
    }
  });

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.client_name) {
      toast.error('Debe seleccionar o crear un cliente');
      return;
    }

    if (!formData.sale_price_value) {
      toast.error('Debe ingresar el precio de venta');
      return;
    }

    createSaleMutation.mutate(formData);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!vehicle) return null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva Venta"
      description={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4">
        {/* Client Section */}
        <Collapsible
          open={expandedSections.client}
          onOpenChange={() => toggleSection('client')}
        >
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente
                  </div>
                  {expandedSections.client ?
                    <ChevronUp className="w-4 h-4" /> :
                    <ChevronDown className="w-4 h-4" />
                  }
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4 space-y-4">
                {/* Client Search */}
                <div>
                  <Label className="text-sm font-medium">Buscar Cliente</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Nombre, teléfono o email..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setSelectedClientId('');
                        setIsNewClient(false);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Client Results */}
                {clientSearch && !selectedClientId && (
                  <div className="max-h-32 overflow-y-auto border rounded-lg">
                    {filteredClients.length > 0 ? (
                      filteredClients.slice(0, 5).map(client => (
                        <button
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="font-medium">{client.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {client.phone} • {client.email}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No se encontraron clientes
                      </div>
                    )}
                  </div>
                )}

                {/* New Client Option */}
                {clientSearch && !selectedClientId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsNewClient(true);
                      setShowNewClientForm(true);
                      setNewClientData({ full_name: clientSearch });
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear nuevo cliente
                  </Button>
                )}

                {/* New Client Form */}
                {showNewClientForm && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium">Datos del Nuevo Cliente</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label className="text-sm">Nombre Completo *</Label>
                        <Input
                          value={newClientData.full_name}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Teléfono *</Label>
                        <Input
                          value={newClientData.phone}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Teléfono"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">DNI</Label>
                        <Input
                          value={newClientData.dni}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, dni: e.target.value }))}
                          placeholder="DNI"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Email</Label>
                        <Input
                          value={newClientData.email}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Email"
                          type="email"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Client */}
                {selectedClientId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        {clients.find(c => c.id === selectedClientId)?.full_name}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Price Section */}
        <Collapsible
          open={expandedSections.price}
          onOpenChange={() => toggleSection('price')}
        >
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Precio de Venta
                  </div>
                  {expandedSections.price ?
                    <ChevronUp className="w-4 h-4" /> :
                    <ChevronDown className="w-4 h-4" />
                  }
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Moneda</Label>
                    <Select
                      value={formData.sale_price_currency}
                      onValueChange={(value) => handleChange('sale_price_currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Precio *</Label>
                    <Input
                      type="number"
                      value={formData.sale_price_value}
                      onChange={(e) => handleChange('sale_price_value', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {formData.sale_price_currency === 'USD' && (
                  <div>
                    <Label className="text-sm">Cotización USD</Label>
                    <Input
                      type="number"
                      value={formData.sale_price_exchange_rate}
                      onChange={(e) => handleChange('sale_price_exchange_rate', e.target.value)}
                      placeholder="Cotización"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm">Fecha de Venta</Label>
                  <Input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => handleChange('sale_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Payment Methods Section */}
        <Collapsible
          open={expandedSections.payments}
          onOpenChange={() => toggleSection('payments')}
        >
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Formas de Pago
                  </div>
                  {expandedSections.payments ?
                    <ChevronUp className="w-4 h-4" /> :
                    <ChevronDown className="w-4 h-4" />
                  }
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deposit"
                    checked={includeDeposit}
                    onCheckedChange={setIncludeDeposit}
                  />
                  <Label htmlFor="deposit" className="text-sm">Incluir Seña</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cash"
                    checked={includeCashPayment}
                    onCheckedChange={setIncludeCashPayment}
                  />
                  <Label htmlFor="cash" className="text-sm">Pago en Efectivo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tradein"
                    checked={includeTradeIn}
                    onCheckedChange={setIncludeTradeIn}
                  />
                  <Label htmlFor="tradein" className="text-sm">Permuta</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="financing"
                    checked={includeFinancing}
                    onCheckedChange={setIncludeFinancing}
                  />
                  <Label htmlFor="financing" className="text-sm">Financiación</Label>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Observations */}
        <Card>
          <CardContent className="pt-4">
            <Label className="text-sm font-medium">Observaciones</Label>
            <Textarea
              value={formData.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              placeholder="Observaciones adicionales..."
              className="mt-1"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createSaleMutation.isPending}
            className="flex-1"
          >
            {createSaleMutation.isPending ? (
              <>Creando...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Venta
              </>
            )}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
