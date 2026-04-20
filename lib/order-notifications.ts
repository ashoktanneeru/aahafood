import { buildOrderMessage } from "@/lib/order-utils";
import { OrderPayload } from "@/lib/supabase";

async function notifyByEmail(message: string, orderNumber?: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ORDER_NOTIFICATION_EMAIL_TO?.trim();
  const from =
    process.env.ORDER_NOTIFICATION_EMAIL_FROM?.trim() ?? "AahaFood Orders <orders@aahafood.com>";

  if (!apiKey || !to) {
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: orderNumber ? `New order ${orderNumber}` : "New AahaFood order",
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error("Email notification failed.");
  }

  return true;
}

async function notifyByWhatsApp(message: string) {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const to = process.env.ORDER_NOTIFICATION_WHATSAPP_TO?.trim();

  if (!accessToken || !phoneNumberId || !to) {
    return null;
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("WhatsApp notification failed.");
  }

  return true;
}

export async function sendOrderNotifications(
  payload: OrderPayload & {
    orderNumber?: string;
  },
) {
  const message = buildOrderMessage(payload);
  const warnings: string[] = [];

  await Promise.all([
    notifyByEmail(message, payload.orderNumber).catch(() => {
      warnings.push("Email notification failed");
      return null;
    }),
    notifyByWhatsApp(message).catch(() => {
      warnings.push("WhatsApp notification failed");
      return null;
    }),
  ]);

  return warnings;
}
