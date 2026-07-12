// === Era Manager — Progression through development stages ===
import { ERAS, EraConfig, ResourceType } from '../config/GameData';
import { Economy } from './Economy';

export class EraManager {
  currentEra: EraConfig;
  economy: Economy;
  onChangeEra: ((era: EraConfig) => void) | null = null;

  constructor(economy: Economy) {
    this.economy = economy;
    this.currentEra = ERAS[0];
  }

  getCurrentEraIndex(): number {
    return ERAS.findIndex(e => e.id === this.currentEra.id);
  }

  getEra(): EraConfig {
    return this.currentEra;
  }

  /** Check if we can advance to the next era */
  canAdvance(): boolean {
    const idx = this.getCurrentEraIndex();
    if (idx >= ERAS.length - 1) return false;
    const next = ERAS[idx + 1];
    for (const req of next.unlockCost) {
      if (this.economy.state.resources[req.resource] < req.amount) return false;
    }
    return true;
  }

  /** Get next era unlock requirements as display string */
  getAdvanceRequirements(): string {
    const idx = this.getCurrentEraIndex();
    if (idx >= ERAS.length - 1) return 'MAX ERA';
    const next = ERAS[idx + 1];
    return next.unlockCost.map(r =>
      `${r.resource}: ${r.amount}`
    ).join(' | ');
  }

  /** Advance to next era. Returns new era or null if can't. */
  advance(): EraConfig | null {
    if (!this.canAdvance()) return null;
    const idx = this.getCurrentEraIndex();
    this.currentEra = ERAS[idx + 1];
    // Deduct cost
    for (const req of ERAS[idx + 1].unlockCost) {
      this.economy.state.resources[req.resource] -= req.amount;
    }
    if (this.onChangeEra) this.onChangeEra(this.currentEra);
    return this.currentEra;
  }

  /** Get all buildings available in current era */
  getAvailableBuildings(): string[] {
    return []; // Will be computed in GameScene from BUILDINGS array
  }

  reset(): void {
    this.currentEra = ERAS[0];
  }
}
