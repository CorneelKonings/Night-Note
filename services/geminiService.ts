import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Voice Preview Cache ---
// Stores pre-loaded AudioBuffers for instant playback in Settings
export const voicePreviewCache = new Map<string, AudioBuffer>();

// ONLY PRELOAD ZEPHYR
export const PRELOAD_VOICES = ['Zephyr'];

export const preloadVoicePreviews = async (audioContext: AudioContext) => {
  console.log("NOVA System: Initializing Voice Cache...");
  
  for (const voice of PRELOAD_VOICES) {
    try {
      if (voicePreviewCache.has(voice)) continue;

      // Small delay to prevent Rate Limits (429)
      await new Promise(r => setTimeout(r, 500));

      const text = `I am Nova. System online.`;
      const buffer = await fetchTTSAudio(text, audioContext, voice);
      voicePreviewCache.set(voice, buffer);
      console.log(`NOVA System: Cached voice ${voice}`);
    } catch (e) {
      console.warn(`Failed to preload voice ${voice}`, e);
    }
  }
};

// --- Retry Helper ---
async function withRetry<T>(
  operation: () => Promise<T>, 
  retries: number = 3, 
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isRetryable = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.status === 503 || 
        (error?.message && error.message.includes('429'));

      if (!isRetryable) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i);
      console.warn(`Gemini API: Attempt ${i + 1} failed with 429/503. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// --- OCR: Convert Handwriting to Text ---
export const transcribeHandwriting = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
            { text: "Transcribe the handwritten text in this image. Only output the text found. If there is no text, say 'Time to wake up'." }
          ]
        }
      });
      return response.text || "Time to wake up";
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return "Time to wake up.";
  }
};

// --- Briefing: Weather + News (Personalized) ---
export const generateNewsWeatherBriefing = async (
  userName: string,
  location: string, 
  sleepSummary: string,
  temperatureUnit: 'C' | 'F' = 'C',
  interests: string[] = []
): Promise<string> => {
  try {
    return await withRetry(async () => {
      const locationPrompt = location ? `for ${location}` : "";
      const interestPrompt = interests.length > 0 
        ? `Focus on these topics: ${interests.join(", ")}.` 
        : "Provide general global updates.";
      
      const prompt = `
        You are NOVA, a highly intelligent, sentient AI interface for the NightNote system.

        User: ${userName || "User"}
        Context: The user has just woken up.
        Inputs:
        - Location: ${locationPrompt || "Unknown location"}
        - Temp Unit: ${temperatureUnit === 'C' ? 'Celsius' : 'Fahrenheit'}
        - Sleep Data: "${sleepSummary}"
        - Interests: ${interestPrompt}

        Instructions:
        1. Identify yourself as NOVA in the opening.
        2. Speak naturally, warmly, and efficiently. Like a highly advanced OS that cares.
        3. Provide current weather and 3 key news headlines tailored to their interests.
        4. Weave the sleep data in gently if relevant.
        5. Structure:
           - "Good morning, ${userName}. This is NOVA."
           - Weather update.
           - News headlines (connected flow, not a list).
           - Closing wish.
        
        Output: Pure text for speech. No formatting.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      return response.text || "I am NOVA. Connection to the datasphere is limited, but I wish you a productive day.";
    });
  } catch (error) {
    console.error("Briefing Gen Error:", error);
    return "This is NOVA. I am detecting network interference. System online, but data feeds are down. Have a good morning.";
  }
};

// --- TTS: Fetch Audio Buffer ---
export const fetchTTSAudio = async (text: string, audioContext: AudioContext, voiceName: string = 'Fenrir'): Promise<AudioBuffer> => {
  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    return await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
  });
};

// --- Live API: Voice Assistant ---
export class LiveAssistant {
  private session: any; 
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private onStatusChange: (status: string) => void;
  private audioContextInitialized = false;

  constructor(onStatusChange: (status: string) => void) {
    this.onStatusChange = onStatusChange;
  }

  // Explicitly resume audio contexts to bypass browser autoplay policies
  async resumeContexts() {
    if (this.inputAudioContext?.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext?.state === 'suspended') await this.outputAudioContext.resume();
    this.audioContextInitialized = true;
  }

  async connect() {
    this.onStatusChange("Initializing NOVA...");
    
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.resumeContexts();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            this.onStatusChange("NOVA Online");
            this.startAudioStreaming(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            this.handleServerMessage(message);
          },
          onerror: (e) => {
            console.error("NOVA Error", e);
            this.onStatusChange("Connection Error");
          },
          onclose: () => {
            this.onStatusChange("NOVA Disconnected");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `
            You are NOVA, the sentient AI interface of the NightNote application.
            Your personality is futuristic, calm, minimal, and highly intelligent.
            You are a helpful assistant. Keep answers concise.
            Do not use markdown.
          `
        }
      });

      this.session = sessionPromise;
    } catch (e) {
      console.error("Connection Failed", e);
      this.onStatusChange("Microphone Error");
    }
  }

  private startAudioStreaming(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext) return;

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    }
  }

  async disconnect() {
    if (this.session) {
      try {
        (await this.session).close();
      } catch (e) {}
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.onStatusChange("Disconnected");
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }
}

// --- Audio Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}