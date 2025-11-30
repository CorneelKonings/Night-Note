import React, { useEffect, useState } from 'react';

interface SleepMonitorProps {
  time: Date;
  alarmTime: string;
  isTracking: boolean;
  onWakeUp: () => void;
}

const SleepMonitor: React.FC<SleepMonitorProps> = ({ time, alarmTime, isTracking, onWakeUp }) => {
  const [dotsVisible, setDotsVisible] = useState(true);

  useEffect(() => {
    // Slower blink for sleep mode
    const interval = setInterval(() => {
      setDotsVisible(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer" onClick={onWakeUp}>
      {/* Very dim display for night time */}
      <div className="flex flex-col items-center opacity-20 hover:opacity-50 transition-opacity duration-1000">
        <div className="flex text-9xl font-digital font-bold text-red-900 select-none">
          <span>{hours}</span>
          <span className={`${dotsVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 mx-2`}>:</span>
          <span>{minutes}</span>
        </div>
        
        <div className="mt-8 flex items-center gap-4">
           <div className="text-red-900 font-digital tracking-[0.3em] text-sm">
             ALARM: {alarmTime}
           </div>
           {isTracking && (
             <div className="flex items-center gap-2 text-red-900/50">
               <span className="w-2 h-2 rounded-full bg-red-900 animate-pulse"></span>
               <span className="text-xs font-digital tracking-widest">REC</span>
             </div>
           )}
        </div>
      </div>
      
      <div className="absolute bottom-10 text-zinc-900 text-xs font-digital tracking-widest">
        TAP SCREEN TO WAKE UP
      </div>
    </div>
  );
};

export default SleepMonitor;