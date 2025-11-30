import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, List, Grid3x3, Trash2, Eye, Edit, Phone, Mail } from "lucide-react";
import ClientForm from "../components/clients/ClientForm";
import ClientDetail from "../components/clients/ClientDetail";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('table');

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_at'),
  });

  const createMutation = useMutation({
    mutationFn: async ({ clientData, spouseData }) => {
      const client = await base44.entities.Client.create(clientData);
      if (spouseData && spouseData.full_name) {
        await base44.entities.Spouse.create({ ...spouseData, client_id: client.id });
      }
      return client;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); setEditingClient(null); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, spouseData }) => {
      await base44.entities.Client.update(id, data);
      if (spouseData) {
        const existingSpouses = await base44.entities.Spouse.filter({ client_id: id });
        if (existingSpouses.length > 0) {
          if (spouseData.full_name) {
            await base44.entities.Spouse.update(existingSpouses[0].id, spouseData);
          } else {
            await base44.entities.Spouse.delete(existingSpouses[0].id);
          }
        } else if (spouseData.full_name) {
          await base44.entities.Spouse.create({ ...spouseData, client_id: id });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); setEditingClient(null); setSelectedClient(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const handleDelete = (clientId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('¿Eliminar este cliente?')) deleteMutation.mutate(clientId);
  };

  const handleSubmit = (clientData, spouseData) => {
    if (editingClient) updateMutation.mutate({ id: editingClient.id, data: clientData, spouseData });
    else createMutation.mutate({ clientData, spouseData });
  };

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = client.full_name?.toLowerCase().includes(search) || client.dni?.toLowerCase().includes(search) || client.phone?.toLowerCase().includes(search);
    return matchesSearch && (filterStatus === 'ALL' || client.client_status === filterStatus);
  });

  if (selectedClient) return <ClientDetail client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={(c) => { setEditingClient(c); setShowForm(true); setSelectedClient(null); }} onDelete={(id) => { deleteMutation.mutate(id); setSelectedClient(null); }} />;
  if (showForm) return <ClientForm client={editingClient} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingClient(null); }} isLoading={createMutation.isPending || updateMutation.isPending} />;

  return (
    <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Clientes</h1>
            <p className="text-[10px] text-gray-500">{filteredClients.length} registros</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="h-7 text-[11px] bg-sky-600 hover:bg-sky-700">
            <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-56">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-7 text-[11px] bg-white" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-7 text-[11px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-[11px]">Todos</SelectItem>
              <SelectItem value="Prospecto" className="text-[11px]">Prospectos</SelectItem>
              <SelectItem value="Cliente" className="text-[11px]">Clientes</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span>Vista:</span>
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => setViewMode('table')}><List className="w-3.5 h-3.5" /></Button>
            <Button variant={viewMode === 'gallery' ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => setViewMode('gallery')}><Grid3x3 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600 mx-auto" /></div>
            ) : filteredClients.length > 0 ? (
              viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left px-2 py-2 font-semibold text-gray-900 text-[11px]">Nombre</th>
                        <th className="text-left px-2 py-2 font-semibold text-gray-900 text-[11px]">DNI</th>
                        <th className="text-left px-2 py-2 font-semibold text-gray-900 text-[11px]">Teléfono</th>
                        <th className="text-left px-2 py-2 font-semibold text-gray-900 text-[11px]">Email</th>
                        <th className="text-left px-2 py-2 font-semibold text-gray-900 text-[11px]">Ciudad</th>
                        <th className="text-left px-2 py-2 font-semibold text-gray-900 text-[11px]">Estado</th>
                        <th className="px-2 py-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="px-2 py-2 font-medium">{c.full_name}</td>
                          <td className="px-2 py-2">{c.dni || '-'}</td>
                          <td className="px-2 py-2">{c.phone}</td>
                          <td className="px-2 py-2">{c.email || '-'}</td>
                          <td className="px-2 py-2">{c.city || '-'}</td>
                          <td className="px-2 py-2">
                            <Badge className={`text-[9px] px-1.5 py-0 ${c.client_status === 'Cliente' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.client_status || 'Cliente'}</Badge>
                          </td>
                          <td className="px-1 py-2">
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedClient(c)}><Eye className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingClient(c); setShowForm(true); }}><Edit className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                  {filteredClients.map((c) => (
                    <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedClient(c)}>
                      <CardContent className="p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><Users className="w-4 h-4 text-gray-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[11px] truncate">{c.full_name}</p>
                            <p className="text-[9px] text-gray-500">{c.dni || '-'}</p>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-[9px] text-gray-600">
                          {c.phone && <div className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</div>}
                          {c.email && <div className="flex items-center gap-1 truncate"><Mail className="w-2.5 h-2.5" />{c.email}</div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-[11px] text-gray-500">Sin clientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}