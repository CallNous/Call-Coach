/**
 * Methodology loader and manager.
 * Loads built-in methodologies from JSON and supports user-created custom ones.
 */

import type { MethodologyConfig } from '../shared/types';

// Import built-in methodologies
import meddic from '../config/methodologies/meddic.json';
import discovery from '../config/methodologies/discovery.json';
import qbr from '../config/methodologies/qbr.json';
import interview from '../config/methodologies/interview.json';
import difficultConversation from '../config/methodologies/difficult-conversation.json';

const BUILTIN_METHODOLOGIES: MethodologyConfig[] = [
  meddic as MethodologyConfig,
  discovery as MethodologyConfig,
  qbr as MethodologyConfig,
  interview as MethodologyConfig,
  difficultConversation as MethodologyConfig,
];

const CUSTOM_STORAGE_KEY = 'customMethodologies';

export class MethodologyService {
  private builtIn: MethodologyConfig[] = BUILTIN_METHODOLOGIES;
  private custom: MethodologyConfig[] = [];
  private activeId: string = 'meddic';

  /** Load custom methodologies from settings */
  async loadCustom(): Promise<void> {
    try {
      const stored = (await window.callCoach.getSettings(CUSTOM_STORAGE_KEY)) as MethodologyConfig[] | null;
      if (stored && Array.isArray(stored)) {
        this.custom = stored;
      }
    } catch {
      this.custom = [];
    }
  }

  /** Get all available methodologies (built-in + custom) */
  getAll(): MethodologyConfig[] {
    return [...this.builtIn, ...this.custom];
  }

  /** Get a methodology by ID */
  get(id: string): MethodologyConfig | undefined {
    return this.getAll().find((m) => m.id === id);
  }

  /** Get the active methodology */
  getActive(): MethodologyConfig | undefined {
    return this.get(this.activeId);
  }

  /** Set the active methodology */
  setActive(id: string): void {
    this.activeId = id;
    window.callCoach.setSettings('methodology', id);
  }

  /** Cycle to the next methodology */
  cycleNext(): MethodologyConfig {
    const all = this.getAll();
    const currentIdx = all.findIndex((m) => m.id === this.activeId);
    const nextIdx = (currentIdx + 1) % all.length;
    this.activeId = all[nextIdx].id;
    window.callCoach.setSettings('methodology', this.activeId);
    return all[nextIdx];
  }

  /** Build the prompt string for the active methodology */
  buildPrompt(): string {
    const methodology = this.getActive();
    if (!methodology) return '';

    const phaseDescriptions = methodology.phases
      .map((p) => `- ${p.name}: ${p.guidance}`)
      .join('\n');

    return `Methodology: ${methodology.name}
${methodology.description}

Phases:
${phaseDescriptions}

Output format: ${methodology.outputFormat}`;
  }

  /** Save a custom methodology */
  async saveCustom(config: MethodologyConfig): Promise<void> {
    const existingIdx = this.custom.findIndex((m) => m.id === config.id);
    if (existingIdx >= 0) {
      this.custom[existingIdx] = config;
    } else {
      this.custom.push(config);
    }
    await window.callCoach.setSettings(CUSTOM_STORAGE_KEY, this.custom);
  }

  /** Delete a custom methodology */
  async deleteCustom(id: string): Promise<void> {
    this.custom = this.custom.filter((m) => m.id !== id);
    await window.callCoach.setSettings(CUSTOM_STORAGE_KEY, this.custom);
    if (this.activeId === id) {
      this.activeId = 'meddic';
      await window.callCoach.setSettings('methodology', this.activeId);
    }
  }

  /** Check if a methodology is built-in (non-deletable) */
  isBuiltIn(id: string): boolean {
    return this.builtIn.some((m) => m.id === id);
  }
}

export const methodologyService = new MethodologyService();
