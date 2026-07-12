import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading bar
    const { width, height } = this.cameras.main;
    const barW = 400;
    const barH = 24;
    const barX = (width - barW) / 2;
    const barY = height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const bar = this.add.graphics();

    this.load.on('progress', (val: number) => {
      bar.clear();
      bar.fillStyle(0xd4a017, 1);
      bar.fillRect(barX, barY, barW * val, barH);
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
    });

    // Generate textures programmatically — no external assets needed
    this.generateTextures();
  }

  create(): void {
    this.scene.start('GameScene');
    this.scene.start('UIScene');
  }

  /** Generate all game textures procedurally */
  private generateTextures(): void {
    // Worker sprite (simple character)
    const workerGfx = this.make.graphics({ x: 0, y: 0 }, false);
    // Body
    workerGfx.fillStyle(0x4a3728, 1);
    workerGfx.fillRect(6, 0, 12, 16);
    // Head
    workerGfx.fillStyle(0xffdab9, 1);
    workerGfx.fillCircle(12, 20, 8);
    // Hat
    workerGfx.fillStyle(0x555555, 1);
    workerGfx.fillRect(4, 26, 16, 4);
    workerGfx.fillRect(8, 30, 8, 2);
    workerGfx.generateTexture('worker', 24, 32);
    workerGfx.destroy();

    // Entrepreneur sprite
    const entGfx = this.make.graphics({ x: 0, y: 0 }, false);
    entGfx.fillStyle(0x2c3e50, 1);
    entGfx.fillRect(4, 0, 16, 18);
    entGfx.fillStyle(0xffdab9, 1);
    entGfx.fillCircle(12, 22, 7);
    entGfx.fillStyle(0x8b4513, 1);
    entGfx.fillRect(6, 27, 12, 5);
    entGfx.generateTexture('entrepreneur', 24, 32);
    entGfx.destroy();

    // Bureaucrat sprite
    const burGfx = this.make.graphics({ x: 0, y: 0 }, false);
    burGfx.fillStyle(0x708090, 1);
    burGfx.fillRect(4, 0, 16, 18);
    burGfx.fillStyle(0xffdab9, 1);
    burGfx.fillCircle(12, 22, 7);
    burGfx.fillStyle(0x333333, 1);
    burGfx.fillRect(6, 27, 12, 3);
    burGfx.generateTexture('bureaucrat', 24, 32);
    burGfx.destroy();

    // Particle for construction
    const partGfx = this.make.graphics({ x: 0, y: 0 }, false);
    partGfx.fillStyle(0xffffff, 1);
    partGfx.fillRect(0, 0, 4, 4);
    partGfx.generateTexture('particle', 4, 4);
    partGfx.destroy();

    // Building placeholder textures (will be drawn in scene)
    const tileGfx = this.make.graphics({ x: 0, y: 0 }, false);
    tileGfx.fillStyle(0x808080, 1);
    tileGfx.fillRect(0, 0, 80, 80);
    tileGfx.lineStyle(1, 0x555555, 1);
    tileGfx.strokeRect(0, 0, 80, 80);
    tileGfx.generateTexture('tile', 80, 80);
    tileGfx.destroy();
  }
}
