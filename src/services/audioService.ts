/**
 * Audio Service for handling sound notifications
 * Provides functionality to play different types of notification sounds
 */

export interface AudioConfig {
  volume?: number;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
}

export type SoundType = 'notification' | 'urgent' | 'reminder' | 'custom';

class AudioService {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;
  private globalVolume: number = 0.7;
  private soundPaths: Record<string, string> = {
    // Use relative paths so it works whether the app is hosted at root or a sub-path
    notification: './sounds/notification.wav',
    urgent: './sounds/urgent.wav',
    reminder: './sounds/reminder.wav',
    custom: ''
  };

  constructor() {
    this.initializeAudioContext();
    // Attempt eager preload, but playback will also lazy-load if needed
    this.loadDefaultSounds();
  }

  /**
   * Initialize Web Audio Context for better audio control
   */
  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to HTML5 Audio');
    }
  }

  /**
   * Load default notification sounds
   */
  private loadDefaultSounds() {
    Object.entries(this.soundPaths).forEach(([type, src]) => {
      if (type !== 'custom' && src) this.loadSound(type, src);
    });
  }

  /**
   * Load a sound file
   */
  public loadSound(name: string, src: string, config: AudioConfig = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = config.preload || 'auto';
      audio.volume = config.volume || this.globalVolume;
      audio.loop = config.loop || false;

      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(name, audio);
        resolve();
      });

      audio.addEventListener('error', (e) => {
        console.error(`Failed to load sound: ${name}`, e);
        reject(new Error(`Failed to load sound: ${name}`));
      });

      // Resolve relative paths against the current document base (works with base='./')
      audio.src = this.resolveUrl(src);
    });
  }

  private resolveUrl(src: string): string {
    try {
      // If already absolute (http/https), return as-is
      if (/^https?:\/\//i.test(src)) return src;
      // Otherwise resolve relative to the current document base
      return new URL(src, document.baseURI).toString();
    } catch {
      return src;
    }
  }

  /**
   * Play a notification sound
   */
  public async playSound(soundType: SoundType, customSrc?: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      let audio: HTMLAudioElement | undefined;

      if (customSrc) {
        // Play custom sound
        audio = new Audio(customSrc);
        audio.volume = this.globalVolume;
      } else {
        // Play predefined sound
        audio = this.sounds.get(soundType);
        if (!audio) {
          // Lazy-load on first use
          const fallbackSrc = this.soundPaths[soundType] || this.soundPaths['notification'];
          if (fallbackSrc) {
            try {
              await this.loadSound(soundType, fallbackSrc);
              audio = this.sounds.get(soundType);
            } catch (e) {
              // As a last resort, attempt direct play
              audio = new Audio(fallbackSrc);
              audio.volume = this.globalVolume;
            }
          }
        }
      }

      if (!audio) {
        console.warn(`Sound not found: ${soundType}`);
        return;
      }

      // Reset audio to beginning
      audio.currentTime = 0;

      // Play the sound
      await audio.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play notification sound with visual feedback
   */
  public async playNotificationSound(soundType: SoundType = 'notification', customSrc?: string): Promise<void> {
    await this.playSound(soundType, customSrc);
    
    // Add visual feedback
    this.showVisualFeedback(soundType);
  }

  /**
   * Show visual feedback for sound notification
   */
  private showVisualFeedback(soundType: SoundType) {
    // Create a visual indicator
    const indicator = document.createElement('div');
    indicator.className = 'sound-notification-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: ${this.getSoundColor(soundType)};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      z-index: 10000;
      animation: soundPulse 0.5s ease-in-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    indicator.innerHTML = '🔔';
    document.body.appendChild(indicator);

    // Remove indicator after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 1000);
  }

  /**
   * Get color for sound type
   */
  private getSoundColor(soundType: SoundType): string {
    const colors = {
      notification: '#3B82F6',
      urgent: '#EF4444',
      reminder: '#F59E0B',
      custom: '#8B5CF6'
    };
    return colors[soundType] || colors.notification;
  }

  /**
   * Enable/disable sound notifications
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if sound is enabled
   */
  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set global volume (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    this.sounds.forEach(audio => {
      audio.volume = this.globalVolume;
    });
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.globalVolume;
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAllSounds(): void {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Generate a simple beep sound using Web Audio API
   */
  public generateBeep(frequency: number = 800, duration: number = 200): void {
    if (!this.audioContext || !this.isEnabled) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.globalVolume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * Play a sequence of beeps for urgent notifications
   */
  public playUrgentBeep(): void {
    if (!this.isEnabled) return;
    
    this.generateBeep(1000, 150);
    setTimeout(() => this.generateBeep(1000, 150), 200);
    setTimeout(() => this.generateBeep(1000, 150), 400);
  }
}

// Add CSS for sound notification animation
const style = document.createElement('style');
style.textContent = `
  @keyframes soundPulse {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
`;
document.head.appendChild(style);

export const audioService = new AudioService();
export default audioService;
