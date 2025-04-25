
/**
 * Creates an MP3 preview from an audio file (WAV or MP3)
 * This is a fallback method if the server-side processing fails
 */
export async function createMp3Preview(file: File): Promise<Blob> {
  // Create audio context with explicit type assertion for cross-browser compatibility
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
  
  if (!AudioContext) {
    throw new Error('Web Audio API not supported');
  }
  
  const audioContext = new AudioContext();
  
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Calculate preview length (30% of total)
    const previewLength = Math.floor(audioBuffer.length * 0.3);
    
    // Get audio data (combine channels for stereo files)
    let previewData: Float32Array;
    if (audioBuffer.numberOfChannels > 1) {
      // Mix down to mono if stereo
      const channel1 = audioBuffer.getChannelData(0);
      const channel2 = audioBuffer.getChannelData(1);
      previewData = new Float32Array(previewLength);
      for (let i = 0; i < previewLength; i++) {
        previewData[i] = (channel1[i] + channel2[i]) / 2;
      }
    } else {
      previewData = audioBuffer.getChannelData(0).slice(0, previewLength);
    }
    
    // If it's a WAV file, create WAV format - better browser support
    const isWav = file.type === 'audio/wav' || file.name.endsWith('.wav');
    if (isWav) {
      // Create WAV file structure
      const wavBuffer = createWavFile(previewData, audioBuffer.sampleRate);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } else {
      // Create WAV file structure (for MP3 input too - simpler than converting to MP3)
      const wavBuffer = createWavFile(previewData, audioBuffer.sampleRate);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    }
  } catch (error) {
    console.error('Error creating audio preview:', error);
    throw error;
  } finally {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

// Helper function to create a proper WAV file structure
function createWavFile(audioData: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const numberOfChannels = 1; // Mono output
  
  // Create buffer with WAV header
  const buffer = new ArrayBuffer(44 + audioData.length * bytesPerSample);
  const view = new DataView(buffer);
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + audioData.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
  view.setUint16(32, numberOfChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  
  // Write audio data
  writeString(view, 36, 'data');
  view.setUint32(40, audioData.length * bytesPerSample, true);
  
  // Convert and write actual audio data
  const volume = 0.8; // Prevent clipping
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i] * volume));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += bytesPerSample;
  }
  
  return buffer;
}

// Helper function to write strings to DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
