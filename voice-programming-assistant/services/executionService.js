const Docker = require('dockerode');
const path = require('path');
const fs = require('fs');

const docker = new Docker();
const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

module.exports = {
  executeCode: async (intent) => {
    const { language, code } = intent.details;
    
    try {
      // Validate code before execution
      this.validateCode(code, language);

      // Create temp file with code
      const fileName = `code.${getFileExtension(language)}`;
      const filePath = path.join(TEMP_DIR, fileName);
      fs.writeFileSync(filePath, code);

      // Run in appropriate container
      const container = await docker.createContainer({
        Image: getImageForLanguage(language),
        Cmd: getCommandForLanguage(language, fileName),
        HostConfig: {
          Binds: [`${filePath}:/app/${fileName}`],
          AutoRemove: true,
          NetworkMode: 'none' // Disable network for security
        },
        Tty: false
      });

      await container.start();
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false
      });

      // Clean up
      fs.unlinkSync(filePath);
      return logs.toString('utf8');
    } catch (error) {
      console.error('Execution error:', error);
      return `Error: ${error.message}`;
    }
  },

  validateCode: (code, language) => {
    // Basic syntax validation
    if (!code || code.trim().length === 0) {
      throw new Error('Empty code block');
    }

    // Security checks
    const bannedPatterns = {
      all: ['rm -rf', 'shutdown', 'reboot', 'sudo'],
      python: ['os.system', 'subprocess.run'],
      javascript: ['child_process.exec', 'eval(']
    };

    const patterns = [...bannedPatterns.all, ...(bannedPatterns[language] || [])];
    for (const pattern of patterns) {
      if (code.includes(pattern)) {
        throw new Error(`Potentially dangerous operation detected: ${pattern}`);
      }
    }
  }
};

function getImageForLanguage(lang) {
  const images = {
    python: 'python:3.9-slim',
    javascript: 'node:18-alpine',
    bash: 'alpine:latest'
  };
  return images[lang] || images.python;
}

function getCommandForLanguage(lang, filename) {
  const commands = {
    python: ['python', `/app/${filename}`],
    javascript: ['node', `/app/${filename}`],
    bash: ['sh', `/app/${filename}`]
  };
  return commands[lang] || commands.python;
}

function getFileExtension(lang) {
  const extensions = {
    python: 'py',
    javascript: 'js',
    bash: 'sh'
  };
  return extensions[lang] || 'txt';
}
