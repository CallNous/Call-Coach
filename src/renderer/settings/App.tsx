import React, { useState } from 'react';

type Tab = 'general' | 'audio' | 'methodology' | 'overlay';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'audio', label: 'Audio' },
    { id: 'methodology', label: 'Methodologies' },
    { id: 'overlay', label: 'Overlay' },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <nav className="w-48 border-r border-gray-800 p-4">
        <h1 className="mb-6 text-lg font-semibold">Call Coach</h1>
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-6">
        {activeTab === 'general' && <GeneralPlaceholder />}
        {activeTab === 'audio' && <AudioPlaceholder />}
        {activeTab === 'methodology' && <MethodologyPlaceholder />}
        {activeTab === 'overlay' && <OverlayPlaceholder />}
      </main>
    </div>
  );
}

function GeneralPlaceholder() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">General Settings</h2>
      <p className="text-gray-400">LLM provider selection and API keys will go here.</p>
    </div>
  );
}

function AudioPlaceholder() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Audio Settings</h2>
      <p className="text-gray-400">Microphone selection and audio configuration will go here.</p>
    </div>
  );
}

function MethodologyPlaceholder() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Methodologies</h2>
      <p className="text-gray-400">Methodology editor and selector will go here.</p>
    </div>
  );
}

function OverlayPlaceholder() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Overlay Settings</h2>
      <p className="text-gray-400">Opacity, position, and display options will go here.</p>
    </div>
  );
}
