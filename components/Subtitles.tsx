import React, { useRef, useEffect } from 'react';
import { ThemeColor } from '../types';

interface SubtitlesProps {
  text: string;
  progressRatio: number; // 0 to 1 representing audio progress
  theme: ThemeColor;
}

const Subtitles: React.FC<SubtitlesProps> = ({ text, progressRatio, theme }) => {
  // Logic to determine current word based on CHARACTER count (weighted)
  // This provides a much better approximation of speech timing than simple word count
  
  const words = text.split(/\s+/);
  const totalChars = text.length;
  const targetCharIndex = Math.floor(progressRatio * totalChars);

  let charCount = 0;
  let currentWordIndex = 0;

  for (let i = 0; i < words.length; i++) {
    const wordLength = words[i].length + 1; // +1 for space
    if (charCount + wordLength > targetCharIndex) {
      currentWordIndex = i;
      break;
    }
    charCount += wordLength;
    if (i === words.length - 1) currentWordIndex = words.length - 1;
  }

  // Ref for auto-scrolling
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [currentWordIndex]);

  const themeColors: Record<ThemeColor, string> = {
    cyan: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]',
    amber: 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]',
    emerald: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
    rose: 'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]'
  };

  const activeClass = themeColors[theme];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden mask-image-linear-gradient">
        {/* Gradient mask on top/bottom to fade text */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black via-transparent to-black z-10"></div>
        
        <div 
            ref={containerRef}
            className="w-full max-w-4xl text-center px-4 py-32 overflow-y-auto scroll-smooth no-scrollbar"
            style={{ maxHeight: '70vh' }}
        >
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-4 text-2xl md:text-4xl font-light leading-loose transition-all duration-300">
            {words.map((word, index) => {
            const isActive = index === currentWordIndex;
            const isPast = index < currentWordIndex;
            
            return (
                <span 
                key={index} 
                ref={isActive ? activeWordRef : null}
                className={`transition-all duration-300 rounded px-1 ${
                    isActive 
                    ? `${activeClass} scale-110 font-medium bg-white/5` 
                    : isPast 
                        ? 'text-gray-400 opacity-60' 
                        : 'text-gray-700 opacity-30 blur-[0.5px]'
                }`}
                >
                {word}
                </span>
            );
            })}
        </div>
        </div>
    </div>
  );
};

export default Subtitles;