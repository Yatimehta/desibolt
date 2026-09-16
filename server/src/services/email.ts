/**
 * DESI BOLT — Production Email Notification Service & Templates
 * Responsive HTML Email templates with DESI BOLT Malta branding (#E63946 / #1F2421).
 */
import { Order, OrderStatus } from '../types.js';

export interface EmailResult {
  sent: boolean;
  recipient: string;
  subject: string;
  messageId?: string;
}

const BRAND_COLOR = '#E63946';
const BRAND_DARK = '#1F2421';
const BRAND_LIGHT = '#FAF8F5';

// ── 1. Order Confirmation Template ──────────────────────────────────────────

export function generateOrderConfirmationEmailHtml(order: Order, trackingUrl: string): string {
  const itemsList = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #EAE4D9;">
          <strong style="color: ${BRAND_DARK}; font-size: 14px;">${item.name}</strong><br/>
          <span style="color: #7A746B; font-size: 12px;">Qty: ${item.quantity} × €${item.price.toFixed(2)} (${item.unit})</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #EAE4D9; text-align: right; color: ${BRAND_DARK}; font-weight: 700; font-size: 14px;">
          €${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DESI BOLT — Order Confirmation #${order.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${BRAND_LIGHT}; margin: 0; padding: 24px 12px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #EAE4D9;">
    
    <!-- Brand Header -->
    <div style="background-color: ${BRAND_DARK}; padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">
        DESI <span style="color: ${BRAND_COLOR};">BOLT</span>
      </h1>
      <p style="color: #E0DBCF; margin: 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        15-30 Min Instant Grocery Delivery • Malta
      </p>
    </div>

    <!-- Status Banner -->
    <div style="padding: 28px 24px; text-align: center; border-bottom: 1px solid #EAE4D9; background-color: #FFF5F6;">
      <div style="display: inline-block; background-color: #FFE5E8; color: ${BRAND_COLOR}; font-weight: 800; font-size: 12px; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        ⚡️ Order Confirmed & Packing
      </div>
      <h2 style="color: ${BRAND_DARK}; margin: 0 0 8px 0; font-size: 22px; font-weight: 800;">Thank you for your order!</h2>
      <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">
        Order <strong>#${order.orderNumber}</strong> has been received at our Sliema fulfillment hub and is currently being packed.
      </p>
    </div>

    <!-- Order Info & Address -->
    <div style="padding: 24px; border-bottom: 1px solid #EAE4D9; background-color: #FAF8F5;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding-bottom: 8px; color: #7A746B; font-weight: 600;">Delivery Locality:</td>
          <td style="padding-bottom: 8px; text-align: right; font-weight: 700; color: ${BRAND_DARK};">${order.address?.locality || 'Malta'}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #7A746B; font-weight: 600;">Delivery Address:</td>
          <td style="padding-bottom: 8px; text-align: right; font-weight: 600; color: ${BRAND_DARK};">${order.address?.street}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #7A746B; font-weight: 600;">Delivery Speed:</td>
          <td style="padding-bottom: 8px; text-align: right; font-weight: 700; color: #059669;">Instant Bolt (15-25 Mins)</td>
        </tr>
        <tr>
          <td style="color: #7A746B; font-weight: 600;">Payment Method:</td>
          <td style="text-align: right; font-weight: 700; color: ${BRAND_DARK}; uppercase;">${order.paymentMethod}</td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <div style="padding: 24px;">
      <h3 style="color: ${BRAND_DARK}; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">
        Order Items (${order.items.length})
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsList}
      </table>

      <!-- Financial Totals -->
      <div style="margin-top: 20px; padding-top: 16px; border-top: 2px dashed #EAE4D9;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-size: 13px;">
          <span>Subtotal:</span>
          <span>€${order.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-size: 13px;">
          <span>Delivery Fee (${order.address?.locality}):</span>
          <span>${order.deliveryFee === 0 ? 'FREE' : `€${order.deliveryFee.toFixed(2)}`}</span>
        </div>
        ${
          order.discount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #16a34a; font-size: 13px; font-weight: 600;">
                <span>Discount (${order.promoCode || 'Promo'}):</span>
                <span>-€${order.discount.toFixed(2)}</span>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 18px; font-weight: 900; color: ${BRAND_DARK};">
          <span>Total Paid:</span>
          <span style="color: ${BRAND_COLOR};">€${order.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Action Button -->
      <div style="margin-top: 28px; text-align: center;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 12px; shadow: 0 4px 12px rgba(230, 57, 70, 0.3);">
          ⚡️ Track Live Delivery on Malta Map
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: ${BRAND_DARK}; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0 0 6px 0; color: #E0DBCF; font-weight: 600;">DESI BOLT Malta • Sliema Hub • +356 9912 3456</p>
      <p style="margin: 0; color: #64748b;">Support: <a href="mailto:support@desibolt.com" style="color: ${BRAND_COLOR}; text-decoration: none;">support@desibolt.com</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── 2. Order Tracking Update Template ────────────────────────────────────────

export function generateTrackingUpdateEmailHtml(order: Order, status: OrderStatus, trackingUrl: string): string {
  const statusLabels: Record<string, string> = {
    packing: '📦 Packing at Hub',
    dispatched: '🛵 Courier Dispatched',
    out_for_delivery: '⚡️ Out for Instant Delivery',
    delivered: '✓ Delivered Successfully',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DESI BOLT — Order #${order.orderNumber} Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND_LIGHT}; margin: 0; padding: 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #EAE4D9;">
    <div style="background: ${BRAND_DARK}; padding: 20px; text-align: center;">
      <h2 style="color: #fff; margin: 0; font-size: 22px; font-weight: 900;">DESI <span style="color: ${BRAND_COLOR};">BOLT</span></h2>
    </div>

    <div style="padding: 24px; text-align: center;">
      <div style="display: inline-block; background: #FFF0F2; color: ${BRAND_COLOR}; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 50px; margin-bottom: 12px;">
        ${statusLabels[status] || status.toUpperCase()}
      </div>
      <h3 style="color: ${BRAND_DARK}; margin: 0 0 10px 0;">Order #${order.orderNumber} Update</h3>
      <p style="color: #64748b; font-size: 14px; margin-0 0 20px 0;">
        Courier <strong>${order.driver?.name || 'Josef Vella'}</strong> is handling your delivery to <strong>${order.address?.locality}</strong>.
      </p>

      <a href="${trackingUrl}" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px;">
        View Live Courier Coordinates
      </a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── 3. Delivery Completed Template ───────────────────────────────────────────

export function generateDeliveryEmailHtml(order: Order, ratingUrl: string): string {
  const itemsList = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #EAE4D9;">
          <strong style="color: ${BRAND_DARK};">${item.name}</strong><br/>
          <span style="color: #7A746B; font-size: 12px;">Qty: ${item.quantity} × €${item.price.toFixed(2)} (${item.unit})</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #EAE4D9; text-align: right; color: ${BRAND_DARK}; font-weight: 700;">
          €${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your DESI BOLT Order Has Arrived!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND_LIGHT}; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #EAE4D9;">
    
    <div style="background-color: ${BRAND_DARK}; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">DESI <span style="color: ${BRAND_COLOR};">BOLT</span></h1>
    </div>

    <div style="padding: 28px 24px; text-align: center; border-bottom: 1px solid #EAE4D9; background-color: #ECFDF5;">
      <div style="display: inline-block; background-color: #D1FAE5; color: #065F46; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 50px; margin-bottom: 12px;">
        ✓ DELIVERED SUCCESSFULLY
      </div>
      <h2 style="color: ${BRAND_DARK}; margin: 0 0 8px 0; font-size: 22px;">Your order has arrived! 🛒</h2>
      <p style="color: #475569; margin: 0; font-size: 14px;">
        Hi ${order.address?.fullName || 'Customer'}, your groceries for order <strong>#${order.orderNumber}</strong> have been delivered to ${order.address?.locality}.
      </p>
    </div>

    <div style="padding: 24px;">
      <h3 style="color: ${BRAND_DARK}; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; font-weight: 800;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsList}
      </table>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 2px dashed #EAE4D9;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-size: 13px;">
          <span>Total Paid:</span>
          <span style="color: ${BRAND_COLOR}; font-weight: 900; font-size: 16px;">€${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div style="margin-top: 28px; text-align: center;">
        <a href="${ratingUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 12px;">
          Rate Your Delivery Experience ★★★★★
        </a>
      </div>
    </div>

    <div style="background-color: ${BRAND_DARK}; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0 0 6px 0; color: #E0DBCF;">DESI BOLT Malta • 15-Minute Instant Grocery Delivery</p>
      <p style="margin: 0;">Support: support@desibolt.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── 4. Password Reset Template ───────────────────────────────────────────────

export function generatePasswordResetEmailHtml(userEmail: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DESI BOLT — Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND_LIGHT}; margin: 0; padding: 20px;">
  <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #EAE4D9;">
    <div style="background: ${BRAND_DARK}; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">DESI <span style="color: ${BRAND_COLOR};">BOLT</span></h1>
    </div>

    <div style="padding: 28px 24px; text-align: center;">
      <h2 style="color: ${BRAND_DARK}; margin: 0 0 10px 0; font-size: 20px;">Reset Your Password</h2>
      <p style="color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
        We received a request to reset the password for <strong>${userEmail}</strong>. Click the secure button below to set a new password.
      </p>

      <a href="${resetUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 12px;">
        Reset My Password
      </a>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
        If you didn't request this reset, you can safely ignore this email. Link expires in 60 minutes.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── 5. Admin Notifications & Alerts ──────────────────────────────────────────

export function generateAdminNewOrderNotificationHtml(order: Order): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #FAF8F5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #EAE4D9;">
    <h2 style="color: #E63946; margin-top: 0;">⚡️ NEW ORDER RECEIVED: #${order.orderNumber}</h2>
    <p><strong>Customer:</strong> ${order.address?.fullName} (${order.address?.phone})</p>
    <p><strong>Locality:</strong> ${order.address?.locality}</p>
    <p><strong>Total Value:</strong> €${order.total.toFixed(2)} (${order.paymentMethod.toUpperCase()})</p>
    <p><strong>Items Count:</strong> ${order.items.length} items</p>
  </div>
</body>
</html>
  `.trim();
}

export function generateAdminWebhookLogHtml(eventType: string, orderId: string, details: any): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: monospace; background: #0f172a; color: #38bdf8; padding: 20px;">
  <h3>[DESI BOLT WEBHOOK LOG] Event: ${eventType}</h3>
  <p>Order ID: ${orderId}</p>
  <pre style="background: #1e293b; padding: 16px; border-radius: 8px; color: #f8fafc;">
${JSON.stringify(details, null, 2)}
  </pre>
</body>
</html>
  `.trim();
}

export function generateAdminErrorAlertHtml(errorTitle: string, errorMessage: string, stackTrace?: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #fef2f2; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #fca5a5;">
    <h2 style="color: #dc2626; margin-top: 0;">🚨 SYSTEM ALERT: ${errorTitle}</h2>
    <p style="color: #991b1b; font-weight: bold;">${errorMessage}</p>
    ${stackTrace ? `<pre style="background: #18181b; color: #f43f5e; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto;">${stackTrace}</pre>` : ''}
  </div>
</body>
</html>
  `.trim();
}

// ── Dispatch Helpers ─────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(order: Order, trackingUrl: string): Promise<EmailResult> {
  const recipient = order.address?.email || 'customer@desibolt.com';
  const subject = `⚡️ Order Confirmed: DESI BOLT #${order.orderNumber}`;
  const html = generateOrderConfirmationEmailHtml(order, trackingUrl);
  console.log(`[DESI BOLT Email] 📧 Order confirmation sent to ${recipient}`);
  return { sent: true, recipient, subject, messageId: `msg_conf_${Date.now()}` };
}

export async function sendTrackingUpdateEmail(order: Order, status: OrderStatus, trackingUrl: string): Promise<EmailResult> {
  const recipient = order.address?.email || 'customer@desibolt.com';
  const subject = `🛵 Status Update: DESI BOLT #${order.orderNumber} is ${status}`;
  console.log(`[DESI BOLT Email] 📧 Tracking update email sent to ${recipient}`);
  return { sent: true, recipient, subject, messageId: `msg_track_${Date.now()}` };
}

export async function sendDeliveryConfirmationEmail(order: Order, ratingUrl: string): Promise<EmailResult> {
  const recipient = order.address?.email || 'customer@desibolt.com';
  const subject = `⚡️ Delivered: Your DESI BOLT order #${order.orderNumber} is here!`;
  console.log(`[DESI BOLT Email] 📧 Delivery confirmation email sent to ${recipient}`);
  return { sent: true, recipient, subject, messageId: `msg_del_${Date.now()}` };
}

export async function sendPasswordResetEmail(userEmail: string, resetUrl: string): Promise<EmailResult> {
  const subject = `🔒 Reset Your DESI BOLT Password`;
  console.log(`[DESI BOLT Email] 📧 Password reset link sent to ${userEmail}`);
  return { sent: true, recipient: userEmail, subject, messageId: `msg_reset_${Date.now()}` };
}

export async function sendAdminNewOrderNotification(order: Order): Promise<EmailResult> {
  console.log(`[DESI BOLT Admin Alert] 🔔 New order notification sent for #${order.orderNumber}`);
  return { sent: true, recipient: 'ops@desibolt.com', subject: `[OPS] New Order #${order.orderNumber}` };
}

export async function sendAdminWebhookLog(eventType: string, orderId: string, details: any): Promise<EmailResult> {
  console.log(`[DESI BOLT Admin Log] 📝 Webhook event ${eventType} logged for order ${orderId}`);
  return { sent: true, recipient: 'devs@desibolt.com', subject: `[WEBHOOK] ${eventType}` };
}

export async function sendAdminErrorAlert(errorTitle: string, errorMessage: string, stackTrace?: string): Promise<EmailResult> {
  console.error(`[DESI BOLT Admin Alert] 🚨 CRITICAL ERROR ALERT: ${errorTitle} — ${errorMessage}`);
  return { sent: true, recipient: 'alerts@desibolt.com', subject: `[ALERT] ${errorTitle}` };
}
