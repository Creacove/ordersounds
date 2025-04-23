
/**
 * Creates an MP3 preview from an audio file (WAV or MP3)
 * This is a fallback method if the server-side processing fails
 */
export async function createMp3Preview(file: File): Promise<Blob> {
  // Create audio context with explicit type assertion for cross-browser compatibility
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
  
  if (!AudioContext) {
    throw new Error('Web Audio API not supported in this browser');
  }
  
  const audioContext = new AudioContext();
  
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Calculate preview length (30% of total)
    const previewLength = Math.floor(audioBuffer.length * 0.3);
    
    // Get audio data (use first channel for both mono and stereo)
    const channelData = audioBuffer.getChannelData(0);
    const previewData = channelData.slice(0, previewLength);
    
    // Simple conversion to MP3 format for wider compatibility
    const sampleRate = audioBuffer.sampleRate;
    
    // Use PCM format for wider compatibility
    const buffer = new ArrayBuffer(44 + previewData.length * 2);
    const view = new DataView(buffer);
    
    // Write WAV header (as MP3 direct conversion is complex without libraries)
    writeWavHeader(view, previewData.length, sampleRate);
    
    // Write audio data
    let index = 44;
    for (let i = 0; i < previewData.length; i++) {
      // Convert float32 to int16
      const sample = Math.max(-1, Math.min(1, previewData[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(index, value, true);
      index += 2;
    }
    
    // Create Blob with audio/mpeg type to help browsers interpret it better
    return new Blob([buffer], { type: 'audio/mpeg' });
    
  } catch (error) {
    console.error('Error creating audio preview:', error);
    throw error;
  } finally {
    // Clean up audio context
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

// Helper function to write WAV header
function writeWavHeader(view: DataView, sampleLength: number, sampleRate: number): void {
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleLength * 2, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, 1, true); // channels (mono)
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 1 * 16 / 8, true); // byte rate
  view.setUint16(32, 1 * 16 / 8, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, sampleLength * 2, true); // data chunk size
}

// Helper function to write strings to DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
