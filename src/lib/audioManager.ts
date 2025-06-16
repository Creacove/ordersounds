
export class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private audioPool: Map<string, HTMLAudioElement> = new Map();
  private preloadedTracks: Set<string> = new Set();
  private maxPoolSize = 3;
  private currentUrl: string = '';
  
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Force stop any currently playing audio
  stopAllAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    // Also stop any other audio elements that might be playing
    this.audioPool.forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    this.currentAudio = null;
    this.currentUrl = '';
  }

  getAudio(url: string): HTMLAudioElement {
    // If switching to a new URL, stop current audio first
    if (this.currentUrl && this.currentUrl !== url) {
      this.stopAllAudio();
    }
    
    let audio = this.audioPool.get(url);
    
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      
      // Add event listeners to track when audio starts/stops
      audio.addEventListener('play', () => {
        // Ensure this is the only playing audio
        if (this.currentAudio && this.currentAudio !== audio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }
        this.currentAudio = audio;
        this.currentUrl = url;
      });
      
      audio.addEventListener('pause', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      });
      
      audio.addEventListener('ended', () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.currentUrl = '';
        }
      });
      
      this.audioPool.set(url, audio);
      
      // Clean up old entries if pool is too large
      if (this.audioPool.size > this.maxPoolSize) {
        const firstKey = this.audioPool.keys().next().value;
        const oldAudio = this.audioPool.get(firstKey);
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.src = '';
          oldAudio.remove();
        }
        this.audioPool.delete(firstKey);
      }
    }
    
    if (audio.src !== url) {
      audio.src = url;
    }
    
    return audio;
  }

  // Get the currently playing audio element
  getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }

  // Check if a specific URL is currently playing
  isPlaying(url: string): boolean {
    return this.currentUrl === url && this.currentAudio && !this.currentAudio.paused;
  }

  preloadAudio(url: string): void {
    if (!url || this.preloadedTracks.has(url)) return;
    
    const audio = this.getAudio(url);
    audio.load();
    this.preloadedTracks.add(url);
  }

  cleanup(): void {
    this.stopAllAudio();
    this.audioPool.forEach((audio) => {
      audio.pause();
      audio.src = '';
      audio.remove();
    });
    this.audioPool.clear();
    this.preloadedTracks.clear();
    this.currentAudio = null;
    this.currentUrl = '';
  }

  setVolume(volume: number): void {
    this.audioPool.forEach((audio) => {
      audio.volume = volume;
    });
  }
}
