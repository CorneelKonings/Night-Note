import React, { useState } from 'react';
import { Settings, ThemeColor } from '../types';

interface OnboardingProps {
  onComplete: (name: string, interests: string[]) => void;
}

const INTEREST_OPTIONS = [
  "Technology", "Music", "Politics", "Science", 
  "Finance", "Sports", "Gaming", "Art", "Health", "Space"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);

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

  const renderSlide = () => {
    switch (step) {
      case 0: // Intro
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn space-y-8">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 border border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h1 className="text-4xl md:text-6xl font-digital font-bold text-white tracking-widest drop-shadow-lg">
              NIGHTNOTE
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-md">
              The futuristic alarm clock that listens to your dreams and wakes you with intelligence.
            </p>
          </div>
        );
      case 1: // Feature: Write
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn space-y-8">
            <div className="relative">
               <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
               <svg className="w-32 h-32 text-emerald-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h2 className="text-3xl font-digital text-emerald-400 tracking-wider">
              NOTE TO SELF
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              Scribble a thought on the screen before you sleep. We'll read it back to you the moment you wake up.
            </p>
          </div>
        );
      case 2: // Feature: AI Briefing
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn space-y-8">
             <div className="relative">
               <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
               <svg className="w-32 h-32 text-amber-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             </div>
            <h2 className="text-3xl font-digital text-amber-400 tracking-wider">
              MORNING BRIEF
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              Start your day with a curated AI briefing. Weather, news, and sleep insights tailored just for you.
            </p>
          </div>
        );
      case 3: // Personalization
        return (
          <div className="flex flex-col items-center text-center animate-fadeIn w-full max-w-md">
            <h2 className="text-2xl font-digital text-white tracking-widest mb-2">IDENTIFY YOURSELF</h2>
            <p className="text-gray-500 text-sm mb-8">So we know who we are waking up.</p>
            
            <div className="w-full space-y-6">
              <div className="flex flex-col items-start gap-2">
                <label className="text-xs font-digital text-cyan-400 tracking-widest">DESIGNATION (NAME)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name..."
                  className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 text-white text-lg focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
                />
              </div>

              <div className="flex flex-col items-start gap-2">
                <label className="text-xs font-digital text-cyan-400 tracking-widest">INTEREST PROTOCOLS</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-digital tracking-wider border transition-all ${
                        selectedInterests.includes(interest)
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                          : 'bg-transparent border-zinc-800 text-gray-500 hover:border-gray-600'
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
    <div className={`fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-6 transition-opacity duration-700 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50 pointer-events-none"></div>

      <div className="z-10 w-full max-w-2xl min-h-[400px] flex flex-col items-center justify-center">
        {renderSlide()}
      </div>

      <div className="absolute bottom-12 z-10 w-full max-w-xs flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-white' : 'w-1.5 bg-gray-700'}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full py-4 bg-white text-black font-digital font-bold text-lg tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {step === 3 ? "INITIALIZE SYSTEM" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
