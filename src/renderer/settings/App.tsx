import React, { useState } from 'react';
import GeneralSettings from './pages/GeneralSettings';
import AudioSettings from './pages/AudioSettings';
import MethodologyEditor from './pages/MethodologyEditor';
import OverlaySettings from './pages/OverlaySettings';

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
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'audio' && <AudioSettings />}
        {activeTab === 'methodology' && <MethodologyEditor />}
        {activeTab === 'overlay' && <OverlaySettings />}
      </main>
    </div>
  );
}
