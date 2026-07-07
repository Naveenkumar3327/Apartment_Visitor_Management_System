import { db } from "./db";

export type NotificationType = "EMAIL" | "SMS" | "PUSH" | "WHATSAPP";

interface SendNotificationParams {
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
}

export async function sendNotification({ userId, title, message, type }: SendNotificationParams) {
  try {
    // 1. Log notification in database
    const notification = await db.notification.create({
      data: {
        title,
        message,
        type,
        userId: userId || null,
        isRead: false,
      },
    });

    // 2. Print visual console notification (since actual external APIs are mocked)
    console.log(`\n============== [NOTIFICATION DISPATCHED: ${type}] ==============`);
    console.log(`Recipient: ${userId ? `User (ID: ${userId})` : 'Broadcast / System'}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log(`=================================================================\n`);

    // In a live production deploy, you would add Twilio or Resend code here:
    /*
    if (type === "SMS") {
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: receiverPhone });
    }
    */

    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return null;
  }
}

// Convenient helper functions
export async function sendEmail(email: string, title: string, message: string, userId?: string) {
  return sendNotification({ userId, title, message: `To: ${email}\n\n${message}`, type: "EMAIL" });
}

export async function sendSMS(phone: string, message: string, userId?: string) {
  return sendNotification({ userId, title: "SMS Notice", message: `To: ${phone}\n\n${message}`, type: "SMS" });
}

export async function sendWhatsApp(phone: string, message: string, userId?: string) {
  return sendNotification({ userId, title: "WhatsApp Message", message: `To: ${phone}\n\n${message}`, type: "WHATSAPP" });
}

export async function sendPush(userId: string, title: string, message: string) {
  return sendNotification({ userId, title, message, type: "PUSH" });
}
