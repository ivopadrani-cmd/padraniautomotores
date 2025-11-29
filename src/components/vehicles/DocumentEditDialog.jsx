import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, X, Eye, Mail, MessageCircle, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

export default function DocumentEditDialog({ open, onOpenChange, document, index, onSave }) {
  const [docName, setDocName] = useState('');

  useEffect(() => {
    if (document && open) {
      setDocName(document.name || '');
    }
  }, [document, open]);

  const handleSave = () => {
    if (onSave) {
      onSave(index, { ...document, name: docName });
    }
    onOpenChange(false);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(document?.url || '');
      toast.success("URL copiada al portapapeles");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${docName || 'Documento'}: ${document?.url || ''}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(docName || 'Documento');
    const body = encodeURIComponent(`Te comparto el siguiente documento:\n\n${document?.url || ''}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleOpenDrive = () => {
    // Google Drive upload URL - opens Drive upload page
    window.open('https://drive.google.com/drive/my-drive', '_blank');
    // Also copy URL to clipboard for easy pasting
    handleCopyUrl();
    toast.info("URL copiada. Pégala en Drive para subir el archivo.");
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Editar Documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-[10px] text-gray-500">Título del documento</Label>
            <Input 
              className="h-8 text-[11px] mt-1" 
              value={docName} 
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Ej: Cédula verde, Título, etc."
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-[9px] text-gray-500 mb-2 uppercase font-semibold">Acciones</p>
            <div className="grid grid-cols-2 gap-2">
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full h-8 text-[10px]">
                  <Eye className="w-3 h-3 mr-1.5" />Ver documento
                </Button>
              </a>
              <Button variant="outline" className="h-8 text-[10px]" onClick={handleCopyUrl}>
                <Copy className="w-3 h-3 mr-1.5" />Copiar URL
              </Button>
              <Button variant="outline" className="h-8 text-[10px]" onClick={handleShareWhatsApp}>
                <MessageCircle className="w-3 h-3 mr-1.5" />WhatsApp
              </Button>
              <Button variant="outline" className="h-8 text-[10px]" onClick={handleShareEmail}>
                <Mail className="w-3 h-3 mr-1.5" />Email
              </Button>
              <Button variant="outline" className="h-8 text-[10px] col-span-2" onClick={handleOpenDrive}>
                <ExternalLink className="w-3 h-3 mr-1.5" />Subir a Drive
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-8 text-[11px]">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="h-8 text-[11px] bg-gray-900 hover:bg-gray-800">
              <Save className="w-3 h-3 mr-1" />Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}