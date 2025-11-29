import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

// Utility to format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 0, remove it
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  // If doesn't start with country code, add Argentina's
  if (!cleaned.startsWith('54')) cleaned = '54' + cleaned;
  // If starts with 54 and next is 9, it's already formatted
  // If starts with 54 and next is NOT 9, add 9 for mobile
  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    cleaned = '549' + cleaned.substring(2);
  }
  return cleaned;
};

// Generate WhatsApp URL
export const getWhatsAppUrl = (phone, message = '') => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return null;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
};

// Quick contact button component
export default function WhatsAppButton({ 
  phone, 
  message = '', 
  className = '', 
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  children 
}) {
  const url = getWhatsAppUrl(phone, message);
  
  if (!url) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button 
        variant={variant} 
        size={size} 
        className={`${className} ${iconOnly ? '' : 'gap-1.5'}`}
      >
        <MessageCircle className={iconOnly ? "w-4 h-4" : "w-3.5 h-3.5"} />
        {!iconOnly && (children || 'WhatsApp')}
      </Button>
    </a>
  );
}

// Floating quick contact button
export function QuickContactButton({ phone, name, className = '' }) {
  const message = `Hola${name ? ` ${name.split(' ')[0]}` : ''}, te contacto de Padrani Automotores.`;
  const url = getWhatsAppUrl(phone, message);
  
  if (!url) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      <Button 
        size="icon"
        className="h-8 w-8 bg-green-500 hover:bg-green-600 rounded-full shadow-lg"
      >
        <MessageCircle className="w-4 h-4 text-white" />
      </Button>
    </a>
  );
}

// Generate quote message for WhatsApp
export const generateQuoteMessage = (quote, vehicle) => {
  const vehicleDesc = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : (quote?.vehicle_description || 'Vehículo');
  const price = quote?.quoted_price_ars || 0;
  const tradeIn = parseFloat(quote?.trade_in?.value_ars) || 0;
  const financing = parseFloat(quote?.financing_amount) || 0;
  const difference = price - tradeIn - financing;
  
  let msg = `¡Hola! Te envío el presupuesto de Padrani Automotores:\n\n`;
  msg += `🚗 *${vehicleDesc}*\n`;
  msg += `💰 Precio: $${price.toLocaleString('es-AR')}\n`;
  if (tradeIn > 0) msg += `🔄 Permuta: -$${tradeIn.toLocaleString('es-AR')}\n`;
  if (financing > 0) msg += `🏦 Financiación: -$${financing.toLocaleString('es-AR')}\n`;
  msg += `\n✅ *${tradeIn > 0 || financing > 0 ? 'Saldo a abonar' : 'Total de contado'}: $${difference.toLocaleString('es-AR')}*\n`;
  msg += `\n_Presupuesto válido por 48hs_`;
  
  return msg;
};

// Generate Gmail URL for email
export const getGmailUrl = (to, subject, body) => {
  const encodedSubject = encodeURIComponent(subject || '');
  const encodedBody = encodeURIComponent(body || '');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to || '')}&su=${encodedSubject}&body=${encodedBody}`;
};

// Generate quote email content
export const generateQuoteEmail = (quote, vehicle, clientName) => {
  const vehicleDesc = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : (quote?.vehicle_description || 'Vehículo');
  const price = quote?.quoted_price_ars || 0;
  const tradeIn = parseFloat(quote?.trade_in?.value_ars) || 0;
  const financing = parseFloat(quote?.financing_amount) || 0;
  const difference = price - tradeIn - financing;
  
  const subject = `Presupuesto ${vehicleDesc} - Padrani Automotores`;
  
  let body = `Hola ${clientName?.split(' ')[0] || ''},\n\n`;
  body += `Te envío el presupuesto solicitado:\n\n`;
  body += `Vehículo: ${vehicleDesc}\n`;
  body += `Precio: $${price.toLocaleString('es-AR')}\n`;
  if (tradeIn > 0) body += `Permuta: -$${tradeIn.toLocaleString('es-AR')}\n`;
  if (financing > 0) body += `Financiación: -$${financing.toLocaleString('es-AR')}\n`;
  body += `\n${tradeIn > 0 || financing > 0 ? 'Saldo a abonar' : 'Total de contado'}: $${difference.toLocaleString('es-AR')}\n`;
  body += `\nPresupuesto válido por 48hs.\n\n`;
  body += `Saludos,\nPadrani Automotores`;
  
  return { subject, body };
};