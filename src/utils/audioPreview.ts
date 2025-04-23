
import lamejs from 'lamejs';

/**
 * Creates an MP3 preview from an audio file (WAV or MP3)
 * Takes the first 30% of the audio and converts it to MP3 at 128kbps
 */
export async function createMp3Preview(file: File): Promise<Blob> {
  // Define the AudioContext type with the webkit prefix for TypeScript
  interface AudioContextType {
    new (): AudioContext;
  }
  
  // Create audio context with proper type definition
  const AudioContextClass: AudioContextType = 
    (window.AudioContext as AudioContextType) || 
    ((window as any).webkitAudioContext as AudioContextType);
  
  const audioContext = new AudioContextClass();
  
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
    
    // Convert float32 samples to int16 samples for MP3 encoding
    const samples = new Int16Array(previewData.length);
    for (let i = 0; i < previewData.length; i++) {
      // Convert float32 to int16
      const sample = Math.max(-1, Math.min(1, previewData[i]));
      samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    // Initialize MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(1, // Mono
                                           audioBuffer.sampleRate,
                                           128); // 128kbps
    
    // Encode samples to MP3 (process in chunks to avoid memory issues)
    const chunkSize = 1152; // Must be multiple of 576 for MP3
    const chunks = [];
    
    for (let i = 0; i < samples.length; i += chunkSize) {
      const chunk = samples.slice(i, i + chunkSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        chunks.push(mp3buf);
      }
    }
    
    // Get the last frames and flush the encoder
    const lastMp3buf = mp3encoder.flush();
    if (lastMp3buf.length > 0) {
      chunks.push(lastMp3buf);
    }
    
    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const mp3Data = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      mp3Data.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Create MP3 blob
    return new Blob([mp3Data], { type: 'audio/mp3' });
    
  } catch (error) {
    console.error('Error creating MP3 preview:', error);
    throw error;
  } finally {
    // Clean up audio context
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

// Example usage:
/*
const preview = await createMp3Preview(file);
const previewFile = new File([preview], 'preview.mp3', { type: 'audio/mp3' });

// The previewFile can now be uploaded to Supabase
*/
