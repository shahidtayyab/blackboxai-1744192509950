const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  processVoiceInput: (audioBuffer) => ipcRenderer.invoke('process-voice-input', audioBuffer),
  getMicrophoneAccess: () => navigator.mediaDevices.getUserMedia({ audio: true }),
  saveUserPreference: (key, value) => ipcRenderer.send('save-preference', { key, value }),
  getUserPreference: (key) => ipcRenderer.invoke('get-preference', key)
});
