import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export default class NotificationService {
  static async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.warn(
        `Invalid Expo push token: ${expoPushToken}, skipping notification`
      );
      return;
    }

    const message: ExpoPushMessage = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data: data || {},
    };

    try {
      const chunks = expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        for (const ticket of ticketChunk) {
          if (ticket.status === "error") {
            console.error(
              `Push notification error: ${ticket.message}`,
              ticket.details
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  }
}
