const { ChromaClient } = require('chromadb');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/knowledge');
const client = new ChromaClient();

class KnowledgeService {
  constructor() {
    this.collection = null;
    this.init();
  }

  async init() {
    try {
      // Ensure data directory exists
      if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(DB_PATH, { recursive: true });
      }

      // Create or get collection
      this.collection = await client.getOrCreateCollection({
        name: 'programming_assistant',
        metadata: { 
          description: 'Stores conversation context and programming knowledge',
          created: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Knowledge service init error:', error);
    }
  }

  async getContext(userId, conversationId) {
    try {
      const results = await this.collection.query({
        where: { 
          userId,
          conversationId 
        },
        limit: 5
      });
      return results.documents.map(doc => doc.content);
    } catch (error) {
      console.error('Context retrieval error:', error);
      return [];
    }
  }

  async updateContext(userId, conversationId, input, output) {
    try {
      await this.collection.add({
        ids: [`${Date.now()}`],
        documents: [JSON.stringify({
          input,
          output,
          timestamp: new Date().toISOString()
        })],
        metadatas: [{
          userId,
          conversationId,
          type: 'conversation'
        }]
      });
    } catch (error) {
      console.error('Context update error:', error);
    }
  }

  async searchKnowledge(query, userId) {
    try {
      const results = await this.collection.query({
        queryTexts: [query],
        where: { userId },
        limit: 3
      });
      return results.documents[0];
    } catch (error) {
      console.error('Knowledge search error:', error);
      return [];
    }
  }
}

module.exports = new KnowledgeService();
