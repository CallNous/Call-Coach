import React, { useEffect, useState } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
}

export default function AudioSettings() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);

  useEffect(() => {
    loadDevices();
    // Re-enumerate when devices change (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  async function loadDevices() {
    // Need to request permission first to get device labels
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // Permission denied — will show deviceId only
    }

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const mics = allDevices
      .filter((d) => d.kind === 'audioinput')
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
      }));
    setDevices(mics);

    if (!selectedMic && mics.length > 0) {
      setSelectedMic(mics[0].deviceId);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Audio Settings</h2>

      <div className="space-y-6">
        {/* Microphone selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Microphone
          </label>
          <select
            value={selectedMic}
            onChange={(e) => {
              setSelectedMic(e.target.value);
              window.callCoach.setSettings('audio.micDeviceId', e.target.value);
            }}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          {devices.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              No microphones found. Check your audio devices.
            </p>
          )}
        </div>

        {/* System audio toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              System Audio Capture
            </label>
            <p className="text-xs text-gray-500">
              Capture the other person's audio from your call app
            </p>
          </div>
          <button
            onClick={() => {
              const next = !systemAudioEnabled;
              setSystemAudioEnabled(next);
              window.callCoach.setSettings('audio.systemAudioEnabled', next);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              systemAudioEnabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                systemAudioEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
