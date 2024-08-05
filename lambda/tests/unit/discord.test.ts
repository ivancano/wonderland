// sendDiscordAlert.test.ts
import axios from 'axios';
import { sendDiscordAlert } from '../../src/discord';
import { discordWebhookUrl } from '../../src/config/config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('sendDiscordAlert', () => {
    beforeEach(() => {
        mockedAxios.post.mockClear();
    });

    it('should send a Discord alert with the specified message', async () => {
        const message = 'Test alert message';

        mockedAxios.post.mockResolvedValue({ status: 204 });

        await sendDiscordAlert(message);

        expect(mockedAxios.post).toHaveBeenCalledWith(discordWebhookUrl, { content: message });
    });

    it('should handle errors gracefully', async () => {
        const message = 'Test alert message';
        const error = new Error('Mocked error');

        mockedAxios.post.mockRejectedValue(error);
        console.error = jest.fn();

        await sendDiscordAlert(message);

        expect(console.error).toHaveBeenCalledWith('Error sending Discord alert:', error);
    });
});
