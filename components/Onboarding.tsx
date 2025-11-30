
import React, { useState, useEffect, useRef } from 'react';

interface OnboardingProps {
  onComplete: (name: string, interests: string[]) => void;
}

const INTEREST_OPTIONS = [
  "Technology", "Music", "Politics", "Science", 
  "Finance", "Sports", "Gaming", "Art", "Health", "Space"
];

const TOUR_STEPS = [
  {
    title: "NOTE TO SELF",
    desc: "Your screen is a canvas. Write thoughts, reminders, or dreams before you sleep. NOVA keeps them safe.",
    icon: (
      <svg className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    )
  },
  {
    title: "INTELLIGENT WAKE",
    desc: "Wake up to your handwritten note read back to you, followed by a briefing on weather & news tailored to your life.",
    icon: (
      <svg className="w-24 h-24 text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )
  },
  {
    title: "SLEEP ANALYTICS",
    desc: "Privacy-first sleep tracking monitors noise levels and snoring to give you insights into your rest quality.",
    icon: (
      <svg className="w-24 h-24 text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
    )
  },
  {
    title: "LIVE ASSISTANT",
    desc: "Connect with NOVA via real-time voice. Ask questions, set alarms, or just chat about the universe.",
    icon: (
      <svg className="w-24 h-24 text-rose-400 drop-shadow-[0_0_25px_rgba(251,113,133,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
    )
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'INTRO' | 'TOUR' | 'PROFILE'>('INTRO');
  const [introPhase, setIntroPhase] = useState(0);
  const [tourStep, setTourStep] = useState(0);
  const [isSlideAnim, setIsSlideAnim] = useState(false);
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Use refs to pass mutable state to the animation loop without triggering re-renders
  const introPhaseRef = useRef(0);
  const modeRef = useRef('INTRO');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    introPhaseRef.current = introPhase;
  }, [introPhase]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'TOUR') return;
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX / width - 0.5) * 20;
    const y = (clientY / height - 0.5) * -20;
    setTilt({ x, y });
  };

  useEffect(() => {
    if (mode === 'INTRO') {
      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(setTimeout(() => setIntroPhase(1), 1000));
      timers.push(setTimeout(() => setIntroPhase(2), 4000));
      timers.push(setTimeout(() => setIntroPhase(3), 5000));
      timers.push(setTimeout(() => setIntroPhase(4), 8000));
      timers.push(setTimeout(() => setIntroPhase(5), 8300));
      timers.push(setTimeout(() => setIntroPhase(6), 9500));
      timers.push(setTimeout(() => setIntroPhase(7), 11000));
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Star {
      x: number;
      y: number;
      z: number;
      color: string;

      constructor() {
        this.x = (Math.random() - 0.5) * canvas!.width * 2;
        this.y = (Math.random() - 0.5) * canvas!.height * 2;
        this.z = Math.random() * 2000;
        this.color = Math.random() > 0.7 ? '#ffffff' : '#22d3ee';
      }

      update(speed: number) {
        this.z -= speed;
        // Optimization: Ensure z doesn't get stuck near 0 causing divide by zero or infinity
        if (this.z < 10) {
          this.z = 2000;
          this.x = (Math.random() - 0.5) * canvas!.width * 2;
          this.y = (Math.random() - 0.5) * canvas!.height * 2;
        }
      }

      draw(c: CanvasRenderingContext2D, centerX: number, centerY: number, speed: number) {
        if (this.z <= 0) return; // Safety check
        
        const scale = 800 / this.z;
        const x2d = centerX + this.x * scale;
        const y2d = centerY + this.y * scale;

        // Culling: Don't draw if way off screen
        if (x2d < -100 || x2d > canvas!.width + 100 || y2d < -100 || y2d > canvas!.height + 100) return;

        const size = Math.max(0.5, (1 - this.z / 2000) * 3);
        const opacity = Math.min(1, (1 - this.z / 2000) + 0.2);

        c.fillStyle = this.color;
        c.strokeStyle = this.color;
        c.globalAlpha = opacity;

        if (speed > 20) {
           const length = Math.max(2, (2000 - this.z) * (speed * 0.002));
           c.beginPath();
           c.moveTo(x2d, y2d);
           const angle = Math.atan2(y2d - centerY, x2d - centerX);
           c.lineTo(x2d - Math.cos(angle) * length, y2d - Math.sin(angle) * length);
           c.lineWidth = size;
           c.stroke();
        } else {
           c.beginPath();
           c.arc(x2d, y2d, size, 0, Math.PI * 2);
           c.fill();
        }
      }
    }

    const starCount = 600; // Reduced count slightly for better mobile performance
    const stars: Star[] = Array.from({ length: starCount }, () => new Star());
    
    let animationId: number;
    let currentSpeed = 0.5;

    const render = () => {
      // CLEAR BACKGROUND
      const phase = introPhaseRef.current;
      ctx.fillStyle = phase === 3 ? 'rgba(0,0,0,0.3)' : '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // SPEED LOGIC
      let targetSpeed = 0.5;
      const m = modeRef.current;
      if (m === 'INTRO') {
        if (phase === 2) targetSpeed = 20; 
        if (phase === 3) targetSpeed = 80; 
        if (phase >= 4) targetSpeed = 0;
      } else {
        targetSpeed = 1.5; 
      }

      currentSpeed += (targetSpeed - currentSpeed) * 0.05;

      stars.forEach(star => {
        star.update(currentSpeed);
        star.draw(ctx, centerX, centerY, currentSpeed);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []); // Empty dependency array = init ONCE

  const startTour = () => {
    setMode('TOUR');
  };

  const nextTourStep = () => {
    setIsSlideAnim(true);
    setTimeout(() => {
      if (tourStep < TOUR_STEPS.length - 1) {
        setTourStep(prev => prev + 1);
        setIsSlideAnim(false);
      } else {
        setMode('PROFILE');
      }
    }, 300);
  };

  const finishOnboarding = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete(name || "Traveler", selectedInterests);
    }, 1000);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      onMouseMove={handleMouseMove}
    >
      
      <canvas 
        ref={canvasRef}
        className={`absolute inset-0 z-0 transition-opacity duration-1000 ${introPhase === 4 ? 'opacity-0' : 'opacity-100'}`}
      />

      <div className={`fixed inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300 ease-out ${introPhase === 4 ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* INTRO SCENE */}
      {mode === 'INTRO' && (
        <>
          <div className={`absolute z-20 transition-all duration-1000 ${introPhase === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
            <h1 className="font-digital text-gray-400 text-xs md:text-sm tracking-[0.8em] uppercase">Introducing</h1>
          </div>

          {introPhase >= 5 && (
            <div className="z-40 flex flex-col items-center">
                <div className={`flex items-end gap-1 md:gap-3 relative transition-all duration-300 ${introPhase === 5 ? 'scale-100 opacity-100 translate-y-0' : 'scale-100'}`}>
                    <span className="text-6xl md:text-9xl font-digital font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">N</span>
                    <div className="flex flex-col items-center justify-end h-[60px] md:h-[90px] w-8 md:w-12 relative pb-1 md:pb-2">
                        <div className="absolute top-[-25px] md:top-[-35px] animate-spin-slow z-10">
                            <svg className="w-12 h-12 md:w-20 md:h-20 text-cyan-400 drop-shadow-[0_0_35px_cyan]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                        </div>
                        <div className="w-4 md:w-6 h-full bg-gradient-to-t from-white via-cyan-100 to-transparent rounded-sm shadow-[0_0_20px_white]"></div>
                    </div>
                    <span className="text-6xl md:text-9xl font-digital font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">GHTNOTE</span>
                </div>

                <div className={`mt-8 transition-all duration-1000 ${introPhase >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_cyan]"></div>
                    <span className="text-gray-300 font-digital text-xs md:text-sm tracking-widest">
                        POWERED BY <span className="text-white font-bold text-shadow-cyan">NOVA AI</span>
                    </span>
                    </div>
                </div>

                <div className={`mt-16 transition-all duration-1000 ${introPhase >= 7 ? 'opacity-100' : 'opacity-0'}`}>
                     <button onClick={startTour} className="px-8 py-4 bg-white text-black font-digital text-lg tracking-[0.2em] rounded-full hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)]">BEGIN TOUR</button>
                </div>
            </div>
          )}
        </>
      )}

      {/* TOUR MODE */}
      {mode === 'TOUR' && (
        <div className="z-50 w-full max-w-6xl flex flex-col items-center justify-center p-6 perspective-1000">
           <div 
             className={`bg-zinc-900/40 border border-white/10 p-12 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center text-center max-w-2xl transform transition-all duration-300 ${isSlideAnim ? 'opacity-0 translate-x-[-50px] scale-90' : 'opacity-100 translate-x-0 scale-100'}`}
             style={{
               transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
               boxShadow: `0 20px 50px rgba(0,0,0,0.5), ${-tilt.x}px ${tilt.y}px 20px rgba(34,211,238,0.1)`
             }}
           >
              <div className="mb-8 transform transition-transform duration-500 hover:scale-110 hover:rotate-6">
                {TOUR_STEPS[tourStep].icon}
              </div>

              <h2 className="text-4xl md:text-5xl font-digital text-white tracking-widest mb-6 drop-shadow-md">
                {TOUR_STEPS[tourStep].title}
              </h2>
              <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto">
                {TOUR_STEPS[tourStep].desc}
              </p>

              <div className="flex items-center gap-3 mt-12 mb-8">
                 {TOUR_STEPS.map((_, i) => (
                   <div key={i} className={`h-1 transition-all duration-300 ${i === tourStep ? 'w-12 bg-cyan-400 shadow-[0_0_10px_cyan]' : 'w-4 bg-gray-700'}`}></div>
                 ))}
              </div>

              <button 
                onClick={nextTourStep}
                className="group relative px-10 py-3 overflow-hidden rounded-full bg-white text-black font-digital tracking-widest text-lg transition-all hover:scale-105"
              >
                <span className="relative z-10">{tourStep === TOUR_STEPS.length - 1 ? "INITIALIZE" : "CONTINUE"}</span>
                <div className="absolute inset-0 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
           </div>
        </div>
      )}

      {/* PROFILE MODE */}
      {mode === 'PROFILE' && (
        <div className="z-50 w-full max-w-md bg-zinc-900/80 p-8 rounded-3xl border border-zinc-700 backdrop-blur-xl animate-fadeInUp shadow-2xl">
           <h2 className="text-2xl font-digital text-white tracking-widest mb-6 text-center">INITIALIZE PROFILE</h2>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-digital text-cyan-400 tracking-widest">DESIGNATION</label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="Your Name..."
                   className="w-full bg-black/40 border border-zinc-600 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-shadow"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-digital text-cyan-400 tracking-widest">INTERESTS</label>
                 <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(interest => (
                       <button
                         key={interest}
                         onClick={() => toggleInterest(interest)}
                         className={`px-3 py-2 rounded-lg text-xs font-digital tracking-wider border transition-all ${
                           selectedInterests.includes(interest)
                             ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                             : 'bg-zinc-800/50 border-zinc-700 text-gray-500 hover:border-gray-500'
                         }`}
                       >
                         {interest}
                       </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={finishOnboarding}
                className="w-full py-4 mt-4 bg-white text-black font-digital font-bold tracking-[0.2em] rounded-xl hover:bg-cyan-400 hover:scale-[1.02] transition-all shadow-lg"
              >
                COMPLETE SETUP
              </button>
           </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .text-shadow-cyan { text-shadow: 0 0 10px rgba(34,211,238,0.8); }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Onboarding;
