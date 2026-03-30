import React, { useEffect, useState } from 'react';
import { DEFAULT_OVERLAY_SETTINGS } from '../../../shared/constants';

export default function OverlaySettings() {
  const [opacity, setOpacity] = useState(DEFAULT_OVERLAY_SETTINGS.opacity);
  const [maxSuggestions, setMaxSuggestions] = useState(DEFAULT_OVERLAY_SETTINGS.maxSuggestions);
  const [displayDuration, setDisplayDuration] = useState(DEFAULT_OVERLAY_SETTINGS.displayDurationMs / 1000);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const o = (await window.callCoach.getSettings('overlay.opacity')) as number;
    if (o != null) setOpacity(o);
    const m = (await window.callCoach.getSettings('overlay.maxSuggestions')) as number;
    if (m != null) setMaxSuggestions(m);
    const d = (await window.callCoach.getSettings('overlay.displayDurationMs')) as number;
    if (d != null) setDisplayDuration(d / 1000);
  }

  function save(key: string, value: number) {
    window.callCoach.setSettings(key, value);
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Overlay Settings</h2>

      <div className="space-y-6">
        {/* Opacity */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Background Opacity: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setOpacity(v);
              save('overlay.opacity', v);
            }}
            className="w-full accent-blue-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>More transparent</span>
            <span>More opaque</span>
          </div>
        </div>

        {/* Max suggestions */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Max Coaching Suggestions
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setMaxSuggestions(n);
                  save('overlay.maxSuggestions', n);
                }}
                className={`rounded-md px-4 py-2 text-sm ${
                  maxSuggestions === n
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Display duration */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Suggestion Display Duration: {displayDuration}s
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={displayDuration}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setDisplayDuration(v);
              save('overlay.displayDurationMs', v * 1000);
            }}
            className="w-full accent-blue-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>5s</span>
            <span>30s</span>
          </div>
        </div>

        {/* Keyboard shortcuts reference */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-300">Keyboard Shortcuts</h3>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
            <div className="space-y-1.5 text-xs">
              <ShortcutRow keys="Ctrl+Shift+C" action="Toggle coaching on/off" />
              <ShortcutRow keys="Ctrl+Shift+M" action="Cycle methodologies" />
              <ShortcutRow keys="Ctrl+Shift+H" action="Hide/show overlay" />
              <ShortcutRow keys="Ctrl+Shift+P" action="Start/stop recording" />
              <ShortcutRow keys="Ctrl+Shift+S" action="Open settings" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex justify-between">
      <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-gray-300">{keys}</kbd>
      <span className="text-gray-400">{action}</span>
    </div>
  );
}
