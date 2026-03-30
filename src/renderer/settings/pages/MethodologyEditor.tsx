import React, { useEffect, useState } from 'react';
import { methodologyService } from '../../../services/methodology';
import type { MethodologyConfig, MethodologyPhase } from '../../../shared/types';

export default function MethodologyEditor() {
  const [methodologies, setMethodologies] = useState<MethodologyConfig[]>([]);
  const [activeId, setActiveId] = useState('meddic');
  const [editing, setEditing] = useState<MethodologyConfig | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    await methodologyService.loadCustom();
    setMethodologies(methodologyService.getAll());
    const stored = (await window.callCoach.getSettings('methodology')) as string;
    if (stored) {
      setActiveId(stored);
      methodologyService.setActive(stored);
    }
  }

  function handleSelect(id: string) {
    setActiveId(id);
    methodologyService.setActive(id);
  }

  function handleNew() {
    setEditing({
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      phases: [{ name: '', keywords: [], guidance: '' }],
      outputFormat: '2-4 actionable coaching bullets',
    });
  }

  function handleEdit(m: MethodologyConfig) {
    setEditing({ ...m, phases: m.phases.map((p) => ({ ...p, keywords: [...p.keywords] })) });
  }

  async function handleSave() {
    if (!editing || !editing.name.trim()) return;
    await methodologyService.saveCustom(editing);
    setEditing(null);
    setMethodologies(methodologyService.getAll());
  }

  async function handleDelete(id: string) {
    await methodologyService.deleteCustom(id);
    setMethodologies(methodologyService.getAll());
    if (activeId === id) setActiveId('meddic');
  }

  if (editing) {
    return (
      <EditForm
        config={editing}
        onChange={setEditing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Methodologies</h2>
        <button
          onClick={handleNew}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
        >
          + New
        </button>
      </div>

      <div className="space-y-2">
        {methodologies.map((m) => (
          <div
            key={m.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer ${
              activeId === m.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
            onClick={() => handleSelect(m.id)}
          >
            <div>
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-xs text-gray-400">{m.description}</div>
            </div>
            <div className="flex items-center gap-2">
              {activeId === m.id && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px]">Active</span>
              )}
              {!methodologyService.isBuiltIn(m.id) && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(m); }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditForm({
  config,
  onChange,
  onSave,
  onCancel,
}: {
  config: MethodologyConfig;
  onChange: (c: MethodologyConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function updatePhase(idx: number, field: keyof MethodologyPhase, value: string | string[]) {
    const phases = [...config.phases];
    phases[idx] = { ...phases[idx], [field]: value };
    onChange({ ...config, phases });
  }

  function addPhase() {
    onChange({ ...config, phases: [...config.phases, { name: '', keywords: [], guidance: '' }] });
  }

  function removePhase(idx: number) {
    onChange({ ...config, phases: config.phases.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        {config.name ? `Edit: ${config.name}` : 'New Methodology'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Name</label>
          <input
            value={config.name}
            onChange={(e) => onChange({ ...config, name: e.target.value })}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. SPIN Selling"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-400">Description</label>
          <input
            value={config.description}
            onChange={(e) => onChange({ ...config, description: e.target.value })}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="Brief description of the methodology"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-gray-400">Phases</label>
            <button onClick={addPhase} className="text-xs text-blue-400 hover:text-blue-300">
              + Add Phase
            </button>
          </div>
          <div className="space-y-3">
            {config.phases.map((phase, i) => (
              <div key={i} className="rounded-md border border-gray-700 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <input
                    value={phase.name}
                    onChange={(e) => updatePhase(i, 'name', e.target.value)}
                    className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none"
                    placeholder="Phase name"
                  />
                  {config.phases.length > 1 && (
                    <button onClick={() => removePhase(i)} className="text-xs text-red-400">
                      Remove
                    </button>
                  )}
                </div>
                <input
                  value={phase.keywords.join(', ')}
                  onChange={(e) =>
                    updatePhase(i, 'keywords', e.target.value.split(',').map((k) => k.trim()).filter(Boolean))
                  }
                  className="mb-2 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none"
                  placeholder="Keywords (comma separated)"
                />
                <textarea
                  value={phase.guidance}
                  onChange={(e) => updatePhase(i, 'guidance', e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white focus:outline-none"
                  placeholder="Coaching guidance for this phase"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="rounded-md bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
