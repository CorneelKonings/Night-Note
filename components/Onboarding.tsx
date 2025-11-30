import React, { useState, useEffect, useRef } from 'react';

interface OnboardingProps {
  onComplete: (name: string, interests: string[]) => void;
}

const INTEREST_OPTIONS = [
  "Technology", "Music", "Politics", "Science", 
  "Finance", "Sports", "Gaming", "Art", "Health", "Space"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0 = Intro, 1 = Feature 1, 2 = Feature 2, 3 = Profile
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  
  // Intro Phases:
  // 0: Boot sequence (Text typing)
  // 1: Drift (Slow stars)
  // 2: Warp Engage (Stars stretch)
  // 3: Flash (White out)
  // 4: Logo Reveal (Slam)
  // 5: HUD Online (Button appears)
  const [introPhase, setIntroPhase] = useState(0);

  // Skip logic
  const skipIntro = () => {
    if (step === 0) setIntroPhase(5);
  };

  // Cinematic Timeline
  useEffect(() => {
    if (step === 0) {
      const timers: ReturnType<typeof setTimeout>[] = [];
      
      // 0s: Start Boot
      timers.push(setTimeout(() => setIntroPhase(1), 1500));  // Start drifting
      timers.push(setTimeout(() => setIntroPhase(2), 5000));  // ENGAGE WARP (after 5s)
      timers.push(setTimeout(() => setIntroPhase(3), 8500));  // FLASH (Peak warp)
      timers.push(setTimeout(() => setIntroPhase(4), 8800));  // LOGO SLAM
      timers.push(setTimeout(() => setIntroPhase(5), 11000)); // UI Ready

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [step]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      setIsExiting(true);
      setTimeout(() => {
        onComplete(name || "Traveler", selectedInterests);
      }, 800);
    }
  };

  // --- Star Generation ---
  // We generate three layers of stars for parallax effect
  const renderStars = (count: number, speed: 'slow' | 'fast' | 'warp') => {
    return new Array(count).fill(0).map((_, i) => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = Math.random() * 2 + 1;
      const delay = Math.random() * 5;
      
      let animationClass = '';
      if (speed === 'slow') animationClass = 'animate-drift';
      if (speed === 'fast') animationClass = 'animate-fly';
      if (speed === 'warp') animationClass = 'animate-warp-stretch';

      return (
        <div 
          key={i}
          className={`absolute bg-white rounded-full ${animationClass}`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: speed === 'warp' ? `${size}px` : `${size}px`,
            height: speed === 'warp' ? `${size * 40}px` : `${size}px`,
            opacity: Math.random(),
            animationDuration: speed === 'warp' ? '0.2s' : `${3 + Math.random() * 5}s`,
            animationDelay: `-${delay}s`,
            transform: 'translateZ(0)',
          }}
        />
      );
    });
  };

  const renderContent = () => {
    switch (step) {
      case 0: // THE CINEMATIC INTRO
        return (
          <div className="relative w-full h-full flex items-center justify-center perspective-1000">
             
             {/* Phase 0: Boot Text */}
             {introPhase === 0 && (
               <div className="font-digital text-cyan-500 text-xs tracking-widest animate-pulse">
                 SYSTEM_BOOT_SEQUENCE_INIT...
               </div>
             )}

             {/* Phase 1: Drifting Text */}
             <div className={`absolute transition-all duration-1000 ${introPhase === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <h1 className="text-4xl md:text-6xl font-thin tracking-[0.5em] text-white font-digital text-center">
                  INTRODUCING
                </h1>
             </div>

             {/* Phase 3: The Flash */}
             <div className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 ease-out ${introPhase === 3 ? 'opacity-100' : 'opacity-0'}`}></div>

             {/* Phase 4: Logo Reveal */}
             <div className={`flex flex-col items-center z-40 transition-all duration-500 transform ${introPhase >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-[5]'}`}>
                
                {/* LOGO CONTAINER */}
                <div className="flex items-end gap-1 md:gap-3 relative">
                   {/* N */}
                   <span className="text-6xl md:text-9xl font-digital font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">N</span>
                   
                   {/* THE 'I' with STAR */}
                   <div className="flex flex-col items-center justify-end h-[60px] md:h-[90px] w-8 md:w-12 relative pb-1 md:pb-2">
                      {/* The Star (Ball of the I) */}
                      <div className="absolute top-[-20px] md:top-[-30px] animate-spin-slow z-10">
                         <svg className="w-10 h-10 md:w-16 md:h-16 text-cyan-400 drop-shadow-[0_0_25px_cyan]" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                         </svg>
                      </div>
                      {/* The Stem */}
                      <div className="w-3 md:w-5 h-full bg-gradient-to-t from-white via-cyan-100 to-transparent rounded-sm shadow-[0_0_15px_white]"></div>
                   </div>

                   {/* GHTNOTE */}
                   <span className="text-6xl md:text-9xl font-digital font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">GHTNOTE</span>
                </div>

                {/* Powered By */}
                <div className={`mt-8 transition-all duration-1000 delay-500 ${introPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div>
                    <span className="text-gray-300 font-digital text-xs md:text-sm tracking-widest">
                      POWERED BY <span className="text-white font-bold text-shadow-cyan">NOVA AI</span>
                    </span>
                  </div>
                </div>

             </div>
          </div>
        );

      case 1: // WRITE
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn space-y-10 z-20">
            <div className="relative group perspective-500">
               <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-all duration-500"></div>
               <div className="transform rotate-y-12 transition-transform duration-1000 group-hover:rotate-y-0">
                  <svg className="w-40 h-40 text-emerald-400 relative z-10 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               </div>
            </div>
            <div>
              <h2 className="text-5xl font-digital text-white tracking-widest drop-shadow-lg mb-4">
                NOTE TO SELF
              </h2>
              <p className="text-gray-400 text-lg max-w-lg font-light leading-relaxed mx-auto">
                Handwrite a thought on the screen before you sleep. <br/>
                <span className="text-emerald-400 font-bold">NOVA</span> reads it back when you wake.
              </p>
            </div>
          </div>
        );

      case 2: // BRIEFING
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn space-y-10 z-20">
             <div className="relative group perspective-500">
               <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full group-hover:bg-amber-500/30 transition-all duration-500"></div>
               <div className="transform rotate-y-12 transition-transform duration-1000 group-hover:rotate-y-0">
                  <svg className="w-40 h-40 text-amber-400 relative z-10 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
               </div>
             </div>
            <div>
              <h2 className="text-5xl font-digital text-white tracking-widest drop-shadow-lg mb-4">
                NOVA BRIEFING
              </h2>
              <p className="text-gray-400 text-lg max-w-lg font-light leading-relaxed mx-auto">
                Start your day with intelligence. <br/>
                Weather, news, and sleep insights tailored by <span className="text-amber-400 font-bold">NOVA</span>.
              </p>
            </div>
          </div>
        );

      case 3: // PROFILE
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn w-full max-w-md z-20">
            <h2 className="text-3xl font-digital text-white tracking-widest mb-2">IDENTIFY YOURSELF</h2>
            <p className="text-gray-500 text-sm mb-8">Configure NOVA Personalization Protocol.</p>
            
            <div className="w-full space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-xl">
              <div className="flex flex-col items-start gap-2 text-left">
                <label className="text-xs font-digital text-cyan-400 tracking-widest">DESIGNATION (NAME)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name..."
                  className="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-white text-lg focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all placeholder-gray-700"
                />
              </div>

              <div className="flex flex-col items-start gap-2 text-left">
                <label className="text-xs font-digital text-cyan-400 tracking-widest">INTEREST PROTOCOLS</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-2 rounded-lg text-xs font-digital tracking-wider border transition-all ${
                        selectedInterests.includes(interest)
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                          : 'bg-zinc-800/50 border-zinc-700 text-gray-500 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
      
      {/* 3D SPACE BACKGROUND CONTAINER */}
      <div className="absolute inset-0 bg-black perspective-1000 overflow-hidden">
         {/* Deep Space Gradient */}
         <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,20,35,1)_0%,_rgba(0,0,0,1)_100%)] transition-opacity duration-2000 ${introPhase >= 3 ? 'opacity-100' : 'opacity-80'}`}></div>
         
         {/* STAR LAYERS - Visibility controlled by phase */}
         {/* Phase 0 & 1: Drifting Stars */}
         <div className={`absolute inset-0 transition-opacity duration-1000 ${introPhase < 2 ? 'opacity-100' : 'opacity-0'}`}>
            {renderStars(100, 'slow')}
         </div>

         {/* Phase 2: Warp Stars */}
         <div className={`absolute inset-0 origin-center transition-all duration-500 ${introPhase === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            {renderStars(50, 'warp')}
         </div>

         {/* Post-Intro: Ambient Dust */}
         <div className={`absolute inset-0 transition-opacity duration-2000 ${introPhase >= 4 ? 'opacity-40' : 'opacity-0'}`}>
            {renderStars(30, 'slow')}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-4xl min-h-[500px] flex flex-col items-center justify-center p-6">
        {renderContent()}
      </div>

      {/* Navigation (Only appears after logo reveal) */}
      <div className={`absolute bottom-12 z-20 w-full max-w-xs flex flex-col items-center gap-6 transition-all duration-1000 delay-500 ${introPhase >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Progress Dots */}
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-cyan-400 shadow-[0_0_10px_cyan]' : 'w-2 bg-gray-800'}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full py-5 bg-white text-black font-digital font-bold text-lg tracking-[0.2em] rounded-full hover:bg-cyan-400 hover:text-black hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          {step === 3 ? "INITIALIZE SYSTEM" : (step === 0 ? "BEGIN TOUR" : "NEXT")}
        </button>
      </div>

      {/* Skip Button (During Intro) */}
      {introPhase < 4 && (
        <button 
          onClick={skipIntro}
          className="absolute bottom-8 right-8 z-50 text-gray-600 font-digital text-xs tracking-widest hover:text-white transition-colors"
        >
          SKIP SEQUENCE
        </button>
      )}

      {/* Custom Keyframes for Animations */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .perspective-500 { perspective: 500px; }
        
        .text-shadow-cyan { text-shadow: 0 0 10px rgba(34,211,238,0.8); }
        .rotate-y-12 { transform: rotateY(12deg); }
        .rotate-y-0 { transform: rotateY(0deg); }

        /* Drifting Stars */
        @keyframes drift {
          0% { transform: translateZ(0) translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateZ(200px) translateY(-50px); opacity: 0; }
        }
        .animate-drift { animation: drift linear infinite; }

        /* Warp Stretch */
        @keyframes warp-stretch {
          0% { transform: translateZ(0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateZ(800px) scale(1, 40); opacity: 0; }
        }
        .animate-warp-stretch { animation: warp-stretch linear infinite; }

        /* Slow Spin for Star */
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Onboarding;