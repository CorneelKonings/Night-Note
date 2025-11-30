
export enum AppMode {
  ONBOARDING = 'ONBOARDING', // New mode
  CLOCK = 'CLOCK',
  WRITING = 'WRITING',
  ALARM_RINGING = 'ALARM_RINGING',
  VOICE_ASSISTANT = 'VOICE_ASSISTANT',
  SETTINGS = 'SETTINGS',
  SLEEPING = 'SLEEPING',
  MORNING_SUMMARY = 'MORNING_SUMMARY'
}

export type ThemeColor = 'cyan' | 'amber' | 'emerald' | 'rose';

export interface Alarm {
  id: string;
  time: string; // HH:mm format (24h)
  enabled: boolean;
  noteImageBase64?: string;
  noteText?: string; // Transcribed text
}

export interface Settings {
  userName: string;
  interests: string[];
  theme: ThemeColor;
  isSleepTrackingEnabled: boolean;
  isWakeWordEnabled: boolean; // NEW: Hey Nova detection
  alarmVolume: number;
  location: string;
  voiceName: string;
  temperatureUnit: 'C' | 'F';
  customAlarmAudio: string | null; // Base64 string of uploaded audio
}

export interface SleepEvent {
  timestamp: Date;
  type: 'NOISE' | 'TALKING' | 'SNORING_SUSPECTED';
  intensity: number; // 0-100
}

export interface AudioState {
  isPlaying: boolean;
  isListening: boolean;
}
