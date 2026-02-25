"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
class NotificationService {
    static sendPushNotification(expoPushToken, title, body, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(expoPushToken)) {
                console.warn(`Invalid Expo push token: ${expoPushToken}, skipping notification`);
                return;
            }
            const message = {
                to: expoPushToken,
                sound: "default",
                title,
                body,
                data: data || {},
            };
            try {
                const chunks = expo.chunkPushNotifications([message]);
                for (const chunk of chunks) {
                    const ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
                    for (const ticket of ticketChunk) {
                        if (ticket.status === "error") {
                            console.error(`Push notification error: ${ticket.message}`, ticket.details);
                        }
                    }
                }
            }
            catch (error) {
                console.error("Failed to send push notification:", error);
            }
        });
    }
}
exports.default = NotificationService;
