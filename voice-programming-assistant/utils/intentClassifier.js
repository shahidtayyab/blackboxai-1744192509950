const programmingKeywords = [
  'function', 'def', 'class', 'import', 'return',
  'if', 'else', 'for', 'while', 'try', 'catch',
  'const', 'let', 'var', 'print', 'console.log'
];

const executionKeywords = [
  'run', 'execute', 'test', 'launch', 'start'
];

const generationKeywords = [
  'create', 'write', 'generate', 'make', 'build'
];

const questionKeywords = [
  'how', 'what', 'why', 'when', 'where', 'which',
  'can you', 'could you', 'would you', 'explain'
];

module.exports = {
  classifyIntent: (text) => {
    const lowerText = text.toLowerCase();
    const hasCode = programmingKeywords.some(kw => lowerText.includes(kw));
    const isExecution = executionKeywords.some(kw => lowerText.includes(kw));
    const isGeneration = generationKeywords.some(kw => lowerText.includes(kw));
    const isQuestion = questionKeywords.some(kw => lowerText.includes(kw));

    if (hasCode && isExecution) {
      return {
        type: 'code_execution',
        details: { text },
        confidence: 0.9
      };
    }

    if (hasCode && isGeneration) {
      return {
        type: 'code_generation',
        details: { text },
        confidence: 0.8
      };
    }

    if (isQuestion) {
      return {
        type: 'question',
        details: { text },
        confidence: 0.7
      };
    }

    if (hasCode) {
      return {
        type: 'code_execution',
        details: { text },
        confidence: 0.6
      };
    }

    return {
      type: 'conversation',
      details: { text },
      confidence: 0.5
    };
  },

  extractCodeBlock: (text) => {
    const codeRegex = /```(?:\w+)?\n([\s\S]+?)\n```/;
    const match = text.match(codeRegex);
    return match ? match[1] : text;
  },

  extractVariables: (text) => {
    const varRegex = /(?:const|let|var)\s+(\w+)/g;
    const matches = [];
    let match;
    while ((match = varRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }
};
