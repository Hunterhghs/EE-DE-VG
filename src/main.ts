import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

// Debug: catch any errors on the page
window.addEventListener('error', (e) => {
  const el = document.getElementById('game-container');
  if (el) {
    el.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;background:#1a1a1a;"><h2>Game Error</h2><pre>${e.message}\n${e.filename}:${e.lineno}</pre></div>`;
  }
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#2a2a2a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
};

new Phaser.Game(config);
