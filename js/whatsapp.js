// js/whatsapp.js
import { WHATSAPP_NUMBER } from './config.js';

export function generateWhatsAppMessage(cartItems, grandTotal) {
    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    cartItems.forEach(item => {
        message += `*${item.quantity}x ${item.name}* - R$ ${item.totalPrice.toFixed(2)} (Unid: R$ ${item.unitPrice.toFixed(2)})\n`;
        
        let customDetails = [];
        if (item.customizations.selectedVariants?.length > 0) {
            customDetails.push(`Opções: ${item.customizations.selectedVariants.map(v => v.name).join(', ')}`);
        }
        if (item.customizations.removedDefaults?.length > 0) {
            customDetails.push(`Sem: ${item.customizations.removedDefaults.join(', ')}`);
        }
        if (item.customizations.addedExtras?.length > 0) {
            customDetails.push(`Com: ${item.customizations.addedExtras.map(e => `${e.quantity > 1 ? e.quantity + 'x ' : ''}${e.name}`).join(', ')}`);
        }

        if (customDetails.length > 0) {
            message += `  (${customDetails.join('; ')})\n`;
        }
    });
    message += `\n*Total do Pedido: R$ ${grandTotal.toFixed(2)}*\n\n`;
    message += `Aguardando confirmação. Obrigado!`;
    return message;
}

export function sendOrderToWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}