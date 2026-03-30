/**
 * TranscriptManager maintains a rolling window of conversation transcript.
 * - Keeps full text for the last N minutes
 * - Summarizes older content (placeholder for LLM summarization in Phase 4)
 * - Provides formatted context for the coaching LLM prompt
 */

import type { TranscriptEntry } from '../shared/types';
import { TRANSCRIPT_WINDOW_MINUTES } from '../shared/constants';

export class TranscriptManager {
  private entries: TranscriptEntry[] = [];
  private summary: string = '';
  private windowMs = TRANSCRIPT_WINDOW_MINUTES * 60 * 1000;

  /** Add a transcript entry. Replaces interim results from the same speaker. */
  addEntry(entry: TranscriptEntry): void {
    if (!entry.isFinal) {
      // Replace the last interim entry from the same speaker
      const lastIdx = this.findLastInterim(entry.speaker);
      if (lastIdx >= 0) {
        this.entries[lastIdx] = entry;
      } else {
        this.entries.push(entry);
      }
    } else {
      // Remove any interim for this speaker, then add final
      const lastIdx = this.findLastInterim(entry.speaker);
      if (lastIdx >= 0) {
        this.entries[lastIdx] = entry;
      } else {
        this.entries.push(entry);
      }
      this.pruneOldEntries();
    }
  }

  /** Get all entries in the current window. */
  getRecentEntries(): TranscriptEntry[] {
    const cutoff = Date.now() - this.windowMs;
    return this.entries.filter((e) => e.timestamp >= cutoff);
  }

  /** Get the last finalized entry (for coaching trigger). */
  getLastFinalEntry(): TranscriptEntry | null {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].isFinal) {
        return this.entries[i];
      }
    }
    return null;
  }

  /**
   * Format transcript for the coaching LLM prompt.
   * Returns labeled lines: [You]: text / [Them]: text
   */
  getFormattedTranscript(): string {
    const recent = this.getRecentEntries().filter((e) => e.isFinal);
    const lines = recent.map(
      (e) => `[${e.speaker === 'you' ? 'You' : 'Them'}]: ${e.text}`
    );

    if (this.summary) {
      return `[Earlier conversation summary]\n${this.summary}\n\n[Recent conversation]\n${lines.join('\n')}`;
    }

    return lines.join('\n');
  }

  /** Get total finalized entry count. */
  get entryCount(): number {
    return this.entries.filter((e) => e.isFinal).length;
  }

  /** Clear all entries and summary. */
  clear(): void {
    this.entries = [];
    this.summary = '';
  }

  private findLastInterim(speaker: 'you' | 'them'): number {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].speaker === speaker && !this.entries[i].isFinal) {
        return i;
      }
    }
    return -1;
  }

  private pruneOldEntries(): void {
    const cutoff = Date.now() - this.windowMs;
    const oldEntries = this.entries.filter(
      (e) => e.timestamp < cutoff && e.isFinal
    );

    if (oldEntries.length > 10) {
      // Build a simple summary of pruned entries
      const lines = oldEntries.map(
        (e) => `[${e.speaker === 'you' ? 'You' : 'Them'}]: ${e.text}`
      );
      this.summary = lines.join('\n');

      // Remove old entries
      this.entries = this.entries.filter(
        (e) => e.timestamp >= cutoff || !e.isFinal
      );
    }
  }
}

export const transcriptManager = new TranscriptManager();
