// === Eastern Frontier — Game Configuration ===
// All tunable game data in one place. No hardcoded values in game logic.

// ---- Eras ----
export interface EraConfig {
  id: number;
  name: string;
  yearRange: string;
  skyColor: number;
  groundColor: number;
  buildingAccent: number;
  unlockCost: { resource: ResourceType; amount: number }[];
  description: string;
}

export type ResourceType = 'labor' | 'capital' | 'materials' | 'knowledge' | 'trust';

export const ERAS: EraConfig[] = [
  {
    id: 1,
    name: 'Post-Soviet Decay',
    yearRange: '1991–1995',
    skyColor: 0x8a8a8a,
    groundColor: 0x5a5248,
    buildingAccent: 0x8b4513,
    unlockCost: [],
    description: 'Crumbling factories. Capital flight. A town in freefall.'
  },
  {
    id: 2,
    name: 'Stabilization',
    yearRange: '1996–2004',
    skyColor: 0x87aeb5,
    groundColor: 0x6b8e4e,
    buildingAccent: 0xd4a017,
    unlockCost: [
      { resource: 'capital', amount: 500 },
      { resource: 'trust', amount: 30 }
    ],
    description: 'Privatization. First banks. Tentative growth.'
  },
  {
    id: 3,
    name: 'EU Accession',
    yearRange: '2005–2012',
    skyColor: 0x4a90d9,
    groundColor: 0x5a9e4b,
    buildingAccent: 0xffd700,
    unlockCost: [
      { resource: 'capital', amount: 2000 },
      { resource: 'knowledge', amount: 40 }
    ],
    description: 'EU funds. Modern highways. Open borders.'
  },
  {
    id: 4,
    name: 'Growth',
    yearRange: '2013–2020',
    skyColor: 0x5bb5e8,
    groundColor: 0x6db85d,
    buildingAccent: 0x00bcd4,
    unlockCost: [
      { resource: 'capital', amount: 5000 },
      { resource: 'knowledge', amount: 70 }
    ],
    description: 'Tech parks. Renewable energy. Rising wages.'
  },
  {
    id: 5,
    name: 'Innovation Hub',
    yearRange: '2021+',
    skyColor: 0x7ec8f8,
    groundColor: 0x7cc46c,
    buildingAccent: 0xff6ec7,
    unlockCost: [
      { resource: 'capital', amount: 10000 },
      { resource: 'knowledge', amount: 95 }
    ],
    description: 'Startup campuses. High-speed rail. Global competition.'
  },
];

// ---- Buildings ----
export type BuildingCategory = 'industrial' | 'residential' | 'commercial' | 'institutional' | 'infrastructure';

export interface BuildingConfig {
  id: string;
  name: string;
  category: BuildingCategory;
  eraRequired: number;
  cost: Partial<Record<ResourceType, number>>;
  production: Partial<Record<ResourceType, number>>; // per tick
  consumption: Partial<Record<ResourceType, number>>; // per tick
  workersRequired: number;
  width: number;  // tiles wide
  height: number; // tiles tall
  color: number;
  description: string;
  maxCount?: number; // max per game
}

export const BUILDINGS: BuildingConfig[] = [
  // === Era 1: Post-Soviet Decay ===
  {
    id: 'bazaar',
    name: 'Bazaar',
    category: 'commercial',
    eraRequired: 1,
    cost: { labor: 20, materials: 40 },
    production: { capital: 2, trust: 1 },
    consumption: {},
    workersRequired: 2,
    width: 2,
    height: 1,
    color: 0x8b7355,
    description: 'Open-air market. The informal economy lives here.',
  },
  {
    id: 'factory_soviet',
    name: 'Soviet Factory',
    category: 'industrial',
    eraRequired: 1,
    cost: { labor: 50, materials: 80 },
    production: { materials: 4, capital: 3 },
    consumption: { labor: 2 },
    workersRequired: 8,
    width: 3,
    height: 2,
    color: 0x696969,
    description: 'Heavy industry left over from the planned economy.',
  },
  {
    id: 'panelak',
    name: 'Panelák Housing',
    category: 'residential',
    eraRequired: 1,
    cost: { materials: 60, capital: 20 },
    production: { labor: 5 },
    consumption: { capital: 1 },
    workersRequired: 0,
    width: 3,
    height: 3,
    color: 0x9e9e9e,
    description: 'Prefab concrete housing blocks. Cramped but home.',
  },
  {
    id: 'clinic_basic',
    name: 'Basic Clinic',
    category: 'institutional',
    eraRequired: 1,
    cost: { capital: 60, materials: 40 },
    production: { trust: 2, labor: 1 },
    consumption: { capital: 2 },
    workersRequired: 3,
    width: 2,
    height: 1,
    color: 0xd4c5a9,
    description: 'Underfunded but functional healthcare.',
  },
  // === Era 2: Stabilization ===
  {
    id: 'bank',
    name: 'Commercial Bank',
    category: 'commercial',
    eraRequired: 2,
    cost: { capital: 120, materials: 60 },
    production: { capital: 6, trust: 2 },
    consumption: { labor: 1 },
    workersRequired: 4,
    width: 2,
    height: 2,
    color: 0x4a708b,
    description: 'Credit and investment. The financial sector awakens.',
  },
  {
    id: 'small_business',
    name: 'Small Business',
    category: 'commercial',
    eraRequired: 2,
    cost: { capital: 80, labor: 10 },
    production: { capital: 4, trust: 1 },
    consumption: {},
    workersRequired: 3,
    width: 1,
    height: 1,
    color: 0xd4a017,
    description: 'Privatized shops and services. Entrepreneurship returns.',
  },
  {
    id: 'school',
    name: 'School',
    category: 'institutional',
    eraRequired: 2,
    cost: { capital: 150, materials: 80 },
    production: { knowledge: 4, trust: 2 },
    consumption: { capital: 3 },
    workersRequired: 5,
    width: 2,
    height: 2,
    color: 0xe8d5a3,
    description: 'Education rebuilds human capital.',
  },
  // === Era 3: EU Accession ===
  {
    id: 'highway',
    name: 'Modern Highway',
    category: 'infrastructure',
    eraRequired: 3,
    cost: { capital: 300, materials: 200 },
    production: { capital: 5, knowledge: 2 },
    consumption: { materials: 2 },
    workersRequired: 6,
    width: 4,
    height: 1,
    color: 0x404040,
    description: 'Connects your town to European markets.',
  },
  {
    id: 'university',
    name: 'University',
    category: 'institutional',
    eraRequired: 3,
    cost: { capital: 400, materials: 250, knowledge: 10 },
    production: { knowledge: 8, labor: 2 },
    consumption: { capital: 5 },
    workersRequired: 10,
    width: 3,
    height: 2,
    color: 0x4169e1,
    description: 'Higher education. The knowledge economy begins.',
  },
  {
    id: 'business_park',
    name: 'Business Park',
    category: 'commercial',
    eraRequired: 3,
    cost: { capital: 350, materials: 180 },
    production: { capital: 10, knowledge: 3 },
    consumption: { labor: 3 },
    workersRequired: 12,
    width: 3,
    height: 2,
    color: 0x87ceeb,
    description: 'Foreign investment hub. Office space for new firms.',
  },
  // === Era 4: Growth ===
  {
    id: 'tech_park',
    name: 'Tech Park',
    category: 'commercial',
    eraRequired: 4,
    cost: { capital: 600, knowledge: 30, materials: 300 },
    production: { knowledge: 10, capital: 12 },
    consumption: { labor: 4 },
    workersRequired: 15,
    width: 3,
    height: 2,
    color: 0x00bcd4,
    description: 'Startup incubators. R&D labs. The future is coded here.',
  },
  {
    id: 'solar_farm',
    name: 'Solar Farm',
    category: 'infrastructure',
    eraRequired: 4,
    cost: { capital: 500, materials: 350 },
    production: { materials: 6, trust: 3 },
    consumption: {},
    workersRequired: 4,
    width: 4,
    height: 1,
    color: 0x228b22,
    description: 'Renewable energy. Green transition.',
  },
  {
    id: 'modern_hospital',
    name: 'Modern Hospital',
    category: 'institutional',
    eraRequired: 4,
    cost: { capital: 450, materials: 280, knowledge: 15 },
    production: { trust: 6, labor: 2 },
    consumption: { capital: 6 },
    workersRequired: 12,
    width: 3,
    height: 2,
    color: 0xf5f5f5,
    description: 'EU-standard healthcare. Life expectancy rises.',
  },
  // === Era 5: Innovation Hub ===
  {
    id: 'startup_campus',
    name: 'Startup Campus',
    category: 'commercial',
    eraRequired: 5,
    cost: { capital: 1000, knowledge: 50, materials: 400 },
    production: { knowledge: 15, capital: 20 },
    consumption: { labor: 6 },
    workersRequired: 20,
    width: 4,
    height: 2,
    color: 0xff6ec7,
    description: 'Unicorn factory. Global talent magnet.',
  },
  {
    id: 'hsr_station',
    name: 'High-Speed Rail',
    category: 'infrastructure',
    eraRequired: 5,
    cost: { capital: 800, materials: 500 },
    production: { capital: 8, knowledge: 5, trust: 2 },
    consumption: { materials: 3 },
    workersRequired: 8,
    width: 4,
    height: 1,
    color: 0xcccccc,
    description: 'Connected to the continent. Brain circulation enabled.',
  },
  {
    id: 'research_center',
    name: 'Research Center',
    category: 'institutional',
    eraRequired: 5,
    cost: { capital: 900, knowledge: 40, materials: 350 },
    production: { knowledge: 20 },
    consumption: { capital: 8, labor: 3 },
    workersRequired: 25,
    width: 3,
    height: 2,
    color: 0xffffff,
    description: 'Frontier research. Nobel-track science.',
  },
];

// ---- Events ----
export interface GameEvent {
  id: string;
  name: string;
  eraRange: [number, number];
  probability: number; // per tick
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  label: string;
  effects: Partial<Record<ResourceType, number>>;
  description: string;
}

export const EVENTS: GameEvent[] = [
  {
    id: 'capital_flight',
    name: 'Capital Flight',
    eraRange: [1, 2],
    probability: 0.08,
    description: 'Investors pull money out. The currency wobbles.',
    choices: [
      { label: 'Impose capital controls', effects: { capital: -20, trust: -5 }, description: 'Stop the bleeding, but scare investors.' },
      { label: 'Let it flow', effects: { capital: -40, trust: 2 }, description: 'Markets reward freedom — eventually.' },
    ],
  },
  {
    id: 'brain_drain',
    name: 'Brain Drain Wave',
    eraRange: [1, 5],
    probability: 0.06,
    description: 'Your best-educated workers leave for the West.',
    choices: [
      { label: 'Offer return incentives', effects: { capital: -30, knowledge: -3 }, description: 'Pay them to stay.' },
      { label: 'Invest in opportunities', effects: { capital: -50, knowledge: -1, trust: 5 }, description: 'Build reasons to stay.' },
    ],
  },
  {
    id: 'corruption_scandal',
    name: 'Corruption Scandal',
    eraRange: [1, 3],
    probability: 0.07,
    description: 'An oligarch has captured a state asset.',
    choices: [
      { label: 'Prosecute', effects: { trust: 10, capital: -20 }, description: 'Rule of law. But expect retaliation.' },
      { label: 'Negotiate quietly', effects: { trust: -8, capital: 10 }, description: 'Pragmatic, but trust erodes.' },
    ],
  },
  {
    id: 'eu_grant',
    name: 'EU Structural Funds',
    eraRange: [3, 5],
    probability: 0.05,
    description: 'Brussels approves a development grant.',
    choices: [
      { label: 'Infrastructure', effects: { materials: 100, capital: 80 }, description: 'Roads, rails, broadband.' },
      { label: 'Education', effects: { knowledge: 15, labor: 5 }, description: 'Invest in people.' },
    ],
  },
  {
    id: 'fdi_arrival',
    name: 'Foreign Investor Interest',
    eraRange: [3, 5],
    probability: 0.06,
    description: 'A multinational considers investing in your town.',
    choices: [
      { label: 'Offer tax incentives', effects: { capital: 150, trust: -3 }, description: 'Jobs now, but at what cost?' },
      { label: 'Demand local partnership', effects: { capital: 80, knowledge: 8, trust: 3 }, description: 'Sustainable integration.' },
    ],
  },
  {
    id: 'winter_crisis',
    name: 'Winter Energy Crisis',
    eraRange: [1, 3],
    probability: 0.04,
    description: 'Gas supplies are cut. Winter is coming.',
    choices: [
      { label: 'Subsidize heating', effects: { capital: -40, trust: 5 }, description: 'Keep people warm.' },
      { label: 'Let prices rise', effects: { capital: -10, trust: -10 }, description: 'Market solution. Cold comfort.' },
    ],
  },
];

// ---- Game Constants ----
export const TICK_INTERVAL = 2000; // ms per economic tick
export const WORLD_WIDTH = 4800;   // total world width in px
export const WORLD_HEIGHT = 720;
export const GROUND_Y = 520;       // y-position of ground surface
export const TILE_SIZE = 80;       // building grid tile size
export const BUILDING_ZONE_START = 200; // x where buildings can be placed
export const BUILDING_ZONE_WIDTH = 4000; // total buildable area
export const MAX_BUILDINGS = 40;
export const STARTING_RESOURCES: Record<ResourceType, number> = {
  labor: 30,
  capital: 50,
  materials: 100,
  knowledge: 5,
  trust: 20,
};
