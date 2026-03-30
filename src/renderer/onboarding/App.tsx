import React, { useState, useEffect } from 'react';

type Step = 'welcome' | 'microphone' | 'apikeys' | 'methodology' | 'done';

const STEPS: Step[] = ['welcome', 'microphone', 'apikeys', 'methodology', 'done'];

declare global {
  interface Window {
    callCoach: {
      getSettings: (key: string) => Promise<unknown>;
      setSettings: (key: string, value: unknown) => Promise<boolean>;
      finishOnboarding: () => void;
    };
  }
}

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const idx = STEPS.indexOf(step);

  function next() {
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function back() {
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Progress */}
      <div className="flex gap-1 px-8 pt-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              i <= idx ? 'bg-blue-500' : 'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6">
        {step === 'welcome' && <WelcomeStep />}
        {step === 'microphone' && <MicrophoneStep />}
        {step === 'apikeys' && <ApiKeysStep />}
        {step === 'methodology' && <MethodologyStep />}
        {step === 'done' && <DoneStep />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between px-8 pb-6">
        <button
          onClick={back}
          className={`rounded-md px-4 py-2 text-sm ${
            idx === 0 ? 'invisible' : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          Back
        </button>
        {step === 'done' ? (
          <button
            onClick={() => window.callCoach.finishOnboarding()}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Start Coaching
          </button>
        ) : (
          <button
            onClick={next}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium hover:bg-blue-500"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 text-5xl">🎯</div>
      <h1 className="mb-3 text-2xl font-bold">Welcome to Call Coach</h1>
      <p className="max-w-md text-gray-400">
        Real-time AI coaching for your calls. Get live suggestions during
        conversations based on proven sales methodologies.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
        <div>
          <div className="mb-1 text-lg">🎤</div>
          Captures your voice
        </div>
        <div>
          <div className="mb-1 text-lg">🔊</div>
          Hears the other side
        </div>
        <div>
          <div className="mb-1 text-lg">💡</div>
          Coaches in real-time
        </div>
      </div>
    </div>
  );
}

function MicrophoneStep() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    requestMicPermission();
  }, []);

  async function requestMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionGranted(true);
      const all = await navigator.mediaDevices.enumerateDevices();
      const mics = all.filter((d) => d.kind === 'audioinput');
      setDevices(mics);
      if (mics.length > 0) {
        setSelected(mics[0].deviceId);
        window.callCoach.setSettings('audio.micDeviceId', mics[0].deviceId);
      }
    } catch {
      setPermissionGranted(false);
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Select Your Microphone</h2>
      <p className="mb-6 text-sm text-gray-400">
        Choose the microphone you use for calls.
      </p>

      {!permissionGranted ? (
        <div className="rounded-lg border border-yellow-600/30 bg-yellow-600/10 p-4 text-sm text-yellow-300">
          Microphone permission is required. Please allow access when prompted.
          <button
            onClick={requestMicPermission}
            className="mt-2 block rounded bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-500"
          >
            Retry Permission
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => (
            <label
              key={d.deviceId}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                selected === d.deviceId
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="mic"
                checked={selected === d.deviceId}
                onChange={() => {
                  setSelected(d.deviceId);
                  window.callCoach.setSettings('audio.micDeviceId', d.deviceId);
                }}
                className="accent-blue-500"
              />
              <span className="text-sm">{d.label || `Microphone ${d.deviceId.slice(0, 8)}`}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ApiKeysStep() {
  const [deepgramKey, setDeepgramKey] = useState('');
  const [llmKey, setLlmKey] = useState('');
  const [provider, setProvider] = useState('gemini');

  const providers = [
    { id: 'gemini', label: 'Gemini Flash-Lite', keyField: 'apiKeys.gemini', placeholder: 'Gemini API key' },
    { id: 'grok', label: 'Grok Fast', keyField: 'apiKeys.grok', placeholder: 'Grok API key' },
    { id: 'claude', label: 'Claude Haiku', keyField: 'apiKeys.claude', placeholder: 'Claude API key' },
    { id: 'openai', label: 'GPT Mini', keyField: 'apiKeys.openai', placeholder: 'OpenAI API key' },
  ];

  const activeProvider = providers.find((p) => p.id === provider)!;

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Enter API Keys</h2>
      <p className="mb-6 text-sm text-gray-400">
        Call Coach uses your own API keys. You'll need a Deepgram key for
        transcription and an LLM key for coaching.
      </p>

      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Deepgram API Key <span className="text-red-400">*required</span>
          </label>
          <input
            type="password"
            value={deepgramKey}
            onChange={(e) => {
              setDeepgramKey(e.target.value);
              window.callCoach.setSettings('apiKeys.deepgram', e.target.value);
            }}
            placeholder="Enter your Deepgram API key"
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Get $200 free credit at deepgram.com
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            LLM Provider
          </label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProvider(p.id);
                  setLlmKey('');
                  window.callCoach.setSettings('llmProvider', p.id);
                }}
                className={`rounded-md px-3 py-2 text-sm text-left ${
                  provider === p.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="password"
            value={llmKey}
            onChange={(e) => {
              setLlmKey(e.target.value);
              window.callCoach.setSettings(activeProvider.keyField, e.target.value);
            }}
            placeholder={activeProvider.placeholder}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function MethodologyStep() {
  const [selected, setSelected] = useState('meddic');

  const methodologies = [
    { id: 'meddic', name: 'MEDDIC', desc: 'Enterprise sales qualification' },
    { id: 'discovery', name: 'Discovery Call', desc: 'Explore prospect needs and goals' },
    { id: 'qbr', name: 'QBR', desc: 'Quarterly business review structure' },
    { id: 'interview', name: 'Job Interview', desc: 'Behavioral interview coaching' },
    { id: 'difficult-conversation', name: 'Difficult Conversation', desc: 'Navigate tough talks with empathy' },
  ];

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Choose a Methodology</h2>
      <p className="mb-6 text-sm text-gray-400">
        Pick a coaching style. You can switch anytime with Ctrl+Shift+M.
      </p>

      <div className="space-y-2">
        {methodologies.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
              selected === m.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input
              type="radio"
              name="methodology"
              checked={selected === m.id}
              onChange={() => {
                setSelected(m.id);
                window.callCoach.setSettings('methodology', m.id);
              }}
              className="accent-blue-500"
            />
            <div>
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-xs text-gray-400">{m.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 text-5xl">🚀</div>
      <h2 className="mb-3 text-2xl font-bold">You're All Set!</h2>
      <p className="mb-6 max-w-md text-gray-400">
        Start a call, then press <kbd className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-xs">Ctrl+Shift+P</kbd> to
        begin recording. Coaching suggestions will appear in the overlay.
      </p>
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-left text-xs">
        <div className="mb-2 font-medium text-gray-300">Quick Reference</div>
        <div className="space-y-1 text-gray-400">
          <div><kbd className="rounded bg-gray-700 px-1 font-mono">Ctrl+Shift+P</kbd> Start/stop recording</div>
          <div><kbd className="rounded bg-gray-700 px-1 font-mono">Ctrl+Shift+C</kbd> Toggle coaching</div>
          <div><kbd className="rounded bg-gray-700 px-1 font-mono">Ctrl+Shift+M</kbd> Cycle methodology</div>
          <div><kbd className="rounded bg-gray-700 px-1 font-mono">Ctrl+Shift+H</kbd> Hide/show overlay</div>
          <div><kbd className="rounded bg-gray-700 px-1 font-mono">Ctrl+Shift+S</kbd> Open settings</div>
        </div>
      </div>
    </div>
  );
}
