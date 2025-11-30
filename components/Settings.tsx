import React, { useState, useRef } from 'react';
import { Settings as SettingsType, ThemeColor } from '../types';
import { fetchTTSAudio } from '../services/geminiService';

interface SettingsProps {
  settings: SettingsType;
  alarmTime: string;
  isAlarmEnabled: boolean;
  onUpdateSettings: (newSettings: Partial<SettingsType>) => void;
  onUpdateAlarm: (time: string, enabled: boolean) => void;
  onClose: () => void;
  onStartSleep: () => void;
}

// Comprehensive List: Major World Cities + Dutch Municipalities (Gemeentes)
const LOCATIONS = [
  // Dutch Municipalities
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Apeldoorn", "Haarlem", "Arnhem", "Enschede", "Amersfoort", "Zaanstad", "Den Bosch", "Haarlemmermeer", "Zwolle", "Zoetermeer",
  "Leiden", "Leeuwarden", "Dordrecht", "Maastricht", "Ede", "Alphen aan den Rijn", "Westland", "Alkmaar", "Emmen", "Delft",
  "Venlo", "Deventer", "Helmond", "Amstelveen", "Hilversum", "Oss", "Nissewaard", "Hengelo", "Purmerend", "Roosendaal",
  "Schiedam", "Lelystad", "Leidschendam-Voorburg", "Almelo", "Hoorn", "Vlaardingen", "Gouda", "Velsen", "Assen", "Capelle aan den IJssel",
  "Bergen op Zoom", "Katwijk", "Veenendaal", "Zeist", "Nieuwegein", "Hardenberg", "Roermond", "Doetinchem", "Gooise Meren", "Den Helder",
  "Barneveld", "Hoogeveen", "Oosterhout", "Heerlen", "Vijfheerenlanden", "Kampen", "Pijnacker-Nootdorp", "Woerden", "Heerenveen", "Rijswijk",
  "Weert", "Houten", "Utrechtse Heuvelrug", "Goeree-Overflakkee", "Midden-Groningen", "Baringrecht", "Sittard-Geleen", "Harderwijk", "Zutphen",
  // Major World Cities
  "New York", "London", "Tokyo", "Paris", "Berlin", "Sydney", "Dubai", "Singapore", "Los Angeles", "Toronto",
  "Hong Kong", "Chicago", "Madrid", "Rome", "Seoul", "Mumbai", "Shanghai", "San Francisco", "Barcelona", "Istanbul",
  "Bangkok", "Moscow", "Beijing", "Jakarta", "Delhi", "Brussels", "Copenhagen", "Stockholm", "Oslo", "Helsinki", "Warsaw", "Prague", "Vienna", "Zurich"
].sort();

const INTEREST_OPTIONS = [
  "Technology", "Music", "Politics", "Science", 
  "Finance", "Sports", "Gaming", "Art", "Health", "Space"
];

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  alarmTime, 
  isAlarmEnabled,
  onUpdateSettings, 
  onUpdateAlarm,
  onClose,
  onStartSleep
}) => {
  const themes: ThemeColor[] = ['cyan', 'amber', 'emerald', 'rose'];
  const voices = ['Fenrir', 'Kore', 'Puck', 'Charon', 'Zephyr'];

  const [locationQuery, setLocationQuery] = useState(settings.location);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

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

  const toggleInterest = (interest: string) => {
    const current = settings.interests || [];
    const updated = current.includes(interest) 
      ? current.filter(i => i !== interest)
      : [...current, interest];
    onUpdateSettings({ interests: updated });
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
        // Clean error message if blocked by policy
        const errorMsg = error.message.includes("policy") 
          ? "Permission blocked. Please type location manually." 
          : error.message;
        
        alert(`Location Error: ${errorMsg}`);
        setIsDetectingLocation(false);
      }
    );
  };

  const playVoicePreview = async (voice: string) => {
    if (isLoadingPreview || previewingVoice) return;
    
    setIsLoadingPreview(true);
    setPreviewingVoice(voice);
    onUpdateSettings({ voiceName: voice });

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const text = `Voice online.`;
      const buffer = await fetchTTSAudio(text, ctx, voice);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      
      source.onended = () => {
        setPreviewingVoice(null);
        setIsLoadingPreview(false);
      };
    } catch (e) {
      console.error("Preview failed", e);
      setPreviewingVoice(null);
      setIsLoadingPreview(false);
      alert("Audio preview failed. Check console for details (likely Quota or API Key issue).");
    }
  };

  const filteredLocations = LOCATIONS.filter(c => c.toLowerCase().includes(locationQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl my-auto">
        <h2 className="text-2xl font-digital text-white tracking-widest mb-8 text-center">SYSTEM CONFIG</h2>

        <div className="space-y-6">

          {/* User Profile */}
          <div className="space-y-4 pb-6 border-b border-zinc-800">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">USER PROFILE</label>
            <input 
              type="text" 
              value={settings.userName || ''}
              onChange={(e) => onUpdateSettings({ userName: e.target.value })}
              placeholder="Your Name"
              className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:border-white focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-2 py-1 rounded text-[10px] font-digital tracking-wider border transition-all ${
                    (settings.interests || []).includes(interest)
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-gray-500 border-zinc-800'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          
          {/* Alarm Section */}
          <div className="space-y-2">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">ALARM TIME</label>
            <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-zinc-800">
              <input 
                type="time" 
                value={alarmTime}
                onChange={(e) => onUpdateAlarm(e.target.value, isAlarmEnabled)}
                className="bg-transparent text-3xl font-digital text-white focus:outline-none w-full"
              />
              <button 
                onClick={() => onUpdateAlarm(alarmTime, !isAlarmEnabled)}
                className={`px-4 py-2 rounded-lg font-digital text-xs tracking-wider transition-colors ${isAlarmEnabled ? 'bg-white text-black' : 'bg-zinc-800 text-gray-500'}`}
              >
                {isAlarmEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Location for Weather */}
          <div className="space-y-2 relative">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">LOCATION</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={locationQuery}
                onChange={handleLocationChange}
                onFocus={() => setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                placeholder="Amsterdam, or tap detect..."
                className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:border-white focus:outline-none transition-colors"
              />
              <button 
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="px-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-white hover:text-black transition-colors"
                title="Detect Current Location"
              >
                {isDetectingLocation ? (
                   <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            
            {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl z-10 max-h-40 overflow-y-auto shadow-xl">
                 {filteredLocations.map(city => (
                   <div 
                     key={city} 
                     onClick={() => selectLocation(city)}
                     className="px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-gray-300 hover:text-white border-b border-zinc-800/50 last:border-0"
                   >
                     {city}
                   </div>
                 ))}
              </div>
            )}
          </div>

           {/* Temperature Unit */}
          <div className="space-y-2">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">TEMPERATURE UNIT</label>
            <div className="flex bg-black/40 border border-zinc-800 rounded-xl p-1 w-full max-w-[150px]">
              <button
                onClick={() => onUpdateSettings({ temperatureUnit: 'C' })}
                className={`flex-1 py-2 rounded-lg font-digital text-sm transition-colors ${settings.temperatureUnit === 'C' ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                °C
              </button>
              <button
                onClick={() => onUpdateSettings({ temperatureUnit: 'F' })}
                className={`flex-1 py-2 rounded-lg font-digital text-sm transition-colors ${settings.temperatureUnit === 'F' ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">AI VOICE MODEL</label>
            <div className="grid grid-cols-3 gap-2">
              {voices.map(voice => (
                <button
                  key={voice}
                  onClick={() => playVoicePreview(voice)}
                  disabled={isLoadingPreview && previewingVoice !== voice}
                  className={`py-2 rounded-lg text-xs font-digital tracking-wider border transition-all relative overflow-hidden ${
                    settings.voiceName === voice 
                    ? 'bg-white text-black border-white' 
                    : 'bg-transparent text-gray-500 border-zinc-800 hover:border-gray-500'
                  }`}
                >
                  {voice.toUpperCase()}
                  {previewingVoice === voice && (
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>
                     </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="space-y-2">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">INTERFACE THEME</label>
            <div className="flex gap-4">
              {themes.map(t => (
                <button
                  key={t}
                  onClick={() => onUpdateSettings({ theme: t })}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    settings.theme === t 
                    ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: `var(--color-${t})` }}
                >
                  <div className={`w-full h-full rounded-full bg-${t === 'cyan' ? 'cyan-400' : t === 'amber' ? 'amber-400' : t === 'emerald' ? 'emerald-400' : 'rose-400'}`}></div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-2">
            <label className="text-gray-500 text-xs font-digital tracking-widest block">MODULES</label>
            <div className="flex items-center justify-between py-2 border-b border-zinc-800">
              <span className="text-gray-300 font-light text-sm">Sleep Tracking (VAD)</span>
              <button 
                onClick={() => onUpdateSettings({ isSleepTrackingEnabled: !settings.isSleepTrackingEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.isSleepTrackingEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.isSleepTrackingEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4">
          <button 
            onClick={onStartSleep}
            className="w-full py-4 bg-white text-black font-digital tracking-widest rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
             ENTER SLEEP MODE
          </button>

          <button 
            onClick={onClose}
            className="w-full py-4 border border-zinc-800 text-gray-500 font-digital tracking-widest rounded-xl hover:text-white hover:border-white transition-colors"
          >
            CLOSE CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;