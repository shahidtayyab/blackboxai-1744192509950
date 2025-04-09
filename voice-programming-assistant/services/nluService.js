const { OpenAI } = require('openai');
const { classifyIntent } = require('../utils/intentClassifier');

module.exports = {
  detectIntent: async (text) => {
    try {
      // First try local classifier
      const localResult = classifyIntent(text);
      if (localResult.confidence > 0.8) {
        return localResult;
      }

      // Fallback to LLM for complex cases
      const openai = new OpenAI(process.env.OPENAI_API_KEY);
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: `Classify this programming command intent:
          Possible types: code_execution, code_generation, question, conversation, system_command
          Return JSON with type and details`
        }, {
          role: 'user',
          content: text
        }],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Intent detection error:', error);
      return { type: 'conversation', details: {} };
    }
  },

  extractEntities: (text, intent) => {
    // Extract programming language, variables, etc.
    switch(intent.type) {
      case 'code_execution':
        return {
          language: detectLanguage(text),
          code: extractCodeBlock(text),
          variables: extractVariables(text)
        };
      case 'code_generation':
        return {
          language: detectLanguage(text),
          requirements: extractRequirements(text)
        };
      default:
        return {};
    }
  },

  detectLanguage: (text) => {
    const languageKeywords = {
      python: ['python', 'py', 'import', 'def'],
      javascript: ['javascript', 'js', 'function', 'const', 'let'],
      // Add more language patterns
    };

    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(kw => text.toLowerCase().includes(kw))) {
        return lang;
      }
    }
    return 'python'; // Default fallback
  }
};
