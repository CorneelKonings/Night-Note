import { useEffect, useRef, useState } from 'react';

export const useWakeWord = (onWake: () => void, isEnabled: boolean) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Use a ref for the callback so we don't restart the effect when the callback function identity changes
  // This is crucial because App.tsx re-renders every second for the clock
  const onWakeRef = useRef(onWake);
  
  // Keep the ref updated with the latest callback
  useEffect(() => {
    onWakeRef.current = onWake;
  }, [onWake]);

  useEffect(() => {
    // 1. Browser Support Check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // 2. Cleanup previous instance if it exists
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
      recognitionRef.current = null;
    }

    if (!isEnabled) {
      setIsListening(false);
      return;
    }

    // 3. Initialize New Instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening as long as possible
    recognition.interimResults = true; // Get results faster
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("NOVA Ears: Online");
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      
      const cleanInput = transcript.toLowerCase();
      
      // Check for keywords
      // We check for various spellings/misinterpretations of 'Nova'
      const triggers = ['nova', 'hey nova', 'hi nova', 'hello nova', 'okay nova', 'noah', 'nola', 'know a'];
      const detected = triggers.some(t => cleanInput.includes(t));

      if (detected) {
        console.log("Wake Word Detected:", cleanInput);
        recognition.abort(); // Stop listening to trigger wake
        onWakeRef.current(); // Call the latest callback
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore harmless errors that happen normally
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
          console.error("Microphone permission denied");
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // AGGRESSIVE RESTART: If enabled, start immediately to stay "Constant"
      // We check isEnabled inside the timeout to ensure we don't restart if user disabled it
      if (isEnabled) {
        setTimeout(() => {
            if (isEnabled && recognitionRef.current === recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    // Ignore already-started errors
                }
            }
        }, 100); // 100ms delay is fast enough to feel instant but prevents CPU freeze
      }
    };

    recognitionRef.current = recognition;

    // 4. Start Listening
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }

    // Cleanup on Unmount or when isEnabled changes
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
        recognitionRef.current = null;
      }
    };
  }, [isEnabled]); // ONLY depends on isEnabled. Re-renders of App won't touch this.

  return { isListening };
};