
export class AudioManager {
  private static instance: AudioManager;
  private audioPool: Map<string, HTMLAudioElement> = new Map();
  private preloadedTracks: Set<string> = new Set();
  private maxPoolSize = 3;
  
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  getAudio(url: string): HTMLAudioElement {
    let audio = this.audioPool.get(url);
    
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      this.audioPool.set(url, audio);
      
      // Clean up old entries if pool is too large
      if (this.audioPool.size > this.maxPoolSize) {
        const firstKey = this.audioPool.keys().next().value;
        const oldAudio = this.audioPool.get(firstKey);
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.src = '';
        }
        this.audioPool.delete(firstKey);
      }
    }
    
    if (audio.src !== url) {
      audio.src = url;
    }
    
    return audio;
  }

  preloadAudio(url: string): void {
    if (!url || this.preloadedTracks.has(url)) return;
    
    const audio = this.getAudio(url);
    audio.load();
    this.preloadedTracks.add(url);
  }

  cleanup(): void {
    this.audioPool.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.audioPool.clear();
    this.preloadedTracks.clear();
  }

  setVolume(volume: number): void {
    this.audioPool.forEach((audio) => {
      audio.volume = volume;
    });
  }
}
