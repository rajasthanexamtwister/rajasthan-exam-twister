"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface AudioSummaryPlayerProps {
  textToRead: string;
  title?: string;
}

export function AudioSummaryPlayer({ textToRead, title = "हिंदी ऑडियो समरी (Audio Summary)" }: AudioSummaryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
  }, []);

  const cleanText = textToRead
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const handlePlayPause = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = playbackRate;

    // Try finding Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.includes("hi"));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlaying) {
      handlePlayPause(); // Restart with new rate
    }
  };

  if (!isSupported || !cleanText) return null;

  return (
    <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-100/60 to-amber-500/10 border border-amber-300/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#0B132B] font-bold flex items-center justify-center shrink-0 shadow-xs">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>AI Voice Assistant</span>
          </div>
          <h3 className="font-extrabold text-sm text-[#0B132B]">{title}</h3>
          <p className="text-xs text-slate-600">चलते-फिरते नोट्स को हिंदी ऑडियो में सुनें</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center bg-white/80 border border-amber-200 rounded-xl p-1 text-[11px] font-bold text-slate-700">
          {[1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                playbackRate === rate
                  ? "bg-amber-500 text-[#0B132B] shadow-xs"
                  : "hover:bg-amber-100 text-slate-600"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="px-4 py-2 text-xs font-bold text-[#0B132B] bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Audio</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Listen Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
