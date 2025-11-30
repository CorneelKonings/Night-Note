import React, { useState, useEffect, useRef, useCallback } from 'react';
import ClockDisplay from './components/ClockDisplay';
import DrawingPad from './components/DrawingPad';
import VoiceAssistantUI from './components/VoiceAssistant.tsx';
import Settings from './components/Settings';
import SleepMonitor from './components/SleepMonitor';
import Subtitles from './components/Subtitles';
import Onboarding from './components/Onboarding';
import { transcribeHandwriting, fetchTTSAudio, generateNewsWeatherBriefing, preloadVoicePreviews } from './services/geminiService';
import { SleepService } from './services/sleepService';
import { useWakeWord } from './hooks/useWakeWord';
import { AppMode, Alarm, Settings as SettingsType, SleepEvent } from './types';

// ==================================================================================
// CONFIGURATION: DEFAULT ALARM SOUND
// ==================================================================================
const DEFAULT_ALARM_URL = "https://s17.aconvert.com/convert/p3r68-cdx67/kke26-g7pf4.mp3";
// ==================================================================================

const App: React.FC = () => {
  const loadSavedSettings = (): SettingsType => {
    let loadedSettings: Partial<SettingsType> = {};
    try {
      const saved = localStorage.getItem('nightnote_settings');
      if (saved) loadedSettings = JSON.parse(saved);
    } catch (e) { console.error("Error loading settings", e); }

    return {
      userName: '',
      interests: [],
      theme: 'cyan',
      isSleepTrackingEnabled: false,
      alarmVolume: 1.0,
      location: '',
      voiceName: 'Zephyr', // Default to Zephyr
      temperatureUnit: 'C',
      customAlarmAudio: null,
      ...loadedSettings,
      isWakeWordEnabled: true, // FORCE ALWAYS ENABLED
    };
  };

  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<AppMode>(AppMode.CLOCK); 
  const [isFirstRun, setIsFirstRun] = useState(false);
  
  const [alarm, setAlarm] = useState<Alarm>({ id: '1', time: '08:00', enabled: true, noteImageBase64: undefined, noteText: undefined });
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsType>(loadSavedSettings());
  const [sleepEvents, setSleepEvents] = useState<SleepEvent[]>([]);

  const [subtitleText, setSubtitleText] = useState("");
  const [audioProgress, setAudioProgress] = useState(0);
  const [morningStep, setMorningStep] = useState<'NOTE' | 'PROMPT' | 'BRIEFING'>('NOTE');

  const audioContextRef = useRef<AudioContext | null>(null);
  const sleepServiceRef = useRef<SleepService>(new SleepService());
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const noteAudioPromise = useRef<Promise<{ text: string; audioBuffer: AudioBuffer } | null> | null>(null);
  const briefingAudioPromise = useRef<Promise<{ text: string; audioBuffer: AudioBuffer } | null> | null>(null);

  // Initialize Audio Context and Preload Voices on Mount
  useEffect(() => {
    if (!settings.userName) {
      setMode(AppMode.ONBOARDING);
      setIsFirstRun(true);
    }

    // Initialize Audio Context globally
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Start background voice loading
    if (audioContextRef.current) {
        preloadVoicePreviews(audioContextRef.current);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nightnote_settings', JSON.stringify(settings));
  }, [settings]);

  // --- WAKE WORD DETECTION (HOOK) ---
  // Memoize the callback with NO dependencies so it never changes identity
  const handleWakeWord = useCallback(() => {
    setMode(prevMode => {
        // Only trigger if we are in Clock mode
        if (prevMode === AppMode.CLOCK) {
            return AppMode.VOICE_ASSISTANT;
        }
        return prevMode;
    });
  }, []); 

  const { isListening: isWakeWordListening } = useWakeWord(
    handleWakeWord, 
    // Enable only when in CLOCK mode. Even if this boolean changes, 
    // the hook handles it gracefully now.
    mode === AppMode.CLOCK
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      checkAlarmAndPrefetch(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [alarm, mode]);

  useEffect(() => {
    return () => stopAlarmSound();
  }, []);

  const handleOnboardingComplete = (name: string, interests: string[]) => {
    setSettings(prev => ({ ...prev, userName: name, interests }));
    setMode(AppMode.CLOCK);
  };

  const checkAlarmAndPrefetch = (now: Date) => {
    if (!alarm.enabled) return;
    if (mode === AppMode.ALARM_RINGING) return;

    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentSeconds = now.getSeconds();

    if (`${currentHours}:${currentMinutes}` === alarm.time && currentSeconds === 0) {
      triggerAlarm();
      return;
    }

    const [alarmH, alarmM] = alarm.time.split(':').map(Number);
    const alarmDate = new Date(now);
    alarmDate.setHours(alarmH, alarmM, 0, 0);
    const prefetchDate = new Date(alarmDate.getTime() - 2 * 60 * 1000);
    const prefetchH = prefetchDate.getHours().toString().padStart(2, '0');
    const prefetchM = prefetchDate.getMinutes().toString().padStart(2, '0');

    if (`${currentHours}:${currentMinutes}` === `${prefetchH}:${prefetchM}` && currentSeconds === 0) {
      if (!noteAudioPromise.current) {
        console.log("Starting 2-minute pre-fetch (Note & Briefing)...");
        startPreFetching(true);
      }
    }
  };

  const startPreFetching = (isPrefetch: boolean) => {
     noteAudioPromise.current = generateNoteAudio();
     briefingAudioPromise.current = generateBriefingAudio(isPrefetch);
  };

  const generateNoteAudio = async () => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        let currentNoteText = alarm.noteText || "";
        if (!currentNoteText && noteImage) {
          currentNoteText = await transcribeHandwriting(noteImage);
        }

        const script = currentNoteText 
          ? `Good morning, ${settings.userName}. You wrote: ${currentNoteText}`
          : `Good morning, ${settings.userName}. It is time to wake up.`;

        const buffer = await fetchTTSAudio(script, audioContextRef.current, settings.voiceName);
        return { text: script, audioBuffer: buffer };
    } catch (e) {
        console.error("Note Audio Gen failed", e);
        return null;
    }
  };

  const generateBriefingAudio = async (isPrefetch: boolean) => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        let sleepSummary = "";
        if (settings.isSleepTrackingEnabled) {
            const events = isPrefetch ? sleepServiceRef.current.getCurrentEvents() : sleepEvents;
            const snoreCount = events.filter(e => e.type === 'SNORING_SUSPECTED').length;
            if (snoreCount > 5) sleepSummary = `Detected ${snoreCount} snoring events.`;
        }

        const text = await generateNewsWeatherBriefing(settings.userName, settings.location, sleepSummary, settings.temperatureUnit, settings.interests);
        const buffer = await fetchTTSAudio(text, audioContextRef.current, settings.voiceName);
        return { text: text, audioBuffer: buffer };
    } catch (e) {
        console.error("Briefing Audio Gen failed", e);
        return null;
    }
  };

  const playAudioFileAlarm = () => {
    if (alarmAudioRef.current) return;
    const audioSource = settings.customAlarmAudio || DEFAULT_ALARM_URL;
    const audio = new Audio(audioSource);
    audio.loop = true;
    audio.volume = settings.alarmVolume;
    audio.play().catch(e => console.error("Alarm playback failed:", e));
    alarmAudioRef.current = audio;
  };

  const stopAlarmSound = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }
  };

  const triggerAlarm = async () => {
    if (mode === AppMode.SLEEPING) {
      const events = sleepServiceRef.current.stopTracking();
      setSleepEvents(events);
    }
    setMode(AppMode.ALARM_RINGING);
    playAudioFileAlarm();
    if (!noteAudioPromise.current) {
        console.log("No pre-fetch found. Starting on-demand generation...");
        startPreFetching(false);
    }
  };

  const dismissAlarm = async () => {
    stopAlarmSound();
    setMode(AppMode.MORNING_SUMMARY);
    setMorningStep('NOTE');
    setSubtitleText("Reading your note...");

    try {
      const noteData = await noteAudioPromise.current;
      noteAudioPromise.current = null;

      if (noteData) {
        await playSpeechWithSubtitles(noteData.text, noteData.audioBuffer);
      } else {
        await playSpeechWithSubtitles(`Good morning ${settings.userName}. Time to rise.`, undefined);
      }

      setMorningStep('PROMPT');
      setSubtitleText("Do you want a morning brief from NOVA?");

    } catch (e) {
       console.error("Error in morning flow:", e);
       setSubtitleText("System Error.");
    }
  };

  const handleBriefingResponse = async (wantsBriefing: boolean) => {
    if (!wantsBriefing) {
        setMode(AppMode.CLOCK);
        return;
    }

    setMorningStep('BRIEFING');
    setSubtitleText("NOVA is preparing briefing...");
    
    try {
        const briefingData = await briefingAudioPromise.current;
        briefingAudioPromise.current = null;

        if (briefingData) {
            await playSpeechWithSubtitles(briefingData.text, briefingData.audioBuffer);
        } else {
            setSubtitleText("Briefing unavailable.");
            await new Promise(r => setTimeout(r, 2000));
        }
        setMode(AppMode.CLOCK);
    } catch (e) {
        setSubtitleText("Error loading briefing.");
        await new Promise(r => setTimeout(r, 2000));
        setMode(AppMode.CLOCK);
    }
  };

  const playSpeechWithSubtitles = async (text: string, existingBuffer?: AudioBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    setSubtitleText(text);
    setAudioProgress(0);

    try {
      const audioBuffer = existingBuffer || await fetchTTSAudio(text, ctx, settings.voiceName);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      const startTime = ctx.currentTime;
      const duration = audioBuffer.duration;

      return new Promise<void>(resolve => {
        const updateInterval = setInterval(() => {
          const elapsed = ctx.currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setAudioProgress(progress);

          if (progress >= 1) {
            clearInterval(updateInterval);
            resolve();
          }
        }, 16);

        source.onended = () => {
          clearInterval(updateInterval);
          setAudioProgress(1);
          resolve();
        };
      });
    } catch (e) {
      console.error("TTS Playback Error", e);
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  const handleSaveNote = async (imageData: string) => {
    setNoteImage(imageData);
    setMode(AppMode.CLOCK);
    try {
      const text = await transcribeHandwriting(imageData);
      setAlarm(prev => ({ ...prev, noteImageBase64: imageData, noteText: text }));
    } catch (e) {
      console.error("Transcription failed", e);
    }
  };

  const startSleepMode = async () => {
    if (settings.isSleepTrackingEnabled) {
      try {
        await sleepServiceRef.current.startTracking();
      } catch (e) {
        alert("Microphone access needed for sleep tracking.");
      }
    }
    setMode(AppMode.SLEEPING);
  };

  const wakeUpFromSleep = () => {
    if (mode === AppMode.SLEEPING) {
      const events = sleepServiceRef.current.stopTracking();
      setSleepEvents(events);
      setMode(AppMode.CLOCK);
    }
  };

  return (
    <div className={`relative w-screen h-screen bg-black overflow-hidden selection:bg-${settings.theme}-500/30`}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/40 via-black to-black"></div>
      
      {mode === AppMode.ONBOARDING && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      {mode === AppMode.CLOCK && (
        <ClockDisplay 
          time={time} 
          nextAlarm={alarm.enabled ? alarm.time : null}
          onOpenWriting={() => setMode(AppMode.WRITING)}
          onToggleVoice={() => setMode(AppMode.VOICE_ASSISTANT)}
          onOpenSettings={() => setMode(AppMode.SETTINGS)}
          hasNote={!!noteImage}
          theme={settings.theme}
          isListening={isWakeWordListening}
        />
      )}

      {mode === AppMode.SETTINGS && (
        <Settings 
          settings={settings}
          alarmTime={alarm.time}
          isAlarmEnabled={alarm.enabled}
          onUpdateSettings={(newSettings) => setSettings(prev => ({...prev, ...newSettings}))}
          onUpdateAlarm={(newTime, enabled) => setAlarm(prev => ({...prev, time: newTime, enabled}))}
          onClose={() => setMode(AppMode.CLOCK)}
          onStartSleep={startSleepMode}
        />
      )}

      {mode === AppMode.WRITING && (
        <DrawingPad 
          onSave={handleSaveNote}
          onCancel={() => setMode(AppMode.CLOCK)}
          theme={settings.theme}
        />
      )}

      {mode === AppMode.SLEEPING && (
        <SleepMonitor 
          time={time}
          alarmTime={alarm.time}
          isTracking={settings.isSleepTrackingEnabled}
          onWakeUp={wakeUpFromSleep}
        />
      )}

      {mode === AppMode.VOICE_ASSISTANT && (
        <VoiceAssistantUI onClose={() => setMode(AppMode.CLOCK)} />
      )}

      {mode === AppMode.ALARM_RINGING && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black animate-pulse">
           <h1 className={`text-[15vw] font-digital leading-none drop-shadow-[0_0_50px_currentColor] text-${settings.theme === 'cyan' ? 'cyan' : settings.theme}-400`}>
             {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
           </h1>
           <p className="mt-8 text-white font-digital tracking-widest text-xl">ALARM ACTIVE</p>
           
           <button 
            onClick={dismissAlarm}
            className="mt-20 px-12 py-6 bg-white text-black font-bold text-2xl tracking-[0.2em] rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.4)]"
           >
             DISMISS
           </button>
        </div>
      )}

      {mode === AppMode.MORNING_SUMMARY && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
           
           {morningStep === 'PROMPT' ? (
             <div className="flex flex-col items-center gap-12 animate-fadeIn">
                <h2 className="text-white font-digital text-2xl tracking-[0.2em] text-center max-w-lg">
                  CONNECT TO NOVA BRIEFING?
                </h2>
                <div className="flex gap-8">
                  <button 
                    onClick={() => handleBriefingResponse(false)}
                    className="px-10 py-4 border border-zinc-700 rounded-2xl text-gray-400 hover:text-white hover:border-white transition-all font-digital tracking-widest text-xl"
                  >
                    NO
                  </button>
                  <button 
                    onClick={() => handleBriefingResponse(true)}
                    className={`px-10 py-4 bg-white text-black border border-white rounded-2xl hover:bg-gray-200 transition-all font-digital tracking-widest text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]`}
                  >
                    YES
                  </button>
                </div>
             </div>
           ) : (
             <>
               <div className="flex-1 flex items-center justify-center w-full max-w-5xl relative">
                  <Subtitles text={subtitleText} progressRatio={audioProgress} theme={settings.theme} />
               </div>
               {morningStep === 'NOTE' && noteImage && (
                 <div className="absolute bottom-20 opacity-80">
                    <img src={noteImage} alt="Note" className="h-24 object-contain invert opacity-50" />
                 </div>
               )}
             </>
           )}
        </div>
      )}

    </div>
  );
};

export default App;