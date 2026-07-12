import Phaser from 'phaser';
import {
  BuildingConfig,
  ResourceType,
  GameEvent,
  ERAS,
} from '../config/GameData';
import { Economy, ResourceState } from '../systems/Economy';
import { EraManager } from '../systems/EraManager';
import { GameScene } from './GameScene';

interface ResourceDisplay {
  icon: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  rate: Phaser.GameObjects.Text;
}

export class UIScene extends Phaser.Scene {
  gameScene!: GameScene;
  economy!: Economy;
  eraManager!: EraManager;

  resourceDisplays: Partial<Record<ResourceType, ResourceDisplay>> = {};
  buildingPalette: Phaser.GameObjects.Container[] = [];
  paletteContainer!: Phaser.GameObjects.Container;

  topBar!: Phaser.GameObjects.Graphics;
  bottomBar!: Phaser.GameObjects.Graphics;

  eraButton!: Phaser.GameObjects.Container;
  eraButtonLabel!: Phaser.GameObjects.Text;
  eraProgressText!: Phaser.GameObjects.Text;

  eventContainer!: Phaser.GameObjects.Container;
  eventTitle!: Phaser.GameObjects.Text;
  eventDesc!: Phaser.GameObjects.Text;
  eventChoiceA!: Phaser.GameObjects.Container;
  eventChoiceB!: Phaser.GameObjects.Container;

  notificationText!: Phaser.GameObjects.Text;
  notificationTimer: Phaser.Time.TimerEvent | null = null;

  eraNameText!: Phaser.GameObjects.Text;

  // Palette pagination
  paletteScrollX = 0;
  paletteArrowLeft!: Phaser.GameObjects.Container;
  paletteArrowRight!: Phaser.GameObjects.Container;
  maxPaletteVisible = 9;

  // End screen
  endScreenContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Access GameScene directly — it's already started before us
    this.gameScene = this.scene.get('GameScene') as GameScene;
    this.economy = this.gameScene.economy;
    this.eraManager = this.gameScene.eraManager;
    this.buildUI();
    this.registerEvents();
  }

  private buildUI(): void {
    // Top bar background
    this.topBar = this.add.graphics();
    this.topBar.setDepth(200);
    this.topBar.fillStyle(0x1a1a1a, 0.85);
    this.topBar.fillRect(0, 0, 1280, 64);
    this.topBar.lineStyle(2, 0xd4a017, 0.6);
    this.topBar.lineBetween(0, 64, 1280, 64);

    // Era name
    this.eraNameText = this.add.text(640, 8, this.eraManager.getEra().name, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#d4a017',
      fontStyle: 'bold',
    });
    this.eraNameText.setOrigin(0.5, 0);
    this.eraNameText.setDepth(201);

    // Resource displays
    const resources: { type: ResourceType; label: string; color: number; x: number }[] = [
      { type: 'labor', label: 'LABOR', color: 0xff9966, x: 20 },
      { type: 'capital', label: 'CAPITAL', color: 0xffd700, x: 220 },
      { type: 'materials', label: 'MATERIALS', color: 0x8b7355, x: 420 },
      { type: 'knowledge', label: 'KNOWLEDGE', color: 0x66ccff, x: 620 },
      { type: 'trust', label: 'TRUST', color: 0x66ff99, x: 820 },
    ];

    for (const res of resources) {
      const icon = this.add.graphics();
      icon.setDepth(201);
      // Colored left accent bar
      icon.fillStyle(res.color, 0.9);
      icon.fillRoundedRect(res.x, 36, 4, 18, 2);
      // Subtle background panel
      icon.fillStyle(0xffffff, 0.05);
      icon.fillRoundedRect(res.x + 4, 34, 176, 22, 4);

      const label = this.add.text(res.x + 14, 37, res.label, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#999999',
      });
      label.setDepth(201);

      const value = this.add.text(res.x + 90, 37, `${this.economy.state.resources[res.type]}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      value.setDepth(201);

      const rate = this.add.text(res.x + 140, 37, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
      });
      rate.setDepth(201);

      this.resourceDisplays[res.type] = { icon, label, value, rate };
    }

    // Bottom bar
    this.bottomBar = this.add.graphics();
    this.bottomBar.setDepth(200);
    this.bottomBar.fillStyle(0x1a1a1a, 0.85);
    this.bottomBar.fillRect(0, 640, 1280, 80);
    this.bottomBar.lineStyle(2, 0xd4a017, 0.6);
    this.bottomBar.lineBetween(0, 640, 1280, 640);

    // Building palette label
    this.add.text(12, 648, 'BUILD', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    }).setDepth(201);

    // Building palette
    this.paletteContainer = this.add.container(12, 662);
    this.paletteContainer.setDepth(201);
    this.paletteScrollX = 0;
    this.createPaletteArrows();
    this.refreshBuildingPalette();

    // Era advancement button
    this.createEraButton();

    // Notification text
    this.notificationText = this.add.text(640, 620, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.notificationText.setOrigin(0.5, 1);
    this.notificationText.setDepth(201);

    // Event container (hidden initially)
    this.createEventUI();

    // End screen (hidden initially)
    this.createEndScreen();

    // Initial resource update
    this.updateResourceDisplay();
  }

  private createEraButton(): void {
    this.eraButton = this.add.container(1130, 648);
    this.eraButton.setDepth(201);

    const bg = this.add.graphics();
    bg.fillStyle(0xd4a017, 0.3);
    bg.fillRoundedRect(0, 0, 135, 28, 4);
    bg.lineStyle(1, 0xd4a017, 0.8);
    bg.strokeRoundedRect(0, 0, 135, 28, 4);

    this.eraButtonLabel = this.add.text(67, 14, 'Advance Era', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d4a017',
    });
    this.eraButtonLabel.setOrigin(0.5);

    this.eraProgressText = this.add.text(67, 32, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    });
    this.eraProgressText.setOrigin(0.5);

    this.eraButton.add([bg, this.eraButtonLabel, this.eraProgressText]);
    this.eraButton.setSize(135, 28);
    this.eraButton.setInteractive({ useHandCursor: true });

    this.eraButton.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xd4a017, 0.5);
      bg.fillRoundedRect(0, 0, 135, 28, 4);
      bg.lineStyle(1, 0xd4a017, 1);
      bg.strokeRoundedRect(0, 0, 135, 28, 4);
    });

    this.eraButton.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xd4a017, 0.3);
      bg.fillRoundedRect(0, 0, 135, 28, 4);
      bg.lineStyle(1, 0xd4a017, 0.8);
      bg.strokeRoundedRect(0, 0, 135, 28, 4);
    });

    this.eraButton.on('pointerdown', () => {
      const canAdvance = this.eraManager.canAdvance();
      if (canAdvance) {
        this.gameScene.advanceEra();
      } else {
        this.showNotification(`Need: ${this.eraManager.getAdvanceRequirements()}`);
      }
    });
  }

  private createEventUI(): void {
    this.eventContainer = this.add.container(640, 360);
    this.eventContainer.setDepth(300);
    this.eventContainer.setVisible(false);

    // Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRoundedRect(-280, -160, 560, 320, 8);
    backdrop.lineStyle(2, 0xd4a017, 0.8);
    backdrop.strokeRoundedRect(-280, -160, 560, 320, 8);
    this.eventContainer.add(backdrop);

    // Title
    this.eventTitle = this.add.text(0, -130, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.eventTitle.setOrigin(0.5, 0);
    this.eventContainer.add(this.eventTitle);

    // Description
    this.eventDesc = this.add.text(0, -80, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#cccccc',
      wordWrap: { width: 480 },
      align: 'center',
    });
    this.eventDesc.setOrigin(0.5, 0);
    this.eventContainer.add(this.eventDesc);

    // Choices
    this.eventChoiceA = this.createEventChoice(0, 60, 'A');
    this.eventChoiceB = this.createEventChoice(0, 120, 'B');
    this.eventContainer.add([this.eventChoiceA, this.eventChoiceB]);
  }

  private createEventChoice(x: number, y: number, _label: string): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.8);
    bg.fillRoundedRect(-220, 0, 440, 44, 4);
    bg.lineStyle(1, 0x555555, 0.8);
    bg.strokeRoundedRect(-220, 0, 440, 44, 4);
    c.add(bg);

    const text = this.add.text(0, 22, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    c.add(text);

    c.setSize(440, 44);
    c.setInteractive({ useHandCursor: true });

    c.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x555555, 0.9);
      bg.fillRoundedRect(-220, 0, 440, 44, 4);
      bg.lineStyle(1, 0xd4a017, 0.8);
      bg.strokeRoundedRect(-220, 0, 440, 44, 4);
    });
    c.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x333333, 0.8);
      bg.fillRoundedRect(-220, 0, 440, 44, 4);
      bg.lineStyle(1, 0x555555, 0.8);
      bg.strokeRoundedRect(-220, 0, 440, 44, 4);
    });

    return c;
  }

  private registerEvents(): void {
    this.gameScene.events.on('tick', (state: ResourceState, _era: any) => {
      this.economy.state = state;
      this.updateResourceDisplay();
      this.updateEraButton();
    });

    this.gameScene.events.on('event-triggered', (event: GameEvent) => {
      this.showEvent(event);
    });

    this.gameScene.events.on('era-can-advance', (reqs: string) => {
      this.showNotification(`Era advancement available! ${reqs}`);
    });

    this.gameScene.events.on('era-changed', (era: any) => {
      this.onEraChanged(era);
    });

    this.gameScene.events.on('game-end', (result: { type: 'win' | 'lose'; message: string }) => {
      this.showEndScreen(result);
    });
  }

  private refreshBuildingPalette(): void {
    this.paletteContainer.removeAll(true);
    this.paletteScrollX = 0;

    const buildings = this.gameScene.getAvailableBuildings();
    this.buildingPalette = [];

    buildings.forEach((building, i) => {
      const x = i * 105;
      const btn = this.createBuildingButton(x, building);
      this.paletteContainer.add(btn);
      this.buildingPalette.push(btn);
    });

    // Show/hide arrows based on overflow
    const totalWidth = buildings.length * 105;
    const visibleWidth = this.maxPaletteVisible * 105;
    this.paletteArrowLeft.setVisible(false); // start at 0
    this.paletteArrowRight.setVisible(totalWidth > visibleWidth);
  }

  private createBuildingButton(x: number, building: BuildingConfig): Phaser.GameObjects.Container {
    const c = this.add.container(x, 0);

    const bg = this.add.graphics();
    const canAfford = this.economy.canAfford(building.cost);
    bg.fillStyle(canAfford ? 0x333333 : 0x222222, 0.9);
    bg.fillRoundedRect(0, 0, 98, 14, 2);
    bg.lineStyle(1, building.color, 0.6);
    bg.strokeRoundedRect(0, 0, 98, 14, 2);

    const text = this.add.text(49, 7, building.name, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: canAfford ? '#ffffff' : '#666666',
    });
    text.setOrigin(0.5);

    const costText = this.add.text(49, 17, this.formatCost(building.cost), {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: canAfford ? '#aaaaaa' : '#555555',
    });
    costText.setOrigin(0.5);

    c.add([bg, text, costText]);
    c.setSize(98, 30);
    c.setInteractive({ useHandCursor: true });

    c.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(canAfford ? 0x555555 : 0x333333, 0.9);
      bg.fillRoundedRect(0, 0, 98, 14, 2);
      bg.lineStyle(1, building.color, 1);
      bg.strokeRoundedRect(0, 0, 98, 14, 2);

      // Show tooltip
      this.showBuildingTooltip(building, x + 49);
    });

    c.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(canAfford ? 0x333333 : 0x222222, 0.9);
      bg.fillRoundedRect(0, 0, 98, 14, 2);
      bg.lineStyle(1, building.color, 0.6);
      bg.strokeRoundedRect(0, 0, 98, 14, 2);
      this.hideBuildingTooltip();
    });

    c.on('pointerdown', () => {
      if (canAfford) {
        this.gameScene.enterBuildMode(building);
        this.showNotification(`Place: ${building.name} — Click on the map`);
      }
    });

    return c;
  }

  private tooltipText: Phaser.GameObjects.Text | null = null;
  private tooltipBg: Phaser.GameObjects.Graphics | null = null;

  private showBuildingTooltip(building: BuildingConfig, _x: number): void {
    if (this.tooltipBg) this.tooltipBg.destroy();
    if (this.tooltipText) this.tooltipText.destroy();

    const lines = [
      `${building.name} (${building.category})`,
      `Era ${building.eraRequired} | Workers: ${building.workersRequired}`,
      ...Object.entries(building.production).map(([r, v]) => `  +${v} ${r}`),
      ...Object.entries(building.consumption).map(([r, v]) => `  -${v} ${r}`),
    ];

    const tooltipY = 560;
    this.tooltipBg = this.add.graphics();
    this.tooltipBg.setDepth(250);
    this.tooltipBg.fillStyle(0x1a1a1a, 0.95);
    this.tooltipBg.fillRoundedRect(300, tooltipY, 280, lines.length * 16 + 16, 4);
    this.tooltipBg.lineStyle(1, 0xd4a017, 0.6);
    this.tooltipBg.strokeRoundedRect(300, tooltipY, 280, lines.length * 16 + 16, 4);

    this.tooltipText = this.add.text(310, tooltipY + 8, lines.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cccccc',
      lineSpacing: 2,
    });
    this.tooltipText.setDepth(250);
  }

  private hideBuildingTooltip(): void {
    if (this.tooltipBg) { this.tooltipBg.destroy(); this.tooltipBg = null; }
    if (this.tooltipText) { this.tooltipText.destroy(); this.tooltipText = null; }
  }

  private formatCost(cost: Partial<Record<ResourceType, number>>): string {
    return Object.entries(cost)
      .map(([r, v]) => `${r.slice(0, 1).toUpperCase()}${v}`)
      .join(' ');
  }

  private updateResourceDisplay(): void {
    const s = this.economy.state;
    for (const res of Object.keys(s.resources) as ResourceType[]) {
      const d = this.resourceDisplays[res];
      if (!d) continue;
      d.value.setText(`${Math.floor(s.resources[res])}`);
      const rate = s.rates[res];
      d.rate.setText(rate >= 0 ? `\u2191${rate}/t` : `\u2193${Math.abs(rate)}/t`);
      d.rate.setColor(rate >= 0 ? '#66ff66' : '#ff6666');
    }
  }

  private updateEraButton(): void {
    const canAdvance = this.eraManager.canAdvance();
    const idx = this.eraManager.getCurrentEraIndex();
    const maxEra = idx >= ERAS.length - 1;

    if (maxEra) {
      this.eraButtonLabel.setText('MAX ERA');
      this.eraProgressText.setText('');
      this.eraButton.setAlpha(0.5);
    } else if (canAdvance) {
      this.eraButtonLabel.setText(`${ERAS[idx + 1].name}`);
      this.eraProgressText.setText('READY');
      this.eraButton.setAlpha(1);
    } else {
      this.eraButtonLabel.setText(`Advance Era`);
      const next = ERAS[idx + 1];
      const prog = next.unlockCost.map(r => {
        const pct = Math.min(100, Math.floor((this.economy.state.resources[r.resource] / r.amount) * 100));
        return `${r.resource}: ${pct}%`;
      }).join(' ');
      this.eraProgressText.setText(prog);
      this.eraButton.setAlpha(0.6);
    }
  }

  private showEvent(event: GameEvent): void {
    this.eventTitle.setText(event.name);
    this.eventDesc.setText(event.description);

    // Update choice texts
    const choiceAText = (this.eventChoiceA.list[1] as Phaser.GameObjects.Text);
    const choiceBText = (this.eventChoiceB.list[1] as Phaser.GameObjects.Text);
    choiceAText.setText(`${event.choices[0].label} — ${event.choices[0].description}`);
    choiceBText.setText(`${event.choices[1].label} — ${event.choices[1].description}`);

    // Set choice handlers
    this.eventChoiceA.off('pointerdown');
    this.eventChoiceA.on('pointerdown', () => {
      this.gameScene.resolveEvent(0);
      this.eventContainer.setVisible(false);
    });

    this.eventChoiceB.off('pointerdown');
    this.eventChoiceB.on('pointerdown', () => {
      this.gameScene.resolveEvent(1);
      this.eventContainer.setVisible(false);
    });

    this.eventContainer.setVisible(true);
  }

  private showNotification(msg: string): void {
    this.notificationText.setText(msg);
    this.notificationText.setAlpha(1);

    if (this.notificationTimer) {
      this.notificationTimer.destroy();
    }
    this.notificationTimer = this.time.delayedCall(3000, () => {
      this.notificationText.setAlpha(0);
    });
  }

  private onEraChanged(era: import('../config/GameData').EraConfig): void {
    this.eraNameText.setText(era.name);
    this.showNotification(`Era Advanced: ${era.name}!`);
    this.refreshBuildingPalette();
    this.updateEraButton();
  }

  // ==== PALETTE PAGINATION ====

  private createPaletteArrows(): void {
    // Left arrow
    this.paletteArrowLeft = this.add.container(1300, 662);
    this.paletteArrowLeft.setDepth(220);
    const lbg = this.add.graphics();
    lbg.fillStyle(0x333333, 0.9);
    lbg.fillTriangle(14, 0, 14, 28, 0, 14);
    this.paletteArrowLeft.add(lbg);
    this.paletteArrowLeft.setSize(14, 28);
    this.paletteArrowLeft.setInteractive({ useHandCursor: true });
    this.paletteArrowLeft.setVisible(false);
    this.paletteArrowLeft.on('pointerdown', () => this.scrollPalette(-1));

    // Right arrow  
    this.paletteArrowRight = this.add.container(1322, 662);
    this.paletteArrowRight.setDepth(220);
    const rbg = this.add.graphics();
    rbg.fillStyle(0x333333, 0.9);
    rbg.fillTriangle(0, 0, 0, 28, 14, 14);
    this.paletteArrowRight.add(rbg);
    this.paletteArrowRight.setSize(14, 28);
    this.paletteArrowRight.setInteractive({ useHandCursor: true });
    this.paletteArrowRight.setVisible(false);
    this.paletteArrowRight.on('pointerdown', () => this.scrollPalette(1));
  }

  private scrollPalette(direction: number): void {
    const buildings = this.gameScene.getAvailableBuildings();
    const totalWidth = buildings.length * 105;
    const visibleWidth = this.maxPaletteVisible * 105;
    const maxScroll = totalWidth - visibleWidth;

    this.paletteScrollX = Phaser.Math.Clamp(
      this.paletteScrollX + direction * visibleWidth,
      0,
      maxScroll
    );

    this.paletteArrowLeft.setVisible(this.paletteScrollX > 0);
    this.paletteArrowRight.setVisible(this.paletteScrollX < maxScroll);

    // Reposition all building buttons
    this.paletteContainer.setX(12 - this.paletteScrollX);
  }

  // ==== END SCREEN ====

  private createEndScreen(): void {
    this.endScreenContainer = this.add.container(640, 360);
    this.endScreenContainer.setDepth(400);
    this.endScreenContainer.setVisible(false);

    // Dark backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.85);
    backdrop.fillRect(-640, -360, 1280, 720);
    this.endScreenContainer.add(backdrop);

    // Inner panel
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a1a, 0.95);
    panel.fillRoundedRect(-300, -200, 600, 400, 12);
    panel.lineStyle(2, 0xd4a017, 0.8);
    panel.strokeRoundedRect(-300, -200, 600, 400, 12);
    this.endScreenContainer.add(panel);
  }

  private showEndScreen(result: { type: 'win' | 'lose'; message: string }): void {
    // Clear previous content (except backdrop and panel)
    const keepList = this.endScreenContainer.list.slice(0, 2);
    this.endScreenContainer.removeAll(true);
    for (const item of keepList) this.endScreenContainer.add(item);

    const isWin = result.type === 'win';
    const s = this.economy.state;

    const title = isWin ? 'INNOVATION HUB ACHIEVED' : 'ECONOMIC COLLAPSE';
    const titleColor = isWin ? '#ffd700' : '#ff4444';

    const titleText = this.add.text(0, -170, title, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: titleColor,
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5, 0);
    this.endScreenContainer.add(titleText);

    // Message
    const msgText = this.add.text(0, -110, result.message, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#cccccc',
      wordWrap: { width: 500 },
      align: 'center',
    });
    msgText.setOrigin(0.5, 0);
    this.endScreenContainer.add(msgText);

    // Stats
    const stats = [
      `Final Era: ${this.eraManager.getEra().name}`,
      `Knowledge: ${Math.floor(s.resources.knowledge)}   Trust: ${Math.floor(s.resources.trust)}`,
      `Capital: ${Math.floor(s.resources.capital)}   Labor: ${Math.floor(s.resources.labor)}`,
      `Ticks Elapsed: ${s.tickCount}`,
    ].join('\n');

    const statsText = this.add.text(0, -10, stats, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center',
    });
    statsText.setOrigin(0.5, 0);
    this.endScreenContainer.add(statsText);

    // Play Again button
    const btnContainer = this.add.container(0, 110);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xd4a017, 0.3);
    btnBg.fillRoundedRect(-100, 0, 200, 44, 6);
    btnBg.lineStyle(2, 0xd4a017, 0.8);
    btnBg.strokeRoundedRect(-100, 0, 200, 44, 6);
    btnContainer.add(btnBg);

    const btnText = this.add.text(0, 22, 'PLAY AGAIN', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700',
    });
    btnText.setOrigin(0.5);
    btnContainer.add(btnText);

    btnContainer.setSize(200, 44);
    btnContainer.setInteractive({ useHandCursor: true });

    btnContainer.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xd4a017, 0.5);
      btnBg.fillRoundedRect(-100, 0, 200, 44, 6);
      btnBg.lineStyle(2, 0xd4a017, 1);
      btnBg.strokeRoundedRect(-100, 0, 200, 44, 6);
    });
    btnContainer.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xd4a017, 0.3);
      btnBg.fillRoundedRect(-100, 0, 200, 44, 6);
      btnBg.lineStyle(2, 0xd4a017, 0.8);
      btnBg.strokeRoundedRect(-100, 0, 200, 44, 6);
    });
    btnContainer.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    this.endScreenContainer.add(btnContainer);
    this.endScreenContainer.setVisible(true);
  }
}
