
import React, { useState, useRef, useEffect } from 'react';
import { Settings as SettingsType, ThemeColor } from '../types';
import { fetchTTSAudio, voicePreviewCache } from '../services/geminiService';

interface SettingsProps {
  settings: SettingsType;
  alarmTime: string;
  isAlarmEnabled: boolean;
  onUpdateSettings: (newSettings: Partial<SettingsType>) => void;
  onUpdateAlarm: (time: string, enabled: boolean) => void;
  onClose: () => void;
  onStartSleep: () => void;
}

const LOCATIONS = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Apeldoorn", "Haarlem", "Arnhem", "Enschede", "Amersfoort", "Zaanstad", "Den Bosch", "Haarlemmermeer", "Zwolle", "Zoetermeer",
  "Leiden", "Leeuwarden", "Dordrecht", "Maastricht", "Ede", "Alphen aan den Rijn", "Westland", "Alkmaar", "Emmen", "Delft",
  "Venlo", "Deventer", "Helmond", "Amstelveen", "Hilversum", "Oss", "Nissewaard", "Hengelo", "Purmerend", "Roosendaal",
  "Schiedam", "Lelystad", "Leidschendam-Voorburg", "Almelo", "Hoorn", "Vlaardingen", "Gouda", "Velsen", "Assen", "Capelle aan den IJssel",
  "Bergen op Zoom", "Katwijk", "Veenendaal", "Zeist", "Nieuwegein", "Hardenberg", "Roermond", "Doetinchem", "Gooise Meren", "Den Helder",
  "Barneveld", "Hoogeveen", "Oosterhout", "Heerlen", "Vijfheerenlanden", "Kampen", "Pijnacker-Nootdorp", "Woerden", "Heerenveen", "Rijswijk",
  "Weert", "Houten", "Utrechtse Heuvelrug", "Goeree-Overflakkee", "Midden-Groningen", "Baringrecht", "Sittard-Geleen", "Harderwijk", "Zutphen",
  "New York", "London", "Tokyo", "Paris", "Berlin", "Sydney", "Dubai", "Singapore", "Los Angeles", "Toronto",
  "Hong Kong", "Chicago", "Madrid", "Rome", "Seoul", "Mumbai", "Shanghai", "San Francisco", "Barcelona", "Istanbul",
  "Bangkok", "Moscow", "Beijing", "Jakarta", "Delhi", "Brussels", "Copenhagen", "Stockholm", "Oslo", "Helsinki", "Warsaw", "Prague", "Vienna", "Zurich"
].sort();

const INTEREST_OPTIONS = [
  "Technology", "Music", "Politics", "Science", 
  "Finance", "Sports", "Gaming", "Art", "Health", "Space"
];

const TABS = ['PROFILE', 'ALARM', 'SYSTEM', 'NOVA AI'];

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  alarmTime, 
  isAlarmEnabled,
  onUpdateSettings, 
  onUpdateAlarm,
  onClose,
  onStartSleep
}) => {
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [locationQuery, setLocationQuery] = useState(settings.location);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Voice Preview State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const voice = 'Zephyr'; // LOCKED

  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Colors Helper
  const getThemeColor = (opacity = 1) => {
    switch(settings.theme) {
      case 'cyan': return `rgba(34, 211, 238, ${opacity})`;
      case 'amber': return `rgba(251, 191, 36, ${opacity})`;
      case 'emerald': return `rgba(52, 211, 153, ${opacity})`;
      case 'rose': return `rgba(251, 113, 133, ${opacity})`;
      default: return `rgba(255, 255, 255, ${opacity})`;
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationQuery(val);
    onUpdateSettings({ location: val });
    setShowLocationSuggestions(val.length > 0);
  };

  const selectLocation = (city: string) => {
    setLocationQuery(city);
    onUpdateSettings({ location: city });
    setShowLocationSuggestions(false);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setLocationQuery(locString);
        onUpdateSettings({ location: locString });
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Error detecting location:", error);
        alert(`Location unavailable: ${error.message}`);
        setIsDetectingLocation(false);
      }
    );
  };

  const playVoicePreview = async () => {
    if (isPlayingPreview) return;
    setIsPlayingPreview(true);
    
    // Ensure synced
    if (settings.voiceName !== voice) onUpdateSettings({ voiceName: voice });

    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      let buffer = voicePreviewCache.get(voice);
      if (!buffer) {
         buffer = await fetchTTSAudio("I am Nova. System online.", ctx, voice);
         voicePreviewCache.set(voice, buffer);
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer!;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => setIsPlayingPreview(false);
    } catch (e) {
      console.error(e);
      setIsPlayingPreview(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) return alert("Max file size 4MB");
      const reader = new FileReader();
      reader.onload = (evt) => onUpdateSettings({ customAlarmAudio: evt.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const filteredLocations = LOCATIONS.filter(c => c.toLowerCase().includes(locationQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div 
        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: `0 0 50px ${getThemeColor(0.1)}` }}
      >
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
           <div className="flex items-center gap-3">
              <div className="w-2 h-8" style={{ backgroundColor: getThemeColor() }}></div>
              <h2 className="text-2xl font-digital text-white tracking-widest">
                SYSTEM <span style={{ color: getThemeColor() }}>CONFIG</span>
              </h2>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/5 bg-white/[0.02]">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 font-digital text-sm tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
              {tab}
              {activeTab === tab && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[2px] shadow-[0_0_10px_currentColor]"
                  style={{ backgroundColor: getThemeColor() }}
                ></div>
              )}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {/* --- TAB: PROFILE --- */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-8 animate-fadeIn">
               <div className="space-y-4">
                  <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Designation</label>
                  <input 
                    type="text" 
                    value={settings.userName}
                    onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-lg p-4 text-white font-mono focus:border-white/30 focus:outline-none transition-all"
                    placeholder="Enter Name"
                  />
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Interests Database</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {INTEREST_OPTIONS.map(interest => (
                      <button
                        key={interest}
                        onClick={() => {
                           const current = settings.interests || [];
                           onUpdateSettings({ 
                             interests: current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest] 
                           });
                        }}
                        className={`px-4 py-3 rounded-lg text-xs font-digital tracking-wider border transition-all text-left flex items-center justify-between group ${
                          (settings.interests || []).includes(interest)
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-transparent border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {interest}
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          (settings.interests || []).includes(interest) ? 'bg-current shadow-[0_0_5px_currentColor]' : 'bg-transparent'
                        }`} style={{ color: (settings.interests || []).includes(interest) ? getThemeColor() : 'transparent' }}></div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB: ALARM --- */}
          {activeTab === 'ALARM' && (
            <div className="space-y-8 animate-fadeIn">
               <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-digital text-gray-500 tracking-widest mb-1">ACTIVATION TIME</div>
                    <input 
                      type="time" 
                      value={alarmTime}
                      onChange={(e) => onUpdateAlarm(e.target.value, isAlarmEnabled)}
                      className="bg-transparent text-5xl font-digital text-white focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => onUpdateAlarm(alarmTime, !isAlarmEnabled)}
                    className={`w-16 h-8 rounded-full relative transition-all ${isAlarmEnabled ? 'bg-white' : 'bg-gray-800'}`}
                  >
                     <div 
                       className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ${isAlarmEnabled ? 'translate-x-8 bg-black' : 'bg-gray-500'}`}
                     />
                  </button>
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Audio Source</label>
                  <div className="grid grid-cols-1 gap-4">
                     {/* DEFAULT */}
                     <button 
                       onClick={() => onUpdateSettings({ customAlarmAudio: null })}
                       className={`p-4 rounded-lg border text-left flex items-center gap-4 transition-all ${!settings.customAlarmAudio ? 'border-white/30 bg-white/5' : 'border-white/5 text-gray-500'}`}
                     >
                        <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        </div>
                        <div>
                          <div className="font-digital text-sm text-white">SYSTEM DEFAULT</div>
                          <div className="text-xs text-gray-500">Polyphonic Melody</div>
                        </div>
                     </button>

                     {/* CUSTOM */}
                     <div className={`p-4 rounded-lg border transition-all ${settings.customAlarmAudio ? 'border-white/30 bg-white/5' : 'border-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                             </div>
                             <div>
                               <div className={`font-digital text-sm ${settings.customAlarmAudio ? 'text-white' : 'text-gray-500'}`}>CUSTOM UPLOAD</div>
                               <div className="text-xs text-gray-600">{settings.customAlarmAudio ? 'Audio File Loaded' : 'No file selected'}</div>
                             </div>
                          </div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-digital rounded"
                          >
                            SELECT
                          </button>
                        </div>
                        <input type="file" accept="audio/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB: SYSTEM --- */}
          {activeTab === 'SYSTEM' && (
            <div className="space-y-8 animate-fadeIn">
               {/* LOCATION */}
               <div className="space-y-4">
                 <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Geo-Location</label>
                 <div className="relative flex gap-2">
                    <input 
                      type="text" 
                      value={locationQuery}
                      onChange={handleLocationChange}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                      placeholder="Enter City..."
                      className="w-full bg-black border border-white/10 rounded-lg p-4 text-white font-mono focus:border-white/30 focus:outline-none"
                    />
                    <button 
                      onClick={detectLocation} 
                      disabled={isDetectingLocation}
                      className="px-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center relative overflow-hidden group"
                    >
                       {isDetectingLocation ? (
                         <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                       ) : (
                         <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       )}
                    </button>
                    {showLocationSuggestions && filteredLocations.length > 0 && (
                      <div className="absolute top-full left-0 right-14 mt-2 bg-[#0a0a0a] border border-white/20 rounded-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
                         {filteredLocations.map(city => (
                           <div key={city} onClick={() => selectLocation(city)} className="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm text-gray-300 font-mono border-b border-white/5 last:border-0">{city}</div>
                         ))}
                      </div>
                    )}
                 </div>
               </div>

               {/* UNITS & THEME */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Temp Unit</label>
                     <div className="flex bg-black border border-white/10 rounded-lg p-1">
                        {['C', 'F'].map(unit => (
                          <button
                            key={unit}
                            onClick={() => onUpdateSettings({ temperatureUnit: unit as 'C' | 'F' })}
                            className={`flex-1 py-2 rounded text-sm font-digital transition-all ${settings.temperatureUnit === unit ? 'bg-white/20 text-white' : 'text-gray-600'}`}
                          >
                            °{unit}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Interface Theme</label>
                     <div className="flex justify-between items-center h-[42px]">
                        {(['cyan', 'amber', 'emerald', 'rose'] as ThemeColor[]).map(t => (
                          <button
                            key={t}
                            onClick={() => onUpdateSettings({ theme: t })}
                            className={`w-8 h-8 rounded-full border transition-all duration-300 ${settings.theme === t ? 'scale-125 border-white shadow-[0_0_10px_currentColor]' : 'border-transparent opacity-30 hover:opacity-100'}`}
                            style={{ backgroundColor: `var(--color-${t})`, color: `var(--color-${t})` }}
                          />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB: NOVA AI --- */}
          {activeTab === 'NOVA AI' && (
            <div className="space-y-8 animate-fadeIn">
               
               {/* VOICE MODULE LOCK */}
               <div className="border border-cyan-500/30 bg-cyan-900/10 rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine pointer-events-none"></div>
                  <div className="flex items-center justify-between relative z-10">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_cyan]"></div>
                          <span className="text-cyan-400 font-digital tracking-widest text-xs">VOICE MODULE ACTIVE</span>
                        </div>
                        <h3 className="text-white font-digital text-2xl tracking-wider">ZEPHYR</h3>
                        <p className="text-cyan-600/70 text-xs mt-1 font-mono">Neural Text-to-Speech Engine • Locked for Stability</p>
                     </div>
                     <button 
                       onClick={playVoicePreview}
                       className="w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-all"
                     >
                       {isPlayingPreview ? (
                         <div className="flex gap-1 h-3 items-end">
                           <div className="w-1 bg-cyan-400 animate-music-bar-1"></div>
                           <div className="w-1 bg-cyan-400 animate-music-bar-2"></div>
                           <div className="w-1 bg-cyan-400 animate-music-bar-3"></div>
                         </div>
                       ) : (
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       )}
                     </button>
                  </div>
               </div>

               {/* WAKE WORD DETECTION */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">Wake Word "Hey Nova"</label>
                    <div className="text-xs font-mono px-2 py-1 rounded border border-cyan-500/50 text-cyan-400 bg-cyan-500/10">
                      ALWAYS ACTIVE
                    </div>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm font-light leading-relaxed">
                       Hands-free activation is enabled. Just say "Hey Nova" while on the clock screen to wake the assistant. Requires microphone permission.
                    </p>
                 </div>
               </div>

               {/* SLEEP TRACKING */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-digital text-gray-500 tracking-widest uppercase">VAD Sleep Analytics</label>
                    <button 
                      onClick={() => onUpdateSettings({ isSleepTrackingEnabled: !settings.isSleepTrackingEnabled })}
                      className={`text-xs font-mono px-2 py-1 rounded border transition-all ${settings.isSleepTrackingEnabled ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}
                    >
                      {settings.isSleepTrackingEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-400 text-sm font-light leading-relaxed mb-6">
                       NOVA uses local microphone processing to detect noise events (snoring, talking) during sleep cycles. No audio is recorded to the cloud.
                    </p>
                    <button 
                      onClick={() => { onClose(); onStartSleep(); }}
                      className="w-full py-3 bg-white text-black font-digital tracking-widest rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                       ENTER SLEEP MODE
                    </button>
                 </div>
               </div>
               
               {/* EXTERNAL LINK */}
               <div className="pt-4 border-t border-white/10">
                 <a 
                   href="https://nova-ai-inky-psi.vercel.app" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-between group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:border-cyan-500/30"
                 >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </div>
                        <div>
                            <div className="text-white font-digital tracking-widest text-sm group-hover:text-cyan-400 transition-colors">LEARN MORE</div>
                            <div className="text-gray-500 text-xs font-mono">Visit NOVA AI HQ</div>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                 </a>
               </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
           <span className="text-[10px] text-gray-700 font-digital tracking-widest">NOVA OS v2.4.1</span>
           <button 
             onClick={onClose}
             className="px-8 py-2 border border-white/20 rounded-full text-sm font-digital tracking-widest text-white hover:bg-white hover:text-black transition-all"
           >
             CONFIRM
           </button>
        </div>

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        @keyframes shine { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .animate-shine { animation: shine 3s infinite linear; }
        .animate-music-bar-1 { height: 100%; animation: bounce 0.5s infinite alternate; }
        .animate-music-bar-2 { height: 60%; animation: bounce 0.6s infinite alternate; }
        .animate-music-bar-3 { height: 80%; animation: bounce 0.4s infinite alternate; }
        @keyframes bounce { from { height: 20%; } to { height: 100%; } }
      `}</style>
    </div>
  );
};

export default Settings;
