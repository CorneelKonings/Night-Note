import React from 'react';
import { ThemeColor } from '../types';

interface ClockDisplayProps {
  time: Date;
  nextAlarm: string | null;
  onOpenWriting: () => void;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  hasNote: boolean;
  theme: ThemeColor;
  isListening: boolean; // NEW PROP
}

const ClockDisplay: React.FC<ClockDisplayProps> = ({ 
  time, nextAlarm, onOpenWriting, hasNote, onToggleVoice, onOpenSettings, theme, isListening 
}) => {
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  // Theme classes
  const themeClasses: Record<ThemeColor, string> = {
    cyan: 'hover:text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]',
    amber: 'hover:text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    emerald: 'hover:text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]',
    rose: 'hover:text-rose-400 drop-shadow-[0_0_30px_rgba(251,113,133,0.3)]'
  };

  const textColors: Record<ThemeColor, string> = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400'
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none relative">
      
      {/* Top Bar Info */}
      <div className="absolute top-6 flex justify-between w-full px-6 sm:px-10 text-gray-600 font-digital text-xs sm:text-sm tracking-[0.2em]">
        <div className="flex gap-4">
          <span>NIGHTNOTE SYS.02</span>
          <span className={`${hasNote ? textColors[theme] + ' animate-pulse' : 'opacity-0'} transition-opacity`}>
             • NOTE PENDING
          </span>
        </div>
        <div className="flex items-center gap-4">
           {nextAlarm ? (
             <span className={textColors[theme]}>ALARM {nextAlarm}</span>
           ) : (
             <span>ALARM OFF</span>
           )}
           <button onClick={onOpenSettings} className="hover:text-white transition-colors">
             [ SETTINGS ]
           </button>
        </div>
      </div>

      {/* Main Time Display */}
      <div 
        onClick={onOpenWriting}
        className="relative cursor-pointer group flex items-baseline gap-2 sm:gap-4 scale-75 sm:scale-100 transition-transform"
      >
        <div className={`flex text-[8rem] sm:text-[14rem] md:text-[18rem] font-digital leading-none font-bold text-white tracking-tighter transition-all duration-500 ${themeClasses[theme]}`}>
          <span className="transition-colors duration-500">{hours}</span>
          <span className="animate-pulse text-gray-800 mx-2">:</span>
          <span className="transition-colors duration-500">{minutes}</span>
        </div>
        <div className="hidden sm:block text-2xl sm:text-4xl font-digital text-gray-800 w-16 sm:w-20">
          {seconds}
        </div>
        
        {/* Hint for interaction */}
        <div className="absolute -bottom-8 sm:-bottom-12 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-gray-600 text-xs sm:text-sm tracking-[0.5em] font-digital uppercase">
          Touch to Write Note
        </div>
      </div>

      {/* Note Indicator Icon */}
      {hasNote && (
        <div className={`absolute bottom-24 flex items-center gap-2 ${textColors[theme]} animate-pulse opacity-80`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <span className="font-digital text-xs tracking-widest">MEMO STORED</span>
        </div>
      )}

      {/* Wake Word Indicator */}
      {isListening && (
         <div className="absolute top-24 sm:top-32 flex items-center gap-2 animate-pulse">
            <div className={`w-2 h-2 rounded-full ${textColors[theme]} bg-current shadow-[0_0_10px_currentColor]`}></div>
            <span className={`font-digital text-[10px] tracking-[0.3em] uppercase ${textColors[theme]} opacity-70`}>Listening</span>
         </div>
      )}

      {/* Voice Control */}
      <div className="absolute bottom-8 right-8 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleVoice(); }}
          className={`p-4 rounded-full border border-gray-800 bg-gray-900/50 text-gray-600 transition-all shadow-lg backdrop-blur-sm group hover:border-gray-500 hover:text-white`}
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

    </div>
  );
};

export default ClockDisplay;