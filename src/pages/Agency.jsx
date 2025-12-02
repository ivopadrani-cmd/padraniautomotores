import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, User, Edit, Trash2, Phone, Mail, Building2, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import ClauseTemplates from "../components/settings/ClauseTemplates";
import UserDetailDialog from "../components/agency/UserDetailDialog";

export default function Agency() {
  // Reset to list when clicking module in sidebar
  React.useEffect(() => {
    const handleReset = (e) => {
      if (e.detail === 'Agency') {
        setShowUserForm(false);
        setShowBranchForm(false);
        setEditingUser(null);
        setEditingBranch(null);
      }
    };
    window.addEventListener('resetModuleView', handleReset);
    return () => window.removeEventListener('resetModuleView', handleReset);
  }, []);
  const [activeTab, setActiveTab] = useState('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFormData, setUserFormData] = useState({ full_name: '', phone: '', email: '', role: 'Vendedor', is_active: true });
  const [branchFormData, setBranchFormData] = useState({ name: '', address: '', city: '', province: '', phone: '', is_main: false });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [agencyFormData, setAgencyFormData] = useState({
    business_name: '', legal_name: '', cuit: '', representative_name: '', representative_dni: '',
    address: '', city: '', province: '', postal_code: '', phone: '', email: '', logo_url: ''
  });

  const queryClient = useQueryClient();

  const { data: users = [], isLoading: loadingUsers } = useQuery({ queryKey: ['sellers'], queryFn: () => base44.entities.Seller.list() });
  const { data: branches = [], isLoading: loadingBranches } = useQuery({ queryKey: ['branches'], queryFn: () => base44.entities.Branch.list() });
  const { data: agencySettings, isLoading: loadingAgency } = useQuery({ 
    queryKey: ['agency-settings'], 
    queryFn: async () => { const settings = await base44.entities.AgencySettings.list(); return settings[0] || null; } 
  });

  React.useEffect(() => {
    if (agencySettings) {
      setAgencyFormData({
        business_name: agencySettings.business_name || '',
        legal_name: agencySettings.legal_name || '',
        cuit: agencySettings.cuit || '',
        representative_name: agencySettings.representative_name || '',
        representative_dni: agencySettings.representative_dni || '',
        address: agencySettings.address || '',
        city: agencySettings.city || '',
        province: agencySettings.province || '',
        postal_code: agencySettings.postal_code || '',
        phone: agencySettings.phone || '',
        email: agencySettings.email || '',
        logo_url: agencySettings.logo_url || ''
      });
    }
  }, [agencySettings]);

  const createUserMutation = useMutation({
    mutationFn: (data) => base44.entities.Seller.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sellers'] }); resetUserForm(); toast.success("Usuario creado"); },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Seller.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sellers'] }); resetUserForm(); toast.success("Usuario actualizado"); },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.Seller.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sellers'] }); toast.success("Usuario eliminado"); },
  });

  const createBranchMutation = useMutation({
    mutationFn: (data) => base44.entities.Branch.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); resetBranchForm(); toast.success("Sucursal creada"); },
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Branch.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); resetBranchForm(); toast.success("Sucursal actualizada"); },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (id) => base44.entities.Branch.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); toast.success("Sucursal eliminada"); },
  });


  const saveAgencyMutation = useMutation({
    mutationFn: async (data) => {
      if (agencySettings?.id) {
        return base44.entities.AgencySettings.update(agencySettings.id, data);
      } else {
        return base44.entities.AgencySettings.create(data);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agency-settings'] }); toast.success("Datos de agencia guardados"); },
  });

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedUsers.length} usuario(s)?`)) return;
    for (const id of selectedUsers) await base44.entities.Seller.delete(id);
    setSelectedUsers([]);
    queryClient.invalidateQueries({ queryKey: ['sellers'] });
    toast.success(`${selectedUsers.length} usuario(s) eliminado(s)`);
  };

  const handleBulkDeleteBranches = async () => {
    if (selectedBranches.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedBranches.length} sucursal(es)?`)) return;
    for (const id of selectedBranches) await base44.entities.Branch.delete(id);
    setSelectedBranches([]);
    queryClient.invalidateQueries({ queryKey: ['branches'] });
    toast.success(`${selectedBranches.length} sucursal(es) eliminada(s)`);
  };

  const resetUserForm = () => { setShowUserForm(false); setEditingUser(null); setUserFormData({ full_name: '', phone: '', email: '', role: 'Vendedor', is_active: true }); };
  const resetBranchForm = () => { setShowBranchForm(false); setEditingBranch(null); setBranchFormData({ name: '', address: '', city: '', province: '', phone: '', is_main: false }); };
  const resetUserForm = () => { setShowUserForm(false); setEditingUser(null); setUserFormData({ full_name: '', phone: '', email: '', role: 'Vendedor', is_active: true }); };
  const resetBranchForm = () => { setShowBranchForm(false); setEditingBranch(null); setBranchFormData({ name: '', address: '', city: '', province: '', phone: '', is_main: false }); };

  const handleEditUser = (user) => { setEditingUser(user); setUserFormData({ full_name: user.full_name, phone: user.phone || '', email: user.email || '', role: user.role || 'Vendedor', is_active: user.is_active !== false }); setShowUserForm(true); };
  const handleEditBranch = (branch) => { setEditingBranch(branch); setBranchFormData({ name: branch.name, address: branch.address || '', city: branch.city || '', province: branch.province || '', phone: branch.phone || '', is_main: branch.is_main || false }); setShowBranchForm(true); };

  const handleSubmitUser = (e) => { e.preventDefault(); editingUser ? updateUserMutation.mutate({ id: editingUser.id, data: userFormData }) : createUserMutation.mutate(userFormData); };
  const handleSubmitBranch = (e) => { e.preventDefault(); editingBranch ? updateBranchMutation.mutate({ id: editingBranch.id, data: branchFormData }) : createBranchMutation.mutate(branchFormData); };


  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredBranches = branches.filter(b => b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.city?.toLowerCase().includes(searchTerm.toLowerCase()));

  const inp = "h-8 text-[11px] bg-white";
  const lbl = "text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <div className="p-3 md:p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900">Agencia</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(''); }}>
          <TabsList className="h-9">
            <TabsTrigger value="agency" className="text-[11px]">Datos Agencia</TabsTrigger>
            <TabsTrigger value="users" className="text-[11px]">Usuarios</TabsTrigger>
            <TabsTrigger value="branches" className="text-[11px]">Sucursales</TabsTrigger>
            <TabsTrigger value="templates" className="text-[11px]">Plantillas</TabsTrigger>
          </TabsList>

          <TabsContent value="agency" className="mt-3 space-y-3">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-[12px] font-semibold text-gray-900 mb-3">Datos de la Agencia</p>
                <p className="text-[10px] text-gray-500 mb-4">Estos datos se utilizan en boletos, contratos y documentos oficiales.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className={lbl}>Nombre Comercial *</Label><Input className={inp} value={agencyFormData.business_name} onChange={(e) => setAgencyFormData({...agencyFormData, business_name: e.target.value})} placeholder="Ej: PADRANI AUTOMOTORES" /></div>
                    <div><Label className={lbl}>Razón Social</Label><Input className={inp} value={agencyFormData.legal_name} onChange={(e) => setAgencyFormData({...agencyFormData, legal_name: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className={lbl}>CUIT</Label><Input className={inp} value={agencyFormData.cuit} onChange={(e) => setAgencyFormData({...agencyFormData, cuit: e.target.value})} placeholder="Ej: 20-12320784-0" /></div>
                    <div><Label className={lbl}>Representante Legal</Label><Input className={inp} value={agencyFormData.representative_name} onChange={(e) => setAgencyFormData({...agencyFormData, representative_name: e.target.value})} /></div>
                    <div><Label className={lbl}>DNI Representante</Label><Input className={inp} value={agencyFormData.representative_dni} onChange={(e) => setAgencyFormData({...agencyFormData, representative_dni: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2"><Label className={lbl}>Dirección</Label><Input className={inp} value={agencyFormData.address} onChange={(e) => setAgencyFormData({...agencyFormData, address: e.target.value})} placeholder="Ej: Namuncurá 283" /></div>
                    <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={agencyFormData.city} onChange={(e) => setAgencyFormData({...agencyFormData, city: e.target.value})} placeholder="Ej: Comodoro Rivadavia" /></div>
                    <div><Label className={lbl}>Provincia</Label><Input className={inp} value={agencyFormData.province} onChange={(e) => setAgencyFormData({...agencyFormData, province: e.target.value})} placeholder="Ej: Chubut" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className={lbl}>Código Postal</Label><Input className={inp} value={agencyFormData.postal_code} onChange={(e) => setAgencyFormData({...agencyFormData, postal_code: e.target.value})} /></div>
                    <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={agencyFormData.phone} onChange={(e) => setAgencyFormData({...agencyFormData, phone: e.target.value})} placeholder="Ej: 2976258171" /></div>
                    <div><Label className={lbl}>Email</Label><Input className={inp} type="email" value={agencyFormData.email} onChange={(e) => setAgencyFormData({...agencyFormData, email: e.target.value})} /></div>
                  </div>
                  <div><Label className={lbl}>URL del Logo</Label><Input className={inp} value={agencyFormData.logo_url} onChange={(e) => setAgencyFormData({...agencyFormData, logo_url: e.target.value})} placeholder="https://..." /></div>
                  <div className="flex justify-end pt-3 border-t">
                    <Button onClick={() => saveAgencyMutation.mutate(agencyFormData)} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800" disabled={saveAgencyMutation.isPending}>
                      {saveAgencyMutation.isPending ? 'Guardando...' : 'Guardar Datos'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-[11px] bg-white" />
              </div>
              {selectedUsers.length > 0 && (
                <Button variant="outline" onClick={handleBulkDeleteUsers} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar ({selectedUsers.length})
                </Button>
              )}
              {selectionMode ? (
                <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedUsers([]); }} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">Cancelar selección</Button>
              ) : (
                <Button variant="outline" onClick={() => setSelectionMode(true)} className="h-8 text-[11px]">Selección múltiple</Button>
              )}
              <Button onClick={() => setShowUserForm(true)} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo usuario
              </Button>
            </div>

            <Dialog open={showUserForm} onOpenChange={(open) => { if (!open) resetUserForm(); }}>
              <DialogContent className="max-w-md p-0">
                <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg"><DialogTitle className="text-sm font-semibold">{editingUser ? 'Editar' : 'Nuevo'} Usuario</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitUser} className="p-4 space-y-3">
                  <div><Label className={lbl}>Nombre *</Label><Input className={inp} value={userFormData.full_name} onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={userFormData.phone} onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })} /></div>
                    <div><Label className={lbl}>Email</Label><Input className={inp} type="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label className={lbl}>Rol</Label>
                    <Select value={userFormData.role} onValueChange={(v) => setUserFormData({ ...userFormData, role: v })}>
                      <SelectTrigger className={inp}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Vendedor', 'Administrador', 'Gerente', 'Gestor', 'Comisionista', 'Mecánico'].map(r => <SelectItem key={r} value={r} className="text-[11px]">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={resetUserForm} className="h-8 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">{editingUser ? 'Guardar' : 'Crear'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" /></div>
                ) : filteredUsers.length > 0 ? (
                  <div className="divide-y">
                    {selectionMode && (
                      <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                        <Checkbox checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onCheckedChange={() => setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id))} className="h-3.5 w-3.5" />
                        <span className="text-[10px] text-gray-500">Seleccionar todos</span>
                      </div>
                    )}
                    {filteredUsers.map(user => (
                      <div key={user.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${selectedUsers.includes(user.id) ? 'bg-cyan-50' : ''}`} onClick={() => selectionMode ? setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(x => x !== user.id) : [...prev, user.id]) : setViewingUser(user)}>
                        <div className="flex items-center gap-3">
                          {selectionMode && <Checkbox checked={selectedUsers.includes(user.id)} className="h-3.5 w-3.5" onClick={(e) => e.stopPropagation()} />}
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-500" /></div>
                          <div>
                            <p className="font-medium text-[12px]">{user.full_name}</p>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                              {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                              {user.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                          <Badge className={`text-[10px] ${user.is_active !== false ? 'bg-cyan-50 text-cyan-700' : 'bg-gray-100 text-gray-500'}`}>{user.is_active !== false ? 'Activo' : 'Inactivo'}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditUser(user)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar?')) deleteUserMutation.mutate(user.id); }}><Trash2 className="w-3.5 h-3.5 text-gray-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10"><User className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Sin usuarios</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input placeholder="Buscar sucursal..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-[11px] bg-white" />
              </div>
              {selectedBranches.length > 0 && (
                <Button variant="outline" onClick={handleBulkDeleteBranches} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar ({selectedBranches.length})
                </Button>
              )}
              {selectionMode ? (
                <Button variant="outline" onClick={() => { setSelectionMode(false); setSelectedBranches([]); }} className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50">Cancelar selección</Button>
              ) : (
                <Button variant="outline" onClick={() => setSelectionMode(true)} className="h-8 text-[11px]">Selección múltiple</Button>
              )}
              <Button onClick={() => setShowBranchForm(true)} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva sucursal
              </Button>
            </div>

            <Dialog open={showBranchForm} onOpenChange={(open) => { if (!open) resetBranchForm(); }}>
              <DialogContent className="max-w-md p-0">
                <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg"><DialogTitle className="text-sm font-semibold">{editingBranch ? 'Editar' : 'Nueva'} Sucursal</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitBranch} className="p-4 space-y-3">
                  <div><Label className={lbl}>Nombre *</Label><Input className={inp} value={branchFormData.name} onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })} required /></div>
                  <div><Label className={lbl}>Dirección</Label><Input className={inp} value={branchFormData.address} onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className={lbl}>Ciudad</Label><Input className={inp} value={branchFormData.city} onChange={(e) => setBranchFormData({ ...branchFormData, city: e.target.value })} /></div>
                    <div><Label className={lbl}>Provincia</Label><Input className={inp} value={branchFormData.province} onChange={(e) => setBranchFormData({ ...branchFormData, province: e.target.value })} /></div>
                  </div>
                  <div><Label className={lbl}>Teléfono</Label><Input className={inp} value={branchFormData.phone} onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })} /></div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={resetBranchForm} className="h-8 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">{editingBranch ? 'Guardar' : 'Crear'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                {loadingBranches ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" /></div>
                ) : filteredBranches.length > 0 ? (
                  <div className="divide-y">
                    {selectionMode && (
                      <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                        <Checkbox checked={selectedBranches.length === filteredBranches.length && filteredBranches.length > 0} onCheckedChange={() => setSelectedBranches(selectedBranches.length === filteredBranches.length ? [] : filteredBranches.map(b => b.id))} className="h-3.5 w-3.5" />
                        <span className="text-[10px] text-gray-500">Seleccionar todos</span>
                      </div>
                    )}
                    {filteredBranches.map(branch => (
                      <div key={branch.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${selectedBranches.includes(branch.id) ? 'bg-cyan-50' : ''}`} onClick={() => selectionMode && setSelectedBranches(prev => prev.includes(branch.id) ? prev.filter(x => x !== branch.id) : [...prev, branch.id])}>
                        <div className="flex items-center gap-3">
                          {selectionMode && <Checkbox checked={selectedBranches.includes(branch.id)} className="h-3.5 w-3.5" onClick={(e) => e.stopPropagation()} />}
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"><Building2 className="w-4 h-4 text-gray-500" /></div>
                          <div>
                            <p className="font-medium text-[12px]">{branch.name} {branch.is_main && <Badge className="ml-1.5 text-[9px] bg-gray-800 text-white">Principal</Badge>}</p>
                            <p className="text-[10px] text-gray-500">{branch.address}, {branch.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditBranch(branch)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (window.confirm('¿Eliminar?')) deleteBranchMutation.mutate(branch.id); }}><Trash2 className="w-3.5 h-3.5 text-gray-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10"><Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Sin sucursales</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="templates" className="mt-3">
            <ClauseTemplates />
          </TabsContent>
        </Tabs>

        {/* User Detail Dialog */}
        <UserDetailDialog 
          open={!!viewingUser} 
          onOpenChange={(open) => { if (!open) setViewingUser(null); }}
          user={viewingUser}
          onEdit={handleEditUser}
          onDelete={(id) => deleteUserMutation.mutate(id)}
        />
      </div>
    </div>
  );
}