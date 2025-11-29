import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

const ROLE_COLORS = {
  'Gerente': 'bg-purple-100 text-purple-700',
  'Administrador': 'bg-blue-100 text-blue-700',
  'Vendedor': 'bg-green-100 text-green-700',
  'Gestor': 'bg-amber-100 text-amber-700',
  'Comisionista': 'bg-cyan-100 text-cyan-700',
  'Mecánico': 'bg-gray-100 text-gray-700',
};

export default function UserDetailDialog({ open, onOpenChange, user, onEdit, onDelete }) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 border-b bg-gray-900 text-white rounded-t-lg">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Detalle de Usuario
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Header with avatar and name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[16px] text-gray-900">{user.full_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-[10px] ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                  {user.role || 'Sin rol'}
                </Badge>
                <Badge className={`text-[10px] ${user.is_active !== false ? 'bg-cyan-50 text-cyan-700' : 'bg-red-50 text-red-600'}`}>
                  {user.is_active !== false ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Contacto</p>
            {user.phone && (
              <div className="flex items-center gap-2 text-[12px]">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2 text-[12px]">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{user.email}</span>
              </div>
            )}
            {!user.phone && !user.email && (
              <p className="text-[11px] text-gray-400 italic">Sin datos de contacto</p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-400 text-[9px]">FECHA ALTA</p>
              <p className="font-medium">{user.created_date ? format(new Date(user.created_date), 'dd/MM/yyyy') : '-'}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-400 text-[9px]">ID USUARIO</p>
              <p className="font-medium text-[10px] truncate">{user.user_id || 'Sin vincular'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button 
            variant="outline" 
            className="h-8 text-[11px] border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => {
              if (window.confirm('¿Eliminar este usuario?')) {
                onDelete(user.id);
                onOpenChange(false);
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Eliminar
          </Button>
          <Button 
            className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800"
            onClick={() => {
              onEdit(user);
              onOpenChange(false);
            }}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}