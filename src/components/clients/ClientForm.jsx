import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Users } from "lucide-react";

export default function ClientForm({ client, onSubmit, onCancel, isLoading }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    full_name: client?.full_name || '',
    birth_date: client?.birth_date || '',
    phone: client?.phone || '',
    email: client?.email || '',
    dni: client?.dni || '',
    cuit_cuil: client?.cuit_cuil || '',
    city: client?.city || '',
    province: client?.province || '',
    address: client?.address || '',
    postal_code: client?.postal_code || '',
    marital_status: client?.marital_status || '',
    client_status: client?.client_status || 'Cliente',
    observations: client?.observations || ''
  });

  const [spouseData, setSpouseData] = useState({
    full_name: '',
    dni: '',
    cuit_cuil: '',
    phone: '',
    email: '',
    birth_date: '',
    occupation: ''
  });

  const { data: existingSpouse } = useQuery({
    queryKey: ['spouse', client?.id],
    queryFn: async () => {
      if (!client?.id) return null;
      const spouses = await base44.entities.Spouse.filter({ client_id: client.id });
      return spouses[0] || null;
    },
    enabled: !!client?.id
  });

  useEffect(() => {
    if (existingSpouse) {
      setSpouseData({
        full_name: existingSpouse.full_name || '',
        dni: existingSpouse.dni || '',
        cuit_cuil: existingSpouse.cuit_cuil || '',
        phone: existingSpouse.phone || '',
        email: existingSpouse.email || '',
        birth_date: existingSpouse.birth_date || '',
        occupation: existingSpouse.occupation || ''
      });
    }
  }, [existingSpouse]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpouseChange = (field, value) => {
    setSpouseData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit(formData, formData.marital_status === 'Casado/a' ? spouseData : null);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={onCancel} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-gray-100 p-6">
            <CardTitle className="text-2xl">
              {client ? 'Editar Cliente' : 'Nuevo Cliente'}
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleChange('dni', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuit_cuil">CUIT/CUIL</Label>
                  <Input
                    id="cuit_cuil"
                    value={formData.cuit_cuil}
                    onChange={(e) => handleChange('cuit_cuil', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleChange('province', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Estado Civil</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) => handleChange('marital_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                      <SelectItem value="Casado/a">Casado/a</SelectItem>
                      <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                      <SelectItem value="Viudo/a">Viudo/a</SelectItem>
                      <SelectItem value="Concubinato">Concubinato</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Spouse Section - Only shown when married */}
              {formData.marital_status === 'Casado/a' && (
                <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
                  <CardHeader className="py-3 px-4 border-b bg-gray-100/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      Datos del Cónyuge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouse_name">Nombre Completo *</Label>
                        <Input
                          id="spouse_name"
                          value={spouseData.full_name}
                          onChange={(e) => handleSpouseChange('full_name', e.target.value)}
                          placeholder="Nombre del cónyuge"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouse_dni">DNI</Label>
                        <Input
                          id="spouse_dni"
                          value={spouseData.dni}
                          onChange={(e) => handleSpouseChange('dni', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouse_cuit">CUIT/CUIL</Label>
                        <Input
                          id="spouse_cuit"
                          value={spouseData.cuit_cuil}
                          onChange={(e) => handleSpouseChange('cuit_cuil', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouse_phone">Teléfono</Label>
                        <Input
                          id="spouse_phone"
                          value={spouseData.phone}
                          onChange={(e) => handleSpouseChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouse_birth">Fecha de Nacimiento</Label>
                        <Input
                          id="spouse_birth"
                          type="date"
                          value={spouseData.birth_date}
                          onChange={(e) => handleSpouseChange('birth_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spouse_occupation">Ocupación</Label>
                        <Input
                          id="spouse_occupation"
                          value={spouseData.occupation}
                          onChange={(e) => handleSpouseChange('occupation', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New client status select field */}
              <div className="space-y-2">
                <Label htmlFor="client_status">Estado del Cliente</Label>
                <Select
                  value={formData.client_status}
                  onValueChange={(value) => handleChange('client_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prospecto">Prospecto</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-100 p-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Guardar Cliente'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}