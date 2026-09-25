import { useState, useEffect } from "react";
import { soundFx } from "../utils/soundEffects";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(soundFx.enabled);
  }, []);

  const handleToggle = () => {
    const next = soundFx.toggle();
    setEnabled(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? "Gaming Audio Effects: Enabled (Click to Mute)" : "Gaming Audio Effects: Muted (Click to Enable)"}
      className={`group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        enabled
          ? "border-brand-500/50 bg-brand-500/15 text-brand-100 shadow-glow-brand"
          : "border-white/10 bg-bg-surface text-text-muted hover:border-white/25 hover:text-white"
      }`}
      aria-label="Toggle Gaming Sound Effects"
    >
      {/* Equalizer Bars */}
      <div className="flex items-end gap-[2px] h-3.5 w-3.5">
        <span
          className={`w-[2.5px] rounded-full transition-all ${
            enabled
              ? "bg-brand-400 h-full animate-[pulse_0.6s_ease-in-out_infinite]"
              : "bg-text-muted/40 h-1.5"
          }`}
        />
        <span
          className={`w-[2.5px] rounded-full transition-all ${
            enabled
              ? "bg-brand-400 h-2/3 animate-[pulse_0.8s_ease-in-out_infinite]"
              : "bg-text-muted/40 h-2.5"
          }`}
        />
        <span
          className={`w-[2.5px] rounded-full transition-all ${
            enabled
              ? "bg-brand-400 h-3/4 animate-[pulse_0.5s_ease-in-out_infinite]"
              : "bg-text-muted/40 h-1"
          }`}
        />
      </div>

      <span className="hidden sm:inline text-[11px] font-bold tracking-wider uppercase">
        {enabled ? "SFX On" : "SFX"}
      </span>
    </button>
  );
}
