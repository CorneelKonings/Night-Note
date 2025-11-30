import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      // Check for quota/rate limit errors (429) or temporary server errors (503)
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
    // Strip header if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: cleanBase64
              }
            },
            {
              text: "Transcribe the handwritten text in this image. Only output the text found. If there is no text, say 'Time to wake up'."
            }
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
        ? `Focus on these topics if possible: ${interests.join(", ")}.` 
        : "Provide general global news.";
      
      const prompt = `
        You are NightNote, a warm, intelligent, and human-like morning companion.

        User: ${userName || "Friend"}
        Context: Waking up in the morning.
        Inputs:
        - Location: ${locationPrompt || "Unknown location"}
        - Temperature Unit: ${temperatureUnit === 'C' ? 'Celsius' : 'Fahrenheit'}
        - Sleep Context: "${sleepSummary}" (Only mention if significant, e.g., if they snored a lot, suggest rest).
        - Interests: ${interestPrompt}

        Instructions:
        1. Search for current weather and 3 interesting news headlines relevant to their interests.
        2. Speak directly to ${userName} as if you are a knowledgeable friend.
        3. Structure:
           - Start with a warm personal greeting using their name.
           - Mention the weather smoothly (e.g., "Outside, it's looking a bit rainy...").
           - Transition into the news stories naturally, weaving them together.
           - Avoid robotic lists.
        4. Length: Approx 150 words. Engaging and conversational.

        Output format: Pure text to be spoken. No markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      return response.text || "I couldn't grab the latest news feed, but I hope you have a wonderful start to your day.";
    });
  } catch (error) {
    console.error("Briefing Gen Error:", error);
    return "I'm having trouble connecting to the network, but it looks like a good day to get started.";
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
    if (!base64Audio) {
      console.error("Gemini TTS Error: Response did not contain audio data.", response);
      throw new Error("No audio data returned");
    }

    return await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );
  });
};

// --- Live API: Voice Assistant ---
export class LiveAssistant {
  private session: any; // Type is technically Promise<LiveSession> but simplifying for now
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private onStatusChange: (status: string) => void;

  constructor(onStatusChange: (status: string) => void) {
    this.onStatusChange = onStatusChange;
  }

  async connect() {
    this.onStatusChange("Connecting...");
    
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      // Request Mic Access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            this.onStatusChange("Connected");
            this.startAudioStreaming(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            this.handleServerMessage(message);
          },
          onerror: (e) => {
            console.error("Live API Error", e);
            this.onStatusChange("Error");
          },
          onclose: () => {
            this.onStatusChange("Disconnected");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "You are NightNote, a helpful, calm, and minimalist nightstand assistant. Keep responses brief and soothing."
        }
      });

      this.session = sessionPromise;
    } catch (e) {
      console.error("Connection Failed", e);
      this.onStatusChange("Connection Failed");
    }
  }

  private startAudioStreaming(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext) return;

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
       // Sync playback time
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );

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
        const s = await this.session;
        s.close();
      } catch (e) {
        console.warn("Error closing session", e);
      }
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

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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