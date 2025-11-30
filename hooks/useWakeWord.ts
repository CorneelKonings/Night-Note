import { useEffect, useRef, useState } from 'react';

export const useWakeWord = (onWake: () => void, isEnabled: boolean) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // 1. Check Browser Support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    let isMounted = true;
    let restartTimer: any = null;

    if (isEnabled) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // fast results
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (isMounted) setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (!isMounted) return;

        // 2. Concatenate all current speech into one string
        let fullTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        
        const cleanTranscript = fullTranscript.trim().toLowerCase();

        // 3. Check for Triggers
        const triggers = [
          'hey nova', 'hi nova', 'hello nova', 'okay nova', 'ok nova',
          'hey noah', 'hi noah', 'hello noah', // Common misinterpretation
          'hey nola', 'hi nola',               // Common misinterpretation
          'start nova', 'activate nova', 'wake up nova'
        ];

        const detected = triggers.some(t => cleanTranscript.includes(t));
        
        if (detected) {
          console.log(`NOVA Activated`); // Only log on success
          recognition.stop(); // Stop listening
          onWake(); // Trigger Action
        }
      };

      recognition.onend = () => {
        if (!isMounted) return;
        
        // 4. Safe Restart (prevents browser crash loops)
        if (isEnabled) {
           restartTimer = setTimeout(() => {
             if (isMounted && recognitionRef.current) {
               try {
                 recognition.start();
               } catch (e) {
                 // Ignore start errors
               }
             }
           }, 500); // 500ms delay is safe
        } else {
           setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        // Silently ignore common errors
      };

      recognitionRef.current = recognition;

      // Start immediately
      try {
        recognition.start();
      } catch (e) {
        // ignore
      }

      return () => {
        isMounted = false;
        if (restartTimer) clearTimeout(restartTimer);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        setIsListening(false);
      };
    } else {
      setIsListening(false);
    }
  }, [isEnabled, onWake]);

  return { isListening };
};