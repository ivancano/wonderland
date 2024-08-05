import axios from 'axios';
import { discordWebhookUrl } from './config/config';

/**
 * Sends a Discord alert with the specified message.
 *
 * @param message - The message to be sent as the content of the alert.
 */
export const sendDiscordAlert = async (message: string) => {
    try {
        await axios.post(discordWebhookUrl, { content: message });
    } catch (error) {
        console.error('Error sending Discord alert:', error);
    }
};
