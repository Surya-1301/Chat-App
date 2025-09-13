import { storage } from './storage';

const getMessagesKey = (conversationId: string) => `messages_${conversationId}`;
const getQueuedMessagesKey = (conversationId: string) => `queued_messages_${conversationId}`;

export const offlineManager = {
  async getCachedMessages(conversationId: string) {
    const key = getMessagesKey(conversationId);
    const rawMessages = await storage.getItem(key);
    return rawMessages ? JSON.parse(rawMessages) : [];
  },

  async cacheMessages(conversationId: string, messages: any[]) {
    const key = getMessagesKey(conversationId);
    await storage.setItem(key, JSON.stringify(messages));
  },

  async getQueuedMessages(conversationId: string) {
    const key = getQueuedMessagesKey(conversationId);
    const rawMessages = await storage.getItem(key);
    return rawMessages ? JSON.parse(rawMessages) : [];
  },

  async queueMessage(conversationId: string, message: any) {
    const key = getQueuedMessagesKey(conversationId);
    const queuedMessages = await this.getQueuedMessages(conversationId);
    queuedMessages.push(message);
    await storage.setItem(key, JSON.stringify(queuedMessages));
  },

  async clearQueuedMessages(conversationId: string) {
    const key = getQueuedMessagesKey(conversationId);
    await storage.removeItem(key);
  },
};
