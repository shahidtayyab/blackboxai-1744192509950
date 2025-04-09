const fs = require('fs');
const path = require('path');
const { whisper } = require('whisper-node');

module.exports = {
  transcribeAudio: async (model, audioBuffer) => {
    try {
      // Save buffer to temp file
      const tempPath = path.join(__dirname, '../temp/audio.wav');
      fs.writeFileSync(tempPath, audioBuffer);
      
      // Transcribe using Whisper
      const result = await model.transcribe(tempPath);
      fs.unlinkSync(tempPath); // Clean up
      
      return result.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  },

  recordFromMicrophone: async () => {
    // Implementation for direct microphone recording
    // Would use Web Audio API in renderer process
    throw new Error('Direct microphone recording must be done in renderer process');
  },

  processAudioStream: (stream) => {
    // Process real-time audio stream
    // Would use Web Audio API + chunk processing
    return new Promise((resolve) => {
      const audioChunks = [];
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks);
        resolve(audioBlob);
      });

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Stop after 5 seconds for demo
    });
  }
};
