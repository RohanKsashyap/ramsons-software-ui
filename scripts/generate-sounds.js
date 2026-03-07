/**
 * Script to generate notification sound files
 * This creates simple beep sounds using Web Audio API
 */

const fs = require('fs');
const path = require('path');

// Simple function to generate a WAV file buffer
function generateWavBuffer(frequency, duration, sampleRate = 44100) {
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);
  
  // Generate sine wave
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  
  return buffer;
}

// Generate different notification sounds
const sounds = {
  notification: { frequency: 800, duration: 0.3 },
  urgent: { frequency: 1200, duration: 0.2 },
  reminder: { frequency: 600, duration: 0.4 }
};

const soundsDir = path.join(__dirname, '../public/sounds');

// Create sounds directory if it doesn't exist
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Generate sound files
Object.entries(sounds).forEach(([name, config]) => {
  const buffer = generateWavBuffer(config.frequency, config.duration);
  const filePath = path.join(soundsDir, `${name}.wav`);
  
  fs.writeFileSync(filePath, Buffer.from(buffer));
  console.log(`Generated ${name}.wav (${config.frequency}Hz, ${config.duration}s)`);
});

console.log('Sound files generated successfully!');
