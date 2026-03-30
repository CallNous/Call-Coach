import React, { useEffect, useState } from 'react';

interface ApiKeyField {
  key: string;
  label: string;
  placeholder: string;
}

const API_KEYS: ApiKeyField[] = [
  { key: 'apiKeys.deepgram', label: 'Deepgram', placeholder: 'Enter Deepgram API key' },
  { key: 'apiKeys.gemini', label: 'Google Gemini', placeholder: 'Enter Gemini API key' },
  { key: 'apiKeys.grok', label: 'xAI Grok', placeholder: 'Enter Grok API key' },
  { key: 'apiKeys.claude', label: 'Anthropic Claude', placeholder: 'Enter Claude API key' },
  { key: 'apiKeys.openai', label: 'OpenAI', placeholder: 'Enter OpenAI API key' },
];

const LLM_PROVIDERS = [
  { id: 'gemini', label: 'Gemini Flash-Lite' },
  { id: 'grok', label: 'Grok Fast' },
  { id: 'claude', label: 'Claude Haiku' },
  { id: 'openai', label: 'GPT Mini' },
];

export default function GeneralSettings() {
  const [provider, setProvider] = useState('gemini');
  const [keys, setKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const prov = (await window.callCoach.getSettings('llmProvider')) as string;
    if (prov) setProvider(prov);

    const loaded: Record<string, string> = {};
    for (const field of API_KEYS) {
      const val = (await window.callCoach.getSettings(field.key)) as string;
      loaded[field.key] = val || '';
    }
    setKeys(loaded);
  }

  function handleProviderChange(id: string) {
    setProvider(id);
    window.callCoach.setSettings('llmProvider', id);
  }

  function handleKeyChange(settingsKey: string, value: string) {
    setKeys((prev) => ({ ...prev, [settingsKey]: value }));
    window.callCoach.setSettings(settingsKey, value);
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">General Settings</h2>

      <div className="space-y-6">
        {/* LLM Provider */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            LLM Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LLM_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
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
        </div>

        {/* API Keys */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-300">API Keys</h3>
          <div className="space-y-3">
            {API_KEYS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs text-gray-400">
                  {field.label}
                  {field.key === 'apiKeys.deepgram' && (
                    <span className="ml-1 text-red-400">*required</span>
                  )}
                </label>
                <input
                  type="password"
                  value={keys[field.key] || ''}
                  onChange={(e) => handleKeyChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
