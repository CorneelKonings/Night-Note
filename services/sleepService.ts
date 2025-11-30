import { SleepEvent } from '../types';

export class SleepService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;
  private silenceThreshold = 15; // Volume threshold (0-255 scale)
  private checkInterval: number | null = null;
  
  private events: SleepEvent[] = [];

  async startTracking(): Promise<void> {
    if (this.isRunning) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      
      this.isRunning = true;
      this.events = [];
      
      this.startMonitoring();
    } catch (e) {
      console.error("Failed to start sleep tracking", e);
      throw e;
    }
  }

  private startMonitoring() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // Check audio levels every 2 seconds
    this.checkInterval = window.setInterval(() => {
      if (!this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;

      // If loud enough, log it
      if (average > this.silenceThreshold) {
        this.recordEvent(average);
      }
    }, 2000);
  }

  private recordEvent(intensity: number) {
    // Simple heuristic: 
    // Low intensity might be heavy breathing/snoring
    // High intensity might be talking or movement
    // Since we can't do ML locally easily, we just categorize by volume
    let type: SleepEvent['type'] = 'NOISE';
    if (intensity > 20 && intensity < 40) type = 'SNORING_SUSPECTED';
    if (intensity >= 40) type = 'TALKING';

    this.events.push({
      timestamp: new Date(),
      type,
      intensity
    });
  }

  // Allow reading events while running (for pre-fetch)
  getCurrentEvents(): SleepEvent[] {
    return [...this.events];
  }

  stopTracking(): SleepEvent[] {
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    return this.events;
  }
}