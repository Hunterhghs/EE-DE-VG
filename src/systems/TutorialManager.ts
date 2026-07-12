// === Tutorial System — Step-by-step first-time walkthrough ===

export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  highlight?: { x: number; y: number; w: number; h: number }; // screen coords to highlight
  waitFor?: 'build' | 'tick' | 'event' | 'era';
  waitForId?: string; // building id or specific trigger
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Eastern Frontier',
    text: 'You are the economic advisor to a post-Soviet town in 1991. The old system has collapsed. Guide this town through transition — from decay to innovation hub.\n\nClick "Next" to begin.',
  },
  {
    id: 'build_bazaar',
    title: 'Build a Bazaar',
    text: 'The informal economy is the first to recover. Build a Bazaar to generate capital and trust.\n\nClick "Bazaar" in the bottom bar, then click on the map to place it.',
    highlight: { x: 12, y: 662, w: 100, h: 30 },
    waitFor: 'build',
    waitForId: 'bazaar',
  },
  {
    id: 'build_panelak',
    title: 'Housing Your Workers',
    text: 'Your workers need homes. Build a Panelák to increase your labor pool.\n\nClick "Panelák Housing" in the bottom bar, then place it.',
    highlight: { x: 117, y: 662, w: 100, h: 30 },
    waitFor: 'build',
    waitForId: 'panelak',
  },
  {
    id: 'resources',
    title: 'Watch Your Resources',
    text: 'Resources accumulate every tick (2 seconds). Watch the top bar — Labor, Capital, Materials, Knowledge, and Trust.\n\nGreen numbers = growing. Red = shrinking. Keep them all positive!',
    highlight: { x: 20, y: 34, w: 950, h: 22 },
    waitFor: 'tick',
  },
  {
    id: 'era_advance',
    title: 'Advancing Eras',
    text: 'When you accumulate enough Capital and Trust, the "Advance Era" button lights up. Click it to move to the next development stage.\n\nEach era unlocks new buildings and transforms the visual landscape.',
    highlight: { x: 1130, y: 648, w: 135, h: 40 },
    waitFor: 'era',
  },
  {
    id: 'events',
    title: 'Economic Events',
    text: 'Random events will challenge you — brain drain, corruption scandals, energy crises. Make careful policy choices!\n\nEach choice has trade-offs. Think like a development economist.',
    waitFor: 'event',
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    text: 'Build, grow, and transform. Reach Era 5 with 500 Knowledge and 800 Trust to win.\n\nYour game auto-saves every 5 ticks. Good luck, advisor!',
  },
];

export class TutorialManager {
  steps: TutorialStep[];
  currentStep = 0;
  active = false;
  waitingFor: { type: string; id?: string } | null = null;

  onComplete: (() => void) | null = null;
  onStepChange: ((step: TutorialStep, index: number) => void) | null = null;

  constructor() {
    this.steps = TUTORIAL_STEPS;
  }

  start(): void {
    this.active = true;
    this.currentStep = 0;
    this.notifyStep();
  }

  next(): void {
    if (!this.active) return;
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.active = false;
      if (this.onComplete) this.onComplete();
      return;
    }
    this.notifyStep();
  }

  getCurrentStep(): TutorialStep | null {
    if (!this.active || this.currentStep >= this.steps.length) return null;
    return this.steps[this.currentStep];
  }

  /** The game calls this when a building is placed, a tick passes, etc. */
  notify(event: string, id?: string): void {
    if (!this.active || !this.waitingFor) return;
    if (this.waitingFor.type === event && (!this.waitingFor.id || this.waitingFor.id === id)) {
      this.waitingFor = null;
      this.next();
    }
  }

  private notifyStep(): void {
    const step = this.getCurrentStep();
    if (!step) return;

    // If this step has a wait condition, set it up
    if (step.waitFor) {
      this.waitingFor = { type: step.waitFor, id: step.waitForId };
    }

    if (this.onStepChange) this.onStepChange(step, this.currentStep);
  }
}
