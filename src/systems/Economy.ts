// === Economy System — Resource simulation per tick ===
import {
  ResourceType,
  BuildingConfig,
  STARTING_RESOURCES,
} from '../config/GameData';

export interface ResourceState {
  resources: Record<ResourceType, number>;
  rates: Record<ResourceType, number>; // net change per tick
  tickCount: number;
}

export class Economy {
  state: ResourceState;

  constructor() {
    this.state = {
      resources: { ...STARTING_RESOURCES },
      rates: { labor: 0, capital: 0, materials: 0, knowledge: 0, trust: 0 },
      tickCount: 0,
    };
  }

  /** Recalculate production/consumption from active buildings */
  recalculate(buildings: BuildingConfig[]): void {
    const rates: Record<ResourceType, number> = {
      labor: 0, capital: 0, materials: 0, knowledge: 0, trust: 0,
    };

    for (const b of buildings) {
      for (const [res, val] of Object.entries(b.production)) {
        rates[res as ResourceType] += val as number;
      }
      for (const [res, val] of Object.entries(b.consumption)) {
        rates[res as ResourceType] -= val as number;
      }
    }

    this.state.rates = rates;
  }

  /** Process one economic tick */
  tick(): void {
    this.state.tickCount++;
    for (const res of Object.keys(this.state.resources) as ResourceType[]) {
      this.state.resources[res] += this.state.rates[res];
      // Clamp to >= 0
      if (this.state.resources[res] < 0) this.state.resources[res] = 0;
      // Clamp to max 9999 for display
      if (this.state.resources[res] > 9999) this.state.resources[res] = 9999;
    }
  }

  /** Check if we can afford a cost */
  canAfford(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const [res, val] of Object.entries(cost)) {
      if ((this.state.resources[res as ResourceType] || 0) < (val as number)) {
        return false;
      }
    }
    return true;
  }

  /** Deduct a cost */
  spend(cost: Partial<Record<ResourceType, number>>): void {
    for (const [res, val] of Object.entries(cost)) {
      this.state.resources[res as ResourceType] -= val as number;
    }
  }

  reset(): void {
    this.state.resources = { ...STARTING_RESOURCES };
    this.state.rates = { labor: 0, capital: 0, materials: 0, knowledge: 0, trust: 0 };
    this.state.tickCount = 0;
  }
}
