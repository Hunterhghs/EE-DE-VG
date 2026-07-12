import Phaser from 'phaser';
import {
  BUILDINGS,
  BuildingConfig,
  ERAS,
  EVENTS,
  GameEvent,
  ResourceType,
  TICK_INTERVAL,
  WORLD_WIDTH,
  GROUND_Y,
  TILE_SIZE,
  BUILDING_ZONE_START,
  BUILDING_ZONE_WIDTH,
  MAX_BUILDINGS,
} from '../config/GameData';
import { Economy } from '../systems/Economy';
import { EraManager } from '../systems/EraManager';

interface PlacedBuilding {
  config: BuildingConfig;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Container;
}

interface WorkerUnit {
  sprite: Phaser.GameObjects.Sprite;
  buildingId: string | null; // assigned to building
  speed: number;
  direction: number; // 1 = right, -1 = left
  homeX: number;
}

export class GameScene extends Phaser.Scene {
  economy!: Economy;
  eraManager!: EraManager;

  // World layers
  skyGraphics!: Phaser.GameObjects.Graphics;
  bgMountains!: Phaser.GameObjects.Graphics;
  bgSkyline!: Phaser.GameObjects.Graphics;
  groundGraphics!: Phaser.GameObjects.Graphics;
  gridGraphics!: Phaser.GameObjects.Graphics;

  // Buildings
  buildings: PlacedBuilding[] = [];
  selectedBuilding: BuildingConfig | null = null;
  ghostGraphics!: Phaser.GameObjects.Graphics;

  // Workers
  workers: WorkerUnit[] = [];
  workerGroup!: Phaser.Physics.Arcade.Group;

  // Tick
  lastTickTime = 0;
  tickText!: Phaser.GameObjects.Text;

  // Camera scroll
  worldCamera!: Phaser.Cameras.Scene2D.Camera;
  scrollSpeed = 3;

  // Event state
  activeEvent: GameEvent | null = null;
  eventActive = false;

  // Build mode
  buildMode = false;

  // Game over
  gameOver = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.economy = new Economy();
    this.eraManager = new EraManager(this.economy);

    // World bounds
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 720);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 720);

    // Draw world
    this.drawSky();
    this.drawMountains();
    this.drawGround();
    this.drawGrid();

    // Worker physics group
    this.workerGroup = this.physics.add.group();

    // Ghost for building placement
    this.ghostGraphics = this.add.graphics();
    this.ghostGraphics.setDepth(100);
    this.ghostGraphics.setAlpha(0.6);

    // Tick display
    this.tickText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa',
    });
    this.tickText.setScrollFactor(0);
    this.tickText.setDepth(200);

    // Spawn initial workers
    this.spawnInitialWorkers();

    // Input: building placement
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.buildMode && this.selectedBuilding) {
        this.updateGhost(pointer);
      }
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.buildMode && this.selectedBuilding) {
        this.placeBuilding(pointer);
      }
    });

    // Keyboard: camera scroll
    this.input.keyboard!.on('keydown-A', () => {
      this.cameras.main.scrollX = Math.max(0, this.cameras.main.scrollX - 40);
    });
    this.input.keyboard!.on('keydown-D', () => {
      this.cameras.main.scrollX = Math.min(
        WORLD_WIDTH - 1280,
        this.cameras.main.scrollX + 40
      );
    });

    // Keyboard: cancel build mode
    this.input.keyboard!.on('keydown-ESC', () => {
      this.cancelBuildMode();
    });

    // Edge scrolling
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > 1200) {
        this.cameras.main.scrollX = Math.min(WORLD_WIDTH - 1280, this.cameras.main.scrollX + this.scrollSpeed);
      }
      if (pointer.x < 80) {
        this.cameras.main.scrollX = Math.max(0, this.cameras.main.scrollX - this.scrollSpeed);
      }
    });

    // Era change listener
    this.eraManager.onChangeEra = (era) => {
      this.onEraChanged(era);
    };

    // Emit ready signal to UIScene
    this.events.emit('game-ready', this.economy, this.eraManager);
  }

  update(time: number, _delta: number): void {
    // Economic tick
    if (time - this.lastTickTime > TICK_INTERVAL) {
      this.lastTickTime = time;
      this.processTick(time);
    }

    // Update workers
    this.updateWorkers();

    // Update tick display
    this.tickText.setText(`Tick: ${this.economy.state.tickCount} | Era: ${this.eraManager.getEra().name}`);
  }

  // ==== DRAWING ====

  private drawSky(): void {
    this.skyGraphics = this.add.graphics();
    this.skyGraphics.setDepth(-10);
    const era = this.eraManager.getEra();
    this.skyGraphics.fillGradientStyle(era.skyColor, era.skyColor, Phaser.Display.Color.ValueToColor(era.skyColor).lighten(30).color, Phaser.Display.Color.ValueToColor(era.skyColor).lighten(30).color, 1);
    this.skyGraphics.fillRect(0, 0, WORLD_WIDTH, GROUND_Y);
  }

  private drawMountains(): void {
    this.bgMountains = this.add.graphics();
    this.bgMountains.setDepth(-5);
    const era = this.eraManager.getEra();

    // Parallax mountain silhouettes
    for (let x = 0; x < WORLD_WIDTH; x += 300) {
      const h = 60 + Math.sin(x * 0.003) * 80 + Math.cos(x * 0.007) * 40;
      this.bgMountains.fillStyle(Phaser.Display.Color.ValueToColor(era.skyColor).darken(40).color, 0.5);
      this.bgMountains.fillTriangle(
        x - 80, GROUND_Y,
        x + 40, GROUND_Y - h,
        x + 160, GROUND_Y
      );
    }

    // Background skyline (city silhouette)
    this.bgSkyline = this.add.graphics();
    this.bgSkyline.setDepth(-6);
    this.bgSkyline.fillStyle(Phaser.Display.Color.ValueToColor(era.skyColor).darken(30).color, 0.3);
    for (let x = 200; x < WORLD_WIDTH; x += 400) {
      const bw = 40 + Math.random() * 60;
      const bh = 60 + Math.random() * 120;
      this.bgSkyline.fillRect(x, GROUND_Y - bh, bw, bh);
    }
  }

  private drawGround(): void {
    this.groundGraphics = this.add.graphics();
    this.groundGraphics.setDepth(-2);
    const era = this.eraManager.getEra();

    // Ground fill
    this.groundGraphics.fillStyle(era.groundColor, 1);
    this.groundGraphics.fillRect(0, GROUND_Y, WORLD_WIDTH, 720 - GROUND_Y);

    // Ground surface line
    this.groundGraphics.lineStyle(3, Phaser.Display.Color.ValueToColor(era.groundColor).darken(30).color, 1);
    this.groundGraphics.lineBetween(0, GROUND_Y, WORLD_WIDTH, GROUND_Y);

    // Texture detail: small grass tufts
    for (let x = 0; x < WORLD_WIDTH; x += 20) {
      if (Math.random() > 0.6) {
        const gh = 3 + Math.random() * 6;
        this.groundGraphics.lineStyle(1, Phaser.Display.Color.ValueToColor(era.groundColor).lighten(30).color, 0.6);
        this.groundGraphics.lineBetween(x, GROUND_Y, x + 2, GROUND_Y - gh);
      }
    }
  }

  private drawGrid(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(0);
    this.gridGraphics.lineStyle(1, 0xffffff, 0.08);

    const cols = Math.floor(BUILDING_ZONE_WIDTH / TILE_SIZE);
    const rows = Math.floor((720 - GROUND_Y - 40) / TILE_SIZE);

    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        this.gridGraphics.strokeRect(
          BUILDING_ZONE_START + c * TILE_SIZE,
          GROUND_Y - (r + 1) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }
  }

  // ==== BUILDING SYSTEM ====

  enterBuildMode(config: BuildingConfig): void {
    if (this.buildings.length >= MAX_BUILDINGS) return;
    if (!this.economy.canAfford(config.cost)) return;

    this.selectedBuilding = config;
    this.buildMode = true;
  }

  cancelBuildMode(): void {
    this.buildMode = false;
    this.selectedBuilding = null;
    this.ghostGraphics.clear();
  }

  private updateGhost(pointer: Phaser.Input.Pointer): void {
    if (!this.selectedBuilding) return;

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Snap to grid
    const tileX = Math.floor((worldX - BUILDING_ZONE_START) / TILE_SIZE) * TILE_SIZE + BUILDING_ZONE_START;
    const maxTileY = GROUND_Y - this.selectedBuilding.height * TILE_SIZE;
    const tileY = Math.min(maxTileY, Math.floor(worldY / TILE_SIZE) * TILE_SIZE);

    // Clamp
    const cx = Phaser.Math.Clamp(tileX, BUILDING_ZONE_START, BUILDING_ZONE_START + BUILDING_ZONE_WIDTH - this.selectedBuilding.width * TILE_SIZE);
    const cy = Phaser.Math.Clamp(tileY, 0, maxTileY);

    const canPlace = this.canPlaceBuilding(cx, cy, this.selectedBuilding);

    this.ghostGraphics.clear();
    this.ghostGraphics.fillStyle(canPlace ? 0x00ff00 : 0xff0000, 0.3);
    this.ghostGraphics.fillRect(cx, cy, this.selectedBuilding.width * TILE_SIZE, this.selectedBuilding.height * TILE_SIZE);
    this.ghostGraphics.lineStyle(2, canPlace ? 0x00ff00 : 0xff0000, 0.8);
    this.ghostGraphics.strokeRect(cx, cy, this.selectedBuilding.width * TILE_SIZE, this.selectedBuilding.height * TILE_SIZE);
  }

  private canPlaceBuilding(x: number, y: number, config: BuildingConfig): boolean {
    const bw = config.width * TILE_SIZE;
    const bh = config.height * TILE_SIZE;

    // Check bounds
    if (x < BUILDING_ZONE_START || x + bw > BUILDING_ZONE_START + BUILDING_ZONE_WIDTH) return false;
    if (y + bh > GROUND_Y) return false;

    // Check overlap
    for (const b of this.buildings) {
      const obw = b.config.width * TILE_SIZE;
      const obh = b.config.height * TILE_SIZE;
      if (
        x < b.x + obw &&
        x + bw > b.x &&
        y < b.y + obh &&
        y + bh > b.y
      ) {
        return false;
      }
    }

    return true;
  }

  private placeBuilding(pointer: Phaser.Input.Pointer): void {
    if (!this.selectedBuilding) return;

    const tileX = Math.floor((pointer.worldX - BUILDING_ZONE_START) / TILE_SIZE) * TILE_SIZE + BUILDING_ZONE_START;
    const maxTileY = GROUND_Y - this.selectedBuilding.height * TILE_SIZE;
    const tileY = Math.min(maxTileY, Math.floor(pointer.worldY / TILE_SIZE) * TILE_SIZE);

    const cx = Phaser.Math.Clamp(tileX, BUILDING_ZONE_START, BUILDING_ZONE_START + BUILDING_ZONE_WIDTH - this.selectedBuilding.width * TILE_SIZE);
    const cy = Phaser.Math.Clamp(tileY, 0, maxTileY);

    if (!this.canPlaceBuilding(cx, cy, this.selectedBuilding)) return;

    // Spend resources
    this.economy.spend(this.selectedBuilding.cost);

    // Create building sprite
    const container = this.createBuildingSprite(cx, cy, this.selectedBuilding);

    this.buildings.push({
      config: this.selectedBuilding,
      x: cx,
      y: cy,
      sprite: container,
    });

    // Recalculate economy
    this.economy.recalculate(this.buildings.map(b => b.config));

    // Spawn worker for building if needed
    if (this.selectedBuilding.workersRequired > 0) {
      this.spawnWorkerForBuilding(this.selectedBuilding.id, cx, cy);
    }

    this.cancelBuildMode();
  }

  private createBuildingSprite(x: number, y: number, config: BuildingConfig): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(1);

    const bw = config.width * TILE_SIZE;
    const bh = config.height * TILE_SIZE;

    // Main building body
    const body = this.add.graphics();
    const darkerColor = Phaser.Display.Color.ValueToColor(config.color).darken(20).color;
    body.fillStyle(config.color, 1);
    body.fillRect(0, 0, bw, bh);
    // Building border
    body.lineStyle(2, darkerColor, 1);
    body.strokeRect(0, 0, bw, bh);

    // Roof
    body.fillStyle(darkerColor, 1);
    body.fillRect(4, 0, bw - 8, 8);

    // Windows
    const winColor = Phaser.Display.Color.ValueToColor(config.color).lighten(40).color;
    body.fillStyle(winColor, 0.7);
    const cols = Math.floor(bw / 20);
    const rows = Math.floor(bh / 30);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (r === 0) continue; // skip roof row
        body.fillRect(10 + c * 20, 16 + r * 30, 8, 10);
      }
    }

    // Chimney/smokestack for industrial
    if (config.category === 'industrial') {
      body.fillStyle(0x444444, 1);
      body.fillRect(bw - 16, -20, 8, 20);
    }

    container.add(body);

    // Label
    const label = this.add.text(bw / 2, bh + 4, config.name, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0.5, 0);
    container.add(label);

    return container;
  }

  // ==== WORKER SYSTEM ====

  private spawnInitialWorkers(): void {
    for (let i = 0; i < 5; i++) {
      this.spawnWorker(200 + i * 100, GROUND_Y - 32);
    }
  }

  private spawnWorker(x: number, y: number): WorkerUnit {
    const sprite = this.physics.add.sprite(x, y, 'worker');
    sprite.setDepth(10);
    sprite.setCollideWorldBounds(true);

    const worker: WorkerUnit = {
      sprite,
      buildingId: null,
      speed: 30 + Math.random() * 20,
      direction: Math.random() > 0.5 ? 1 : -1,
      homeX: x,
    };

    (sprite.body as Phaser.Physics.Arcade.Body).setVelocityX(worker.speed * worker.direction);
    this.workers.push(worker);
    this.workerGroup.add(sprite);

    return worker;
  }

  private spawnWorkerForBuilding(buildingId: string, bx: number, by: number): void {
    const worker = this.spawnWorker(bx + 40, GROUND_Y - 32);
    worker.buildingId = buildingId;
    worker.homeX = bx + 40;
  }

  private updateWorkers(): void {
    for (const w of this.workers) {
      const body = w.sprite.body as Phaser.Physics.Arcade.Body;
      const era = this.eraManager.getEra();
      const groundColor = era.groundColor;

      // Bounce at edges of building zone
      if (w.sprite.x < BUILDING_ZONE_START || w.sprite.x > BUILDING_ZONE_START + BUILDING_ZONE_WIDTH) {
        w.direction *= -1;
      }

      // Random direction changes
      if (Math.random() < 0.005) {
        w.direction *= -1;
      }

      body.setVelocityX(w.speed * w.direction);

      // Keep on ground
      if (w.sprite.y < GROUND_Y - 32) {
        w.sprite.y = GROUND_Y - 32;
        body.setVelocityY(0);
      }
    }
  }

  // ==== TICK PROCESSING ====

  private processTick(_time: number): void {
    if (this.gameOver) return;

    // Economy tick
    this.economy.tick();

    // Check win/loss
    const result = this.checkWinLossConditions();
    if (result) {
      this.gameOver = true;
      this.events.emit('game-end', result);
      return;
    }

    // Random events
    if (!this.eventActive && Math.random() < 0.15) {
      this.triggerRandomEvent();
    }

    // Check era advancement
    if (this.eraManager.canAdvance() && Math.random() < 0.1) {
      this.emitEraAdvanceSignal();
    }

    // Emit tick data to UI
    this.events.emit('tick', this.economy.state, this.eraManager.getEra());
  }

  private checkWinLossConditions(): { type: 'win' | 'lose'; message: string } | null {
    const s = this.economy.state;
    const eraIdx = this.eraManager.getCurrentEraIndex();

    // Win: Reach Era 5 with high knowledge and trust
    if (eraIdx >= 4 && s.resources.knowledge >= 500 && s.resources.trust >= 800) {
      return {
        type: 'win',
        message: 'Your town has transformed from post-Soviet decay into a globally competitive innovation hub. The Eastern Frontier is no longer a frontier — it\'s a destination.'
      };
    }

    // Lose: All resources at zero
    const allZero = (Object.keys(s.resources) as ResourceType[]).every(r => s.resources[r] <= 0);
    if (allZero) {
      return {
        type: 'lose',
        message: 'Economic collapse. All resources depleted. The town could not survive the transition. History will record another failed post-Soviet economy.'
      };
    }

    return null;
  }

  private triggerRandomEvent(): void {
    const eraIdx = this.eraManager.getCurrentEraIndex();
    const eraId = this.eraManager.getEra().id;

    const eligible = EVENTS.filter(e => e.eraRange[0] <= eraId && e.eraRange[1] >= eraId);
    if (eligible.length === 0) return;

    const event = eligible[Math.floor(Math.random() * eligible.length)];

    if (Math.random() < event.probability) {
      this.activeEvent = event;
      this.eventActive = true;
      this.events.emit('event-triggered', event);
    }
  }

  resolveEvent(choiceIndex: number): void {
    if (!this.activeEvent) return;

    const choice = this.activeEvent.choices[choiceIndex];
    if (!choice) return;

    for (const [res, val] of Object.entries(choice.effects)) {
      this.economy.state.resources[res as ResourceType] += val as number;
      if (this.economy.state.resources[res as ResourceType] < 0) {
        this.economy.state.resources[res as ResourceType] = 0;
      }
    }

    this.activeEvent = null;
    this.eventActive = false;
  }

  private emitEraAdvanceSignal(): void {
    this.events.emit('era-can-advance', this.eraManager.getAdvanceRequirements());
  }

  advanceEra(): void {
    const newEra = this.eraManager.advance();
    if (newEra) {
      this.events.emit('era-changed', newEra);
    }
  }

  // ==== ERA CHANGE ====

  private onEraChanged(_era: import('../config/GameData').EraConfig): void {
    // Redraw world with new era colors
    this.skyGraphics.destroy();
    this.bgMountains.destroy();
    this.bgSkyline.destroy();
    this.groundGraphics.destroy();
    this.gridGraphics.destroy();

    this.drawSky();
    this.drawMountains();
    this.drawGround();
    this.drawGrid();

    // Flash effect
    this.cameras.main.flash(500, 255, 255, 255);
  }

  // ==== GETTERS FOR UIScene ====

  getAvailableBuildings(): BuildingConfig[] {
    const eraId = this.eraManager.getEra().id;
    return BUILDINGS.filter(b => b.eraRequired <= eraId);
  }

  getBuildingById(id: string): BuildingConfig | undefined {
    return BUILDINGS.find(b => b.id === id);
  }
}
