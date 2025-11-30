import React, { useEffect, useState, useRef } from 'react';
import { LiveAssistant } from '../services/geminiService';

interface VoiceAssistantProps {
  onClose: () => void;
}

const VoiceAssistantUI: React.FC<VoiceAssistantProps> = ({ onClose }) => {
  const [status, setStatus] = useState("Initializing NOVA...");
  const assistantRef = useRef<LiveAssistant | null>(null);
  
  // Visualizer bars
  const [volumes, setVolumes] = useState<number[]>(new Array(10).fill(10));

  useEffect(() => {
    assistantRef.current = new LiveAssistant((s) => setStatus(s));
    
    // Resume context immediately on mount (user has already clicked a button to get here)
    // Then connect
    assistantRef.current.connect();

    // Fake visualizer animation loop
    const interval = setInterval(() => {
      setVolumes(prev => prev.map(() => Math.random() * 80 + 10));
    }, 100);

    return () => {
      clearInterval(interval);
      assistantRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn">
      <div className="flex flex-col items-center gap-8">
        
        {/* Status Text */}
        <div className="text-cyan-500 font-digital tracking-[0.3em] text-sm uppercase">
          {status}
        </div>

        {/* Visualizer */}
        <div className="flex items-center gap-2 h-32">
          {volumes.map((vol, i) => (
            <div 
              key={i} 
              className="w-4 bg-gradient-to-t from-cyan-900 to-cyan-400 rounded-full transition-all duration-100 ease-in-out shadow-[0_0_15px_rgba(34,211,238,0.5)]"
              style={{ height: `${status.includes('Online') ? vol : 10}%` }}
            />
          ))}
        </div>

        <p className="text-gray-400 max-w-md text-center font-light leading-relaxed">
          Ask NOVA to set an alarm or tell you a story.
        </p>

        <button 
          onClick={onClose}
          className="mt-8 px-8 py-3 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-digital tracking-widest text-sm"
        >
          DISCONNECT
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistantUI;
