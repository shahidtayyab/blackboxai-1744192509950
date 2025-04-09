const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const whisper = require('whisper-node');
const { Docker } = require('dockerode');
const { OpenAI } = require('openai');

// Core services
const voiceService = require('./services/voiceService');
const nluService = require('./services/nluService');
const executionService = require('./services/executionService');
const responseService = require('./services/responseService');
const knowledgeService = require('./services/knowledgeService');

// Create backend API server
const apiServer = express();
apiServer.use(express.json());

// Initialize services
const docker = new Docker();
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const whisperModel = new whisper.Whisper('base');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // Development tools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('process-voice-input', async (event, audioBuffer) => {
  const text = await voiceService.transcribeAudio(whisperModel, audioBuffer);
  const intent = await nluService.detectIntent(text);
  const context = await knowledgeService.getContext();
  
  let result;
  if (intent.type === 'code_execution') {
    result = await executionService.executeCode(docker, intent);
  } else {
    result = await responseService.generateResponse(openai, text, context);
  }

  await knowledgeService.updateContext(text, result);
  return result;
});

// API Routes
apiServer.post('/api/execute', async (req, res) => {
  try {
    const { command, language } = req.body;
    const result = await executionService.executeCode(docker, { command, language });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start API server
apiServer.listen(3001, () => {
  console.log('API server running on port 3001');
});
