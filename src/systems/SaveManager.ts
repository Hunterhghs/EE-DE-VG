// === Save/Load System — localStorage persistence ===
import { ResourceState } from './Economy';
import { EraConfig, ERAS } from '../config/GameData';

export interface SaveData {
  version: number;
  timestamp: number;
  resources: ResourceState['resources'];
  tickCount: number;
  eraId: number;
  buildings: { id: string; x: number; y: number }[];
  tutorialCompleted: boolean;
}

const SAVE_KEY = 'eastern-frontier-save';
const SAVE_VERSION = 1;

export class SaveManager {
  /** Save current game state to localStorage */
  static save(data: SaveData): boolean {
    try {
      const json = JSON.stringify({ ...data, version: SAVE_VERSION, timestamp: Date.now() });
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch (e) {
      console.warn('Failed to save game:', e);
      return false;
    }
  }

  /** Load game state from localStorage. Returns null if no save or corrupt. */
  static load(): SaveData | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;
      const data = JSON.parse(json) as SaveData;
      if (data.version !== SAVE_VERSION) return null;
      return data;
    } catch (e) {
      console.warn('Failed to load game:', e);
      return false as unknown as null;
    }
  }

  /** Check if a save exists */
  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /** Delete the save */
  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /** Auto-save on every tick */
  static autoSave(
    resources: ResourceState['resources'],
    tickCount: number,
    eraId: number,
    buildings: { id: string; x: number; y: number }[],
    tutorialCompleted: boolean
  ): void {
    SaveManager.save({
      version: SAVE_VERSION,
      timestamp: Date.now(),
      resources: { ...resources },
      tickCount,
      eraId,
      buildings: [...buildings],
      tutorialCompleted,
    });
  }
}
