"use client";

import { useState, useEffect, useRef, useMemo } from "react";

// Color schemes
type ColorScheme = "ocean" | "forest" | "violet" | "sunset" | "slate";

interface ColorTheme {
  primary: string;
  primaryDark: string;
  buttonBg: string;
  buttonText: string;
  volumeText: string;
  mutedText: string;
  pendingBg: string;
  pendingText: string;
  iconColor: string;
}

const COLOR_SCHEMES: Record<ColorScheme, ColorTheme> = {
  ocean: {
    primary: "text-cyan-600",
    primaryDark: "text-cyan-400",
    buttonBg: "bg-cyan-500",
    buttonText: "text-white",
    volumeText: "text-cyan-600",
    mutedText: "text-red-600",
    pendingBg: "bg-yellow-500/20",
    pendingText: "text-yellow-600",
    iconColor: "text-cyan-600",
  },
  forest: {
    primary: "text-emerald-600",
    primaryDark: "text-emerald-400",
    buttonBg: "bg-emerald-500",
    buttonText: "text-white",
    volumeText: "text-emerald-700",
    mutedText: "text-red-600",
    pendingBg: "bg-yellow-500/20",
    pendingText: "text-yellow-600",
    iconColor: "text-emerald-600",
  },
  violet: {
    primary: "text-violet-600",
    primaryDark: "text-violet-400",
    buttonBg: "bg-violet-500",
    buttonText: "text-white",
    volumeText: "text-violet-600",
    mutedText: "text-red-600",
    pendingBg: "bg-yellow-500/20",
    pendingText: "text-yellow-600",
    iconColor: "text-violet-600",
  },
  sunset: {
    primary: "text-amber-600",
    primaryDark: "text-amber-400",
    buttonBg: "bg-amber-500",
    buttonText: "text-white",
    volumeText: "text-amber-600",
    mutedText: "text-red-600",
    pendingBg: "bg-yellow-500/20",
    pendingText: "text-yellow-600",
    iconColor: "text-amber-600",
  },
  slate: {
    primary: "text-slate-700",
    primaryDark: "text-slate-400",
    buttonBg: "bg-slate-700",
    buttonText: "text-white",
    volumeText: "text-slate-700",
    mutedText: "text-red-600",
    pendingBg: "bg-yellow-500/20",
    pendingText: "text-yellow-600",
    iconColor: "text-slate-700",
  },
};

export default function Home() {
  // State for alarms
  const [alarms, setAlarms] = useState<{
    id: number; 
    time: string; 
    sound: string; 
    soundId: string; 
    played: boolean;
    customUrl?: string;
    customFile?: string;
    days: string[];
    interruptPrevious: boolean;
    enabled: boolean;
    volume: number;
  }[]>([]);
  
  // State for All Alarms Enabled
  const [allAlarmsEnabled, setAllAlarmsEnabled] = useState(true);
  
  // State for Theme
  const [isDarkMode, setIsDarkMode] = useState(true);

  // State for Color Scheme
  const [colorScheme, setColorScheme] = useState<ColorScheme>("ocean");

  // State for Menu (NEW)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<{
    id: number; 
    time: string; 
    sound: string; 
    soundId: string;
    customUrl?: string;
    customFile?: string;
    days: string[];
    interruptPrevious: boolean;
    enabled: boolean;
    volume: number;
  } | null>(null);

  // State for Form Inputs
  const [selectedHour, setSelectedHour] = useState("07");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [isPM, setIsPM] = useState(false);
  const [selectedSoundId, setSelectedSoundId] = useState("morning-chime");
  const [newAlarmSound, setNewAlarmSound] = useState("");
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);

  // State for Custom Sounds
  const [customSoundType, setCustomSoundType] = useState<"url" | "file">("url");
  const [customSoundUrl, setCustomSoundUrl] = useState("");
  const [customFileName, setCustomFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Day Selection
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // State for Interrupt Toggle
  const [interruptPrevious, setInterruptPrevious] = useState(false);

  // State for Volume
  const [volume, setVolume] = useState(5);

  // State for Time Conflict Warning
  const [timeConflict, setTimeConflict] = useState<string | null>(null);

  // State for Active Alarm
  const [activeAlarm, setActiveAlarm] = useState<{
    id: number; 
    time: string; 
    sound: string; 
    soundId: string;
    customUrl?: string;
    customFile?: string;
    days: string[];
    interruptPrevious: boolean;
    enabled: boolean;
    volume: number;
  } | null>(null);

  // State for Pending Alarms
  const [pendingAlarms, setPendingAlarms] = useState<typeof alarms[0][]>([]);

  // State for Notification Permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Audio context ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmLoopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sound definitions
  const SOUND_OPTIONS = [
    { id: "morning-chime", name: "Morning Chime", type: "chime" as const },
    { id: "gentle-wake", name: "Gentle Wake", type: "gentle" as const },
    { id: "sleep-bell", name: "Sleep Bell", type: "bell" as const },
    { id: "digital-beep", name: "Digital Beep", type: "beep" as const },
    { id: "soft-chime", name: "Soft Chime", type: "soft" as const },
    { id: "nature-birds", name: "Nature Birds", type: "birds" as const },
    { id: "custom", name: "🎵 Custom Sound", type: "custom" as const },
  ];

  // Day options
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Dummy data with volume
  const DUMMY_DATA = [
    { id: 1, time: "07:00 AM", sound: "Morning Chime", soundId: "morning-chime", played: false, days: ["MON", "TUE", "WED", "THU", "FRI"], interruptPrevious: false, enabled: true, volume: 5 },
    { id: 2, time: "08:30 AM", sound: "Gentle Wake", soundId: "gentle-wake", played: false, days: ["MON", "WED", "FRI"], interruptPrevious: false, enabled: true, volume: 7 },
    { id: 3, time: "09:00 PM", sound: "Sleep Bell", soundId: "sleep-bell", played: false, days: [], interruptPrevious: false, enabled: true, volume: 3 },
  ];

  // Generate hours (01-12)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  
  // Generate minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Get current color theme
  const theme = COLOR_SCHEMES[colorScheme];

  // Get volume label
  const getVolumeLabel = (vol: number) => {
    if (vol === 0) return "Muted";
    if (vol <= 3) return "Low";
    if (vol <= 6) return "Medium";
    if (vol <= 9) return "High";
    return "Max";
  };

  // Get volume icon
  const getVolumeIcon = (vol: number) => {
    if (vol === 0) return "🔇";
    if (vol <= 3) return "🔈";
    if (vol <= 6) return "🔉";
    return "🔊";
  };

  // Check for time + day conflicts
  const checkTimeConflict = (time: string, days: string[], excludeId?: number) => {
    if (days.length === 0) return null;
    
    const conflicts = alarms.filter(alarm => {
      if (excludeId && alarm.id === excludeId) return false;
      if (alarm.time !== time) return false;
      if (alarm.days.length === 0) return false;
      
      const hasOverlap = days.some(day => alarm.days.includes(day));
      return hasOverlap;
    });
    
    if (conflicts.length > 0) {
      const conflictDetails = conflicts.map(c => {
        const overlappingDays = days.filter(day => c.days.includes(day));
        return `${c.time} on ${overlappingDays.join(', ')}`;
      });
      return conflictDetails.join(', ');
    }
    
    return null;
  };

  // --- NOTIFICATION PERMISSION ---
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // --- Load color scheme from localStorage ---
  useEffect(() => {
    const saved = localStorage.getItem('sound-scheduler-color-scheme');
    if (saved && Object.keys(COLOR_SCHEMES).includes(saved)) {
      setColorScheme(saved as ColorScheme);
    }
  }, []);

  // --- Save color scheme to localStorage ---
  useEffect(() => {
    localStorage.setItem('sound-scheduler-color-scheme', colorScheme);
  }, [colorScheme]);

  // --- Close menu when clicking outside (NEW) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('main-menu');
      const button = document.getElementById('menu-button');
      if (menu && !menu.contains(event.target as Node) && 
          button && !button.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // --- Reset played status at midnight ---
  useEffect(() => {
    const resetPlayedStatus = () => {
      setAlarms(prev => {
        const updated = prev.map(alarm => ({
          ...alarm,
          played: false
        }));
        localStorage.setItem('sound-scheduler-alarms', JSON.stringify(updated));
        return updated;
      });
    };

    resetPlayedStatus();
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeoutId = setTimeout(resetPlayedStatus, msUntilMidnight);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // --- Check for conflicts when time or days change ---
  useEffect(() => {
    if (isModalOpen && selectedHour && selectedMinute && selectedDays.length > 0) {
      const formattedTime = formatTime12Hour(selectedHour, selectedMinute, isPM);
      const conflict = checkTimeConflict(formattedTime, selectedDays, editingAlarm?.id);
      setTimeConflict(conflict);
    } else {
      setTimeConflict(null);
    }
  }, [selectedHour, selectedMinute, isPM, selectedDays, editingAlarm, isModalOpen]);

  // --- ALARM CHECKER ---
  useEffect(() => {
    alarmIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
      
      const currentAMPm = currentHours >= 12 ? "PM" : "AM";
      const currentHours12 = currentHours % 12 || 12;
      const currentTime12 = `${currentHours12.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")} ${currentAMPm}`;
      
      const matchingAlarms = alarms.filter(alarm => {
        const timeMatches = alarm.time === currentTime12;
        const dayMatches = alarm.days.length > 0 && alarm.days.includes(currentDay);
        const notAlreadyPlayed = !alarm.played;
        const isEnabled = alarm.enabled && allAlarmsEnabled;
        const hasVolume = alarm.volume > 0;
        
        return timeMatches && dayMatches && notAlreadyPlayed && isEnabled && hasVolume;
      });

      matchingAlarms.forEach(alarm => {
        if (activeAlarm !== null) {
          if (alarm.interruptPrevious) {
            triggerAlarm(alarm, true);
          } else {
            if (!pendingAlarms.find(p => p.id === alarm.id)) {
              setPendingAlarms(prev => [...prev, alarm]);
            }
          }
        } else {
          triggerAlarm(alarm, false);
        }
      });
    }, 1000);
    
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
    };
  }, [alarms, activeAlarm, pendingAlarms, allAlarmsEnabled]);

  useEffect(() => {
    if (activeAlarm === null && pendingAlarms.length > 0) {
      const nextAlarm = pendingAlarms[0];
      setPendingAlarms(prev => prev.slice(1));
      triggerAlarm(nextAlarm, false);
    }
  }, [activeAlarm, pendingAlarms]);

  const triggerAlarm = (alarm: typeof alarms[0], interrupting: boolean = false) => {
    if (interrupting) {
      stopAllSounds();
    }
    
    setActiveAlarm(alarm);
    
    const customUrl = alarm.customUrl || alarm.customFile;
    const volumeLevel = alarm.volume / 10;
    
    if (alarm.soundId === "custom" && customUrl) {
      playSoundPattern("custom", alarm.interruptPrevious, customUrl, volumeLevel);
    } else {
      playSoundPattern(getSoundById(alarm.soundId).type, alarm.interruptPrevious, undefined, volumeLevel);
    }
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 " + (interrupting ? "Now Playing" : "Scheduled Audio"), {
        body: `${alarm.sound} - ${alarm.time} (${getVolumeIcon(alarm.volume)} ${getVolumeLabel(alarm.volume)})`,
        icon: "🔔",
        requireInteraction: true,
      });
    }
    
    setAlarms(prev => prev.map(a => 
      a.id === alarm.id ? { ...a, played: true } : a
    ));
  };

  const stopAllSounds = () => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];
    
    if (alarmLoopTimeoutRef.current) {
      clearTimeout(alarmLoopTimeoutRef.current);
      alarmLoopTimeoutRef.current = null;
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setPlayingSoundId(null);
  };

  const handleDismissAlarm = () => {
    if (activeAlarm) {
      stopAllSounds();
      setActiveAlarm(null);
      localStorage.setItem('sound-scheduler-alarms', JSON.stringify(alarms));
    }
  };

  const handleSnoozeAlarm = () => {
    if (activeAlarm) {
      stopAllSounds();
      
      const [time, ampm] = activeAlarm.time.split(" ");
      let [hours, minutes] = time.split(":");
      let h = parseInt(hours);
      let m = parseInt(minutes);
      
      m += 5;
      if (m >= 60) {
        m = 0;
        h += 1;
        if (h > 12) h = 1;
      }
      
      const snoozedTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
      
      const updated = alarms.map(a => 
        a.id === activeAlarm.id 
          ? { ...a, time: snoozedTime, played: false }
          : a
      );
      
      setAlarms(updated);
      setActiveAlarm(null);
      localStorage.setItem('sound-scheduler-alarms', JSON.stringify(updated));
    }
  };

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTone = (ctx: AudioContext, frequency: number, startTime: number, duration: number, volume: number = 0.5) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    oscillatorsRef.current.push(oscillator);
  };

  const playSoundPattern = (soundType: string, loop: boolean = false, customUrl?: string, volumeLevel: number = 0.5) => {
    if (soundType === "custom" && customUrl) {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      currentAudioRef.current = new Audio(customUrl);
      currentAudioRef.current.volume = volumeLevel;
      
      currentAudioRef.current.play().catch(err => {
        console.error("Error playing custom sound:", err);
        alert("Unable to play custom sound. Please check the URL or file.");
      });
      
      currentAudioRef.current.loop = loop;
      
      currentAudioRef.current.onended = () => {
        if (!loop) {
          setPlayingSoundId(null);
          setActiveAlarm(null);
          currentAudioRef.current = null;
        }
      };
      
      if (!loop) {
        setTimeout(() => setPlayingSoundId(null), 3000);
      }
      return;
    }
    
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    if (!loop) {
      oscillatorsRef.current = [];
    }
    
    switch (soundType) {
      case 'chime':
        playTone(ctx, 523.25, now, 0.3, 0.3, volumeLevel);
        playTone(ctx, 659.25, now + 0.1, 0.3, 0.3, volumeLevel);
        playTone(ctx, 783.99, now + 0.2, 0.4, 0.3, volumeLevel);
        if (loop) {
          alarmLoopTimeoutRef.current = setTimeout(() => playSoundPattern(soundType, true, undefined, volumeLevel), 1500);
        } else {
          setTimeout(() => {
            setPlayingSoundId(null);
            setActiveAlarm(null);
          }, 1500);
        }
        break;
        
      case 'gentle':
        playTone(ctx, 440.00, now, 0.5, 0.2, volumeLevel);
        playTone(ctx, 554.37, now + 0.3, 0.5, 0.2, volumeLevel);
        playTone(ctx, 659.25, now + 0.6, 0.6, 0.2, volumeLevel);
        if (loop) {
          alarmLoopTimeoutRef.current = setTimeout(() => playSoundPattern(soundType, true, undefined, volumeLevel), 2000);
        } else {
          setTimeout(() => {
            setPlayingSoundId(null);
            setActiveAlarm(null);
          }, 2000);
        }
        break;
        
      case 'bell':
        playTone(ctx, 523.25, now, 1.0, 0.4, volumeLevel);
        playTone(ctx, 523.25, now + 0.1, 1.0, 0.3, volumeLevel);
        if (loop) {
          alarmLoopTimeoutRef.current = setTimeout(() => playSoundPattern(soundType, true, undefined, volumeLevel), 2000);
        } else {
          setTimeout(() => {
            setPlayingSoundId(null);
            setActiveAlarm(null);
          }, 2000);
        }
        break;
        
      case 'beep':
        playTone(ctx, 880.00, now, 0.1, 0.3, volumeLevel);
        playTone(ctx, 880.00, now + 0.15, 0.1, 0.3, volumeLevel);
        playTone(ctx, 880.00, now + 0.3, 0.1, 0.3, volumeLevel);
        if (loop) {
          alarmLoopTimeoutRef.current = setTimeout(() => playSoundPattern(soundType, true, undefined, volumeLevel), 1000);
        } else {
          setTimeout(() => {
            setPlayingSoundId(null);
            setActiveAlarm(null);
          }, 1000);
        }
        break;
        
      case 'soft':
        playTone(ctx, 659.25, now, 0.4, 0.25, volumeLevel);
        playTone(ctx, 587.33, now + 0.2, 0.4, 0.25, volumeLevel);
        playTone(ctx, 523.25, now + 0.4, 0.5, 0.25, volumeLevel);
        if (loop) {
          alarmLoopTimeoutRef.current = setTimeout(() => playSoundPattern(soundType, true, undefined, volumeLevel), 1800);
        } else {
          setTimeout(() => {
            setPlayingSoundId(null);
            setActiveAlarm(null);
          }, 1800);
        }
        break;
        
      case 'birds':
        playTone(ctx, 2000, now, 0.1, 0.15, volumeLevel);
        playTone(ctx, 2500, now + 0.15, 0.08, 0.1, volumeLevel);
        playTone(ctx, 1800, now + 0.3, 0.12, 0.15, volumeLevel);
        playTone(ctx, 2200, now + 0.5, 0.1, 0.1, volumeLevel);
        playTone(ctx, 2000, now + 0.7, 0.1, 0.15, volumeLevel);
        if (loop) {
          alarmLoopTimeoutRef.current = setTimeout(() => playSoundPattern(soundType, true, undefined, volumeLevel), 2000);
        } else {
          setTimeout(() => {
            setPlayingSoundId(null);
            setActiveAlarm(null);
          }, 2000);
        }
        break;
        
      default:
        playTone(ctx, 440, now, 0.3, 0.3, volumeLevel);
        setTimeout(() => {
          setPlayingSoundId(null);
          setActiveAlarm(null);
        }, 1000);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('sound-scheduler-alarms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAlarms(parsed);
        } else {
          setAlarms([]);
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
        setAlarms(DUMMY_DATA);
      }
    } else {
      setAlarms(DUMMY_DATA);
    }
  }, []);

  useEffect(() => {
    if (alarms.length >= 0) {
      localStorage.setItem('sound-scheduler-alarms', JSON.stringify(alarms));
    }
  }, [alarms]);

  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
      if (alarmLoopTimeoutRef.current) {
        clearTimeout(alarmLoopTimeoutRef.current);
      }
      stopAllSounds();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const parseTime12Hour = (time12: string) => {
    if (!time12) return { hour: "07", minute: "00", isPM: false };
    const [time, ampm] = time12.split(" ");
    const [hour, minute] = time.split(":");
    return { hour, minute, isPM: ampm === "PM" };
  };

  const formatTime12Hour = (hour: string, minute: string, isPM: boolean) => {
    return `${hour}:${minute} ${isPM ? "PM" : "AM"}`;
  };

  const getSoundById = (id: string) => {
    return SOUND_OPTIONS.find(s => s.id === id) || SOUND_OPTIONS[0];
  };

  const isTimeInFuture = (time12: string) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [time, ampm] = time12.split(" ");
    const [hours, minutes] = time.split(":");
    let h = parseInt(hours);
    const m = parseInt(minutes);
    
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    
    const alarmMinutes = h * 60 + m;
    const currentMinutesTotal = currentHours * 60 + currentMinutes;
    
    return alarmMinutes > currentMinutesTotal;
  };

  const timeToMinutes = (time12: string) => {
    if (!time12) return 0;
    const [time, ampm] = time12.split(" ");
    if (!time || !ampm) return 0;
    const [hours, minutes] = time.split(":");
    if (!hours || !minutes) return 0;
    let h = parseInt(hours);
    const m = parseInt(minutes);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomSoundUrl(base64);
        setCustomFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenNewAlarm = () => {
    setEditingAlarm(null);
    setSelectedHour("07");
    setSelectedMinute("00");
    setIsPM(false);
    setSelectedSoundId("morning-chime");
    setNewAlarmSound("Morning Chime");
    setCustomSoundUrl("");
    setCustomFileName("");
    setSelectedDays(["MON", "TUE", "WED", "THU", "FRI"]);
    setInterruptPrevious(false);
    setVolume(5);
    setTimeConflict(null);
    setIsModalOpen(true);
  };

  const handleOpenEditAlarm = (alarm: typeof alarms[0]) => {
    const { hour, minute, isPM } = parseTime12Hour(alarm.time);
    setEditingAlarm({ 
      id: alarm.id, 
      time: alarm.time, 
      sound: alarm.sound, 
      soundId: alarm.soundId,
      customUrl: alarm.customUrl,
      customFile: alarm.customFile,
      days: alarm.days,
      interruptPrevious: alarm.interruptPrevious,
      enabled: alarm.enabled,
      volume: alarm.volume
    });
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsPM(isPM);
    setSelectedSoundId(alarm.soundId);
    setNewAlarmSound(alarm.sound);
    setCustomSoundUrl(alarm.customUrl || alarm.customFile || "");
    setCustomFileName("");
    setSelectedDays(alarm.days);
    setInterruptPrevious(alarm.interruptPrevious);
    setVolume(alarm.volume);
    setTimeConflict(null);
    setIsModalOpen(true);
  };

  const handleDeleteAlarm = (id: number) => {
    const updated = alarms.filter(alarm => alarm.id !== id);
    setAlarms(updated);
    localStorage.setItem('sound-scheduler-alarms', JSON.stringify(updated));
  };

  const handleResetToDemo = () => {
    if (confirm("Reset to demo alarms? This will delete all current alarms.")) {
      setAlarms(DUMMY_DATA);
      setAllAlarmsEnabled(true);
      localStorage.setItem('sound-scheduler-alarms', JSON.stringify(DUMMY_DATA));
    }
  };

  const handleToggleAllAlarms = () => {
    const newState = !allAlarmsEnabled;
    setAllAlarmsEnabled(newState);
    localStorage.setItem('sound-scheduler-all-enabled', JSON.stringify(newState));
  };

  const handleToggleAlarmEnabled = (id: number) => {
    const updated = alarms.map(alarm => 
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    );
    setAlarms(updated);
    localStorage.setItem('sound-scheduler-alarms', JSON.stringify(updated));
  };

  const handleTestSound = (soundId: string, customUrl?: string, volumeLevel: number = 0.5) => {
    stopAllSounds();
    
    if (soundId === "custom" && customUrl) {
      setPlayingSoundId(soundId);
      playSoundPattern("custom", false, customUrl, volumeLevel);
    } else {
      const sound = getSoundById(soundId);
      setPlayingSoundId(soundId);
      playSoundPattern(sound.type, false, undefined, volumeLevel);
    }
  };

  const handlePreviewSound = () => {
    stopAllSounds();
    const volumeLevel = volume / 10;
    
    if (selectedSoundId === "custom" && customSoundUrl) {
      setPlayingSoundId(selectedSoundId);
      playSoundPattern("custom", false, customSoundUrl, volumeLevel);
    } else {
      setPlayingSoundId(selectedSoundId);
      playSoundPattern(getSoundById(selectedSoundId).type, false, undefined, volumeLevel);
    }
  };

const handleSaveAlarm = () => {
  if (!newAlarmSound) {
    alert("Please enter a sound name!");
    return;
  }

  const formattedTime = formatTime12Hour(selectedHour, selectedMinute, isPM);
  
  if (selectedSoundId === "custom") {
    if (!customSoundUrl) {
      alert("Please provide a sound URL or upload a file!");
      return;
    }
  }

  // Check if alarm should be marked as played
  const shouldMarkAsPlayed = () => {
    if (selectedDays.length === 0) return false; // Inactive alarms
    
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = SUN, 1 = MON, etc.
    const dayMap = [0, 1, 2, 3, 4, 5, 6]; // SUN, MON, TUE, WED, THU, FRI, SAT
    const currentDayName = DAYS[currentDayIndex === 0 ? 6 : currentDayIndex - 1]; // Convert to MON-SUN format
    
    // Check if any selected day is in the future this week
    const currentDayOrder = dayMap[currentDayIndex];
    
    for (const day of selectedDays) {
      const dayIndex = DAYS.indexOf(day);
      const dayOrder = dayMap[dayIndex === 6 ? 0 : dayIndex + 1]; // Convert back to SUN-SAT
      
      if (dayOrder > currentDayOrder) {
        // This day is in the future this week
        return false;
      } else if (dayOrder === currentDayOrder) {
        // This is today - check if time is in the future
        if (isTimeInFuture(formattedTime)) {
          return false;
        }
      }
    }
    
    // All selected days have passed this week
    return true;
  };

  if (editingAlarm) {
    const played = shouldMarkAsPlayed();
    
    const updated = alarms.map(alarm => 
      alarm.id === editingAlarm.id 
        ? { 
            ...alarm, 
            time: formattedTime, 
            sound: newAlarmSound, 
            soundId: selectedSoundId,
            played: played,
            days: selectedDays,
            interruptPrevious: interruptPrevious,
            enabled: editingAlarm.enabled,
            volume: volume,
            customUrl: selectedSoundId === "custom" && customSoundType === "url" ? customSoundUrl : undefined,
            customFile: selectedSoundId === "custom" && customSoundType === "file" ? customSoundUrl : undefined,
          }
        : alarm
    );
    setAlarms([...updated]);
  } else {
    const newAlarm = {
      id: Date.now(),
      time: formattedTime,
      sound: newAlarmSound,
      soundId: selectedSoundId,
      played: false,
      days: selectedDays,
      interruptPrevious: interruptPrevious,
      enabled: true,
      volume: volume,
      customUrl: selectedSoundId === "custom" && customSoundType === "url" ? customSoundUrl : undefined,
      customFile: selectedSoundId === "custom" && customSoundType === "file" ? customSoundUrl : undefined,
    };
    const updated = [...alarms, newAlarm];
    setAlarms(updated);
  }

  setNewAlarmSound("");
  setCustomSoundUrl("");
  setCustomFileName("");
  setSelectedDays([]);
  setInterruptPrevious(false);
  setVolume(5);
  setTimeConflict(null);
  setEditingAlarm(null);
  setIsModalOpen(false);
};
  const handlePlayPendingAlarm = (alarm: typeof alarms[0]) => {
    stopAllSounds();
    setPendingAlarms(prev => prev.filter(a => a.id !== alarm.id));
    triggerAlarm(alarm, true);
  };

  const sortedAlarms = useMemo(() => {
    return [...alarms].sort((a, b) => {
      const timeA = timeToMinutes(a.time);
      const timeB = timeToMinutes(b.time);
      return timeA - timeB;
    });
  }, [alarms]);

  const formatDays = (days: string[]) => {
    if (days.length === 0) return "Inactive";
    if (days.length === 7) return "Every day";
    return days.join(", ");
  };

  // --- UI RENDER ---
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? "bg-slate-900 text-white" : "bg-gray-100 text-slate-900"
    }`}>
      
      {/* Header with Hamburger Menu */}
      <header className={`p-6 border-b flex justify-between items-center ${
        isDarkMode ? "border-slate-700" : "border-gray-300"
      }`}>
        <h1 className="text-2xl font-bold">🔔 Sound Scheduler</h1>
        
        {/* Hamburger Menu Button */}
        <button
          id="menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-200"
          }`}
          title="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div 
          id="main-menu"
          className={`absolute right-4 top-20 z-50 w-72 rounded-xl shadow-2xl border overflow-hidden ${
            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-300"
          }`}
        >
          {/* Dark Mode Toggle */}
          <div className={`p-4 border-b ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
            <label className="flex items-center justify-between cursor-pointer">
              <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isDarkMode}
                  onChange={() => setIsDarkMode(!isDarkMode)}
                />
                <div className={`block w-12 h-7 rounded-full transition-colors ${
                  isDarkMode ? "bg-cyan-600" : "bg-gray-400"
                }`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                  isDarkMode ? "transform translate-x-5" : "transform translate-x-0"
                }`}></div>
              </div>
            </label>
          </div>

          {/* All Enabled/Disabled */}
          <div className={`p-4 border-b ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
            <button
              onClick={() => {
                handleToggleAllAlarms();
                setIsMenuOpen(false);
              }}
              className={`w-full px-4 py-2 rounded-lg font-bold transition-all ${
                allAlarmsEnabled
                  ? `${theme.buttonBg} ${theme.buttonText}`
                  : isDarkMode
                    ? "bg-red-500/20 text-red-400 border border-red-600"
                    : "bg-red-100 text-red-600 border border-red-300"
              }`}
            >
              {allAlarmsEnabled ? "All Enabled" : "All Disabled"}
            </button>
          </div>

          {/* Color Theme Picker */}
          <div className={`p-4 border-b ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              🎨 Color Theme
            </label>
            <select
              value={colorScheme}
              onChange={(e) => {
                setColorScheme(e.target.value as ColorScheme);
                setIsMenuOpen(false);
              }}
              className={`w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-cyan-500 ${
                isDarkMode 
                  ? "bg-slate-700 text-white border-slate-600" 
                  : "bg-white text-slate-900 border-gray-300"
              }`}
            >
              <option value="ocean">🌊 Ocean</option>
              <option value="forest">🌲 Forest</option>
              <option value="violet">💜 Violet</option>
              <option value="sunset">🌅 Sunset</option>
              <option value="slate">🪨 Slate</option>
            </select>
          </div>

          {/* Reset Submenu */}
          <div className={`p-4 ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              ⚙️ Reset Options
            </label>
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleResetToDemo();
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isDarkMode 
                    ? "bg-slate-700 hover:bg-slate-600 text-white" 
                    : "bg-gray-100 hover:bg-gray-200 text-slate-900"
                }`}
              >
                🔄 Reset to Demo
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isDarkMode 
                    ? "bg-slate-700 hover:bg-slate-600 text-white" 
                    : "bg-gray-100 hover:bg-gray-200 text-slate-900"
                }`}
              >
                🔃 Refresh Page
              </button>
              <button
                onClick={() => {
                  if (confirm("🔃Restart app? This will clear all data and reload.")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isDarkMode 
                    ? "bg-orange-600/20 hover:bg-orange-600/30 text-orange-400" 
                    : "bg-orange-100 hover:bg-orange-200 text-orange-600"
                }`}
              >
                🔄 Restart App
              </button>
              <button
  onClick={() => {
    setTimeout(() => {
      if (confirm("⚠️ DELETE ALL alarms? This cannot be undone!")) {
        setAlarms([]);
        localStorage.setItem('sound-scheduler-alarms', JSON.stringify([]));
      }
      setIsMenuOpen(false);
    }, 100);
  }}
  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
    isDarkMode 
      ? "bg-red-600/20 hover:bg-red-600/30 text-red-400" 
      : "bg-red-100 hover:bg-red-200 text-red-600"
  }`}
>
  🗑️ Delete All Alarms
</button>
            </div>
          </div>

          {/* Notification Status */}
          <div className={`p-4 border-t ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
            <div className={`text-xs px-3 py-2 rounded-lg text-center ${
              notificationPermission === "granted" 
                ? "bg-green-500/20 text-green-400" 
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {notificationPermission === "granted" ? "🔔 Notifications On" : "🔕 Notifications Off"}
            </div>
          </div>
        </div>
      )}

      {/* Alarm List */}
      <main className="p-6 pb-24">
        <h2 className={`text-lg mb-4 ${
          isDarkMode ? "text-slate-400" : "text-gray-500"
        }`}>Your Alarms</h2>
        
        {sortedAlarms.length === 0 ? (
          <div className={`text-center py-12 ${
            isDarkMode ? "text-slate-500" : "text-gray-400"
          }`}>
            <p className="mb-4">No alarms set yet</p>
            <button
              onClick={handleResetToDemo}
              className={`px-4 py-2 ${theme.buttonBg} ${theme.buttonText} hover:opacity-90 rounded-lg font-medium`}
            >
              Load Demo Alarms
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlarms.map((alarm) => {
              const isPlayed = alarm.played;
              const isPlaying = playingSoundId === alarm.soundId;
              const customUrl = alarm.customUrl || alarm.customFile;
              const isInactive = alarm.days.length === 0;
              const isPending = pendingAlarms.find(p => p.id === alarm.id);
              const isMuted = alarm.volume === 0;
              const isAlarmEnabled = alarm.enabled && allAlarmsEnabled;
              const hasValidSound = alarm.soundId !== "custom" || alarm.customUrl || alarm.customFile;
              
              const canTrigger = !isInactive && isAlarmEnabled && !isMuted && hasValidSound;
              
              return (
                <div
                  key={alarm.id}
                  className={`rounded-lg p-4 flex justify-between items-center border transition-all duration-300 ${
                    !canTrigger
                      ? isDarkMode 
                        ? "bg-slate-800/30 border-slate-700 opacity-30" 
                        : "bg-gray-100 border-gray-200 opacity-30"
                      : isPending
                        ? isDarkMode
                          ? "bg-yellow-900/20 border-yellow-600"
                          : "bg-yellow-50 border-yellow-300"
                        : isDarkMode 
                          ? (isPlayed ? "bg-slate-900 border-slate-800 opacity-50" : "bg-slate-800 border-slate-700") 
                          : (isPlayed ? "bg-gray-200 border-gray-300 opacity-50" : "bg-white border-gray-200 shadow-sm")
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className={`text-xl font-bold ${
                        !canTrigger
                          ? isDarkMode ? "text-slate-600" : "text-gray-400"
                          : isPending
                            ? isDarkMode ? "text-yellow-400" : "text-yellow-600"
                            : isDarkMode ? theme.primaryDark : theme.primary
                      }`}>
                        {alarm.time || "--:--"}
                      </p>
                      {alarm.interruptPrevious && canTrigger && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
                        }`} title="Will stop any currently playing audio">
                          ⚡
                        </span>
                      )}
                      {isPending && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isDarkMode ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-200 text-yellow-700"
                        }`}>
                          ⏳ Waiting
                        </span>
                      )}
                      {!canTrigger && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isMuted
                            ? isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
                            : isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
                        }`}>
                          {isMuted ? "🔇 Muted" : "❌ Disabled"}
                        </span>
                      )}
                      {canTrigger && (
                        <span className={`text-xs ${theme.volumeText}`} title={`Volume: ${alarm.volume}/10 (${getVolumeLabel(alarm.volume)})`}>
                          {getVolumeIcon(alarm.volume)} {alarm.volume}/10
                        </span>
                      )}
                    </div>
                    <p className={`text-sm flex items-center ${
                      !canTrigger
                        ? isDarkMode ? "text-slate-600" : "text-gray-400"
                        : isDarkMode ? "text-slate-400" : "text-gray-500"
                    }`}>
                      {alarm.sound || "Unnamed"}
                      {!canTrigger ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : isPlayed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </p>
                    <p className={`text-xs mt-1 ${
                      !canTrigger
                        ? isDarkMode ? "text-red-400" : "text-red-500"
                        : isDarkMode ? "text-slate-500" : "text-gray-400"
                    }`}>
                      {formatDays(alarm.days)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={() => handleToggleAlarmEnabled(alarm.id)}
                      disabled={isInactive || isMuted}
                      className={`p-2 rounded-full transition-colors ${
                        isInactive || isMuted
                          ? isDarkMode 
                            ? "text-slate-600 cursor-not-allowed" 
                            : "text-gray-300 cursor-not-allowed"
                          : alarm.enabled && allAlarmsEnabled
                            ? "text-green-400 hover:bg-slate-700"
                            : "text-red-400 hover:bg-slate-700"
                      }`}
                      title={isInactive ? "Select days first" : isMuted ? "Unmute to enable/disable" : alarm.enabled ? "Disable this alarm" : "Enable this alarm"}
                    >
                      {isInactive || isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/>
                        </svg>
                      ) : alarm.enabled && allAlarmsEnabled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleTestSound(alarm.soundId, customUrl, alarm.volume / 10)}
                      disabled={!canTrigger || isPlaying || activeAlarm !== null}
                      className={`p-2 rounded-full transition-colors ${
                        isPlaying
                          ? "bg-green-500 text-white animate-pulse"
                          : !canTrigger
                            ? isDarkMode 
                              ? "text-slate-600 cursor-not-allowed" 
                              : "text-gray-300 cursor-not-allowed"
                            : isDarkMode 
                              ? "text-green-400 hover:bg-slate-700" 
                              : "text-green-600 hover:bg-gray-100"
                      }`}
                      title={!canTrigger ? (isMuted ? "Muted (volume = 0)" : "Disabled alarm") : isPlaying ? "Playing..." : "Test sound"}
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16"/>
                          <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                    
                    {isPending && (
                      <button 
                        onClick={() => handlePlayPendingAlarm(alarm)}
                        className={`p-2 rounded-full transition-colors ${
                          isDarkMode 
                            ? "bg-yellow-500 hover:bg-yellow-400 text-white" 
                            : "bg-yellow-400 hover:bg-yellow-300 text-yellow-900"
                        }`}
                        title="Play now"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleOpenEditAlarm(alarm)}
                      className={`p-2 hover:opacity-70 ${
                        isDarkMode ? "text-cyan-400" : theme.iconColor
                      }`}
                      title="Edit alarm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteAlarm(alarm.id)}
                      className={`p-2 hover:opacity-70 ${
                        isDarkMode ? "text-slate-500" : "text-gray-400"
                      }`}
                      title="Delete alarm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <button 
        onClick={handleOpenNewAlarm}
        disabled={activeAlarm !== null}
        className={`fixed bottom-6 right-6 rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all ${
          activeAlarm !== null
            ? "bg-gray-500 cursor-not-allowed"
            : isDarkMode 
              ? "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/50 text-white" 
              : `${theme.buttonBg} ${theme.buttonText} hover:opacity-90 shadow-lg`
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {activeAlarm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-8 shadow-2xl text-center ${
            isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
          }`}>
            <div className="text-6xl mb-4">🔊</div>
            <h2 className="text-3xl font-bold mb-2">Now Playing</h2>
            <p className="text-xl mb-1">{activeAlarm.time}</p>
            <p className="text-lg mb-2 opacity-70">{activeAlarm.sound}</p>
            <p className={`text-sm mb-4 ${theme.volumeText}`}>
              {getVolumeIcon(activeAlarm.volume)} Volume: {activeAlarm.volume}/10 ({getVolumeLabel(activeAlarm.volume)})
            </p>
            {activeAlarm.interruptPrevious && (
              <p className="text-xs mb-4 text-red-400">⚡ Interrupted previous audio</p>
            )}
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleDismissAlarm}
                className={`px-6 py-3 rounded-lg font-medium ${theme.buttonBg} ${theme.buttonText} hover:opacity-90`}
              >
                ⏹ Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className={`w-full max-w-md rounded-xl p-6 shadow-2xl transition-colors ${
              isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingAlarm ? "Edit Alarm" : "Add New Alarm"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <div className="flex gap-2">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className={`flex-1 p-3 rounded-lg border outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className={`flex-1 p-3 rounded-lg border outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => setIsPM(!isPM)}
                    className={`flex-1 p-3 rounded-lg font-bold transition-all ${
                      isPM 
                        ? `${theme.buttonBg} ${theme.buttonText} shadow-lg`
                        : isDarkMode 
                          ? "bg-slate-700 text-slate-300 border border-slate-600" 
                          : "bg-gray-100 text-gray-600 border border-gray-300"
                    }`}
                  >
                    {isPM ? "PM" : "AM"}
                  </button>
                </div>
              </div>
              
              {timeConflict && (
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? "bg-yellow-900/30 border-yellow-600 text-yellow-400" : "bg-yellow-50 border-yellow-400 text-yellow-700"
                }`}>
                  <p className="text-sm font-medium">⚠️ {timeConflict}</p>
                  <p className="text-xs mt-1 opacity-70">This alarm will be added to the pending queue if both are active</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Days</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? `${theme.buttonBg} ${theme.buttonText} shadow-lg`
                            : isDarkMode
                              ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className={`text-xs mt-1 italic ${
                  isDarkMode ? "text-slate-500" : "text-gray-400"
                }`}>
                  Leave unselected to disable alarm
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${
                interruptPrevious
                  ? isDarkMode ? "bg-red-900/20 border-red-600" : "bg-red-50 border-red-400"
                  : isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-gray-50 border-gray-300"
              }`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${
                    interruptPrevious ? "bg-red-500" : "bg-slate-500"
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      interruptPrevious ? "left-7" : "left-1"
                    }`}></div>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={interruptPrevious}
                    onChange={(e) => setInterruptPrevious(e.target.checked)}
                  />
                  <div>
                    <p className="font-medium">Interrupt Previous Audio ⚡</p>
                    <p className={`text-xs ${
                      isDarkMode ? "text-slate-400" : "text-gray-500"
                    }`}>
                      {interruptPrevious 
                        ? "Stop any playing audio and start this" 
                        : "Wait for current audio to finish (or play first if nothing is playing)"}
                    </p>
                  </div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Volume: {volume}/10 ({getVolumeLabel(volume)}) {getVolumeIcon(volume)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    isDarkMode ? "bg-slate-700" : "bg-gray-300"
                  }`}
                  style={{
                    background: `linear-gradient(to right, ${
                      volume === 0 ? '#ef4444' :
                      volume <= 3 ? '#eab308' :
                      volume <= 6 ? '#06b6d4' : '#22c55e'
                    } 0%, ${
                      volume === 0 ? '#ef4444' :
                      volume <= 3 ? '#eab308' :
                      volume <= 6 ? '#06b6d4' : '#22c55e'
                    } ${(volume / 10) * 100}%, ${
                      isDarkMode ? '#334155' : '#d1d5db'
                    } ${(volume / 10) * 100}%, ${
                      isDarkMode ? '#334155' : '#d1d5db'
                    } 100%)`
                  }}
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-red-500">0 (Muted)</span>
                  <span className="text-yellow-500">3 (Low)</span>
                  <span className="text-cyan-500">5 (Medium)</span>
                  <span className="text-green-500">10 (Max)</span>
                </div>
                {volume === 0 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Volume 0 will mute this alarm (it won't play)</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sound</label>
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedSoundId}
                    onChange={(e) => {
                      const sound = getSoundById(e.target.value);
                      setSelectedSoundId(e.target.value);
                      setNewAlarmSound(sound.name);
                    }}
                    className={`flex-1 p-3 rounded-lg border outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    {SOUND_OPTIONS.map((sound) => (
                      <option key={sound.id} value={sound.id}>{sound.name}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={handlePreviewSound}
                    disabled={playingSoundId === selectedSoundId || (selectedSoundId === "custom" && !customSoundUrl)}
                    className={`p-3 rounded-lg transition-colors ${
                      playingSoundId === selectedSoundId
                        ? "bg-green-500 text-white"
                        : isDarkMode
                          ? "bg-slate-700 hover:bg-slate-600 text-green-400"
                          : "bg-gray-200 hover:bg-gray-300 text-green-600"
                    }`}
                    title="Preview sound"
                  >
                    {playingSoundId === selectedSoundId ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {selectedSoundId === "custom" && (
                  <div className={`p-4 rounded-lg border-2 mt-2 ${
                    isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-gray-50 border-gray-300"
                  }`}>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setCustomSoundType("url")}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                          customSoundType === "url"
                            ? `${theme.buttonBg} ${theme.buttonText}`
                            : isDarkMode
                              ? "bg-slate-600 text-slate-300"
                              : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        🔗 URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomSoundType("file")}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                          customSoundType === "file"
                            ? `${theme.buttonBg} ${theme.buttonText}`
                            : isDarkMode
                              ? "bg-slate-600 text-slate-300"
                              : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        📁 Upload File
                      </button>
                    </div>
                    
                    {customSoundType === "url" && (
                      <div>
                        <label className="block text-xs mb-1 opacity-70">Sound URL (MP3/WAV)</label>
                        <input
                          type="url"
                          value={customSoundUrl}
                          onChange={(e) => setCustomSoundUrl(e.target.value)}
                          placeholder="https://example.com/sound.mp3"
                          className={`w-full p-2 rounded border outline-none focus:ring-2 focus:ring-cyan-500 ${
                            isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white border-gray-300"
                          }`}
                        />
                      </div>
                    )}
                    
                    {customSoundType === "file" && (
                      <div>
                        <label className="block text-xs mb-1 opacity-70">Upload Audio File</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full p-2 rounded border-2 border-dashed transition-colors ${
                            isDarkMode 
                              ? "border-slate-600 hover:border-slate-500 text-slate-300" 
                              : "border-gray-300 hover:border-gray-400 text-gray-700"
                          }`}
                        >
                          {customFileName || "Click to select MP3/WAV file"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAlarm}
                className={`px-4 py-2 rounded-lg font-medium ${theme.buttonBg} ${theme.buttonText} hover:opacity-90`}
              >
                {editingAlarm ? "Update Alarm" : "Save Alarm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}