import { CartItem, DeliveryAddress } from '../types';

export const WHATSAPP_PHONE_NUMBER = '35679791146';
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_PHONE_NUMBER}`;
export const STORE_ADDRESS = 'Vat 30384926, Central store. Triq weid il ghajan  haz zabbar';
export const STORE_CONTACT_PHONE = '79791146';

export interface WhatsAppOrderDetails {
  items: CartItem[];
  address: DeliveryAddress;
  deliverySlot: 'instant_bolt' | 'today_evening' | 'tomorrow_morning' | string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  finalTotal: number;
  promoCode?: string;
  orderNumber?: string;
}

export function buildWhatsAppOrderMessage(details: WhatsAppOrderDetails): string {
  const {
    items,
    address,
    deliverySlot,
    subtotal,
    discountAmount,
    deliveryFee,
    finalTotal,
    promoCode,
    orderNumber
  } = details;

  const slotLabel = 
    deliverySlot === 'instant_bolt' ? '⚡ 15-25 Mins Instant Bolt' :
    deliverySlot === 'today_evening' ? '🌆 Today Evening (18:00 – 20:00)' :
    deliverySlot === 'tomorrow_morning' ? '🌅 Tomorrow Morning (08:00 – 10:00)' :
    deliverySlot;

  let msg = `🛒 *NEW ORDER - DESI BOLT MALTA*\n`;
  if (orderNumber) {
    msg += `🔖 *Order Ref:* #${orderNumber}\n`;
  }
  msg += `─────────────────────────\n`;
  msg += `👤 *Customer:* ${address.fullName?.trim() || 'Valued Customer'}\n`;
  msg += `📞 *Phone:* ${address.phone?.trim() || STORE_CONTACT_PHONE}\n`;
  msg += `📍 *Locality:* ${address.locality || 'Malta'}\n`;
  if (address.street) {
    msg += `🏠 *Address:* ${address.street}${address.postalCode ? ` (${address.postalCode})` : ''}\n`;
  }
  if (address.notes) {
    msg += `📝 *Notes:* ${address.notes}\n`;
  }
  msg += `⏱️ *Delivery Speed:* ${slotLabel}\n`;
  msg += `─────────────────────────\n`;
  msg += `🛍️ *ORDER ITEMS (${items.length}):*\n`;

  items.forEach((item, idx) => {
    const itemTotal = (item.product.price * item.quantity).toFixed(2);
    msg += `${idx + 1}. *${item.product.name}* (${item.product.unit || '1 pc'}) x${item.quantity} = €${itemTotal}\n`;
  });

  msg += `─────────────────────────\n`;
  msg += `💵 *Subtotal:* €${subtotal.toFixed(2)}\n`;
  if (discountAmount > 0) {
    msg += `🎟️ *Promo Discount (${promoCode || 'Applied'}):* -€${discountAmount.toFixed(2)}\n`;
  }
  msg += `🚚 *Delivery Fee:* ${deliveryFee === 0 ? 'FREE (€0.00)' : `€${deliveryFee.toFixed(2)}`}\n`;
  msg += `👉 *TOTAL AMOUNT TO PAY: €${finalTotal.toFixed(2)}*\n`;
  msg += `─────────────────────────\n`;
  msg += `🏬 *Store:* ${STORE_ADDRESS}\n`;
  msg += `📞 *Helpdesk:* ${STORE_CONTACT_PHONE}\n\n`;
  msg += `Please confirm my order and start delivery! 🚀`;

  return msg;
}

export function getWhatsAppOrderUrl(details: WhatsAppOrderDetails): string {
  const message = buildWhatsAppOrderMessage(details);
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}
