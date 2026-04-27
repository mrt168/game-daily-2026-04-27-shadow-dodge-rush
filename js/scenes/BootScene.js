class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // ロード進捗バー
    const w = GAME_CONFIG.WIDTH;
    const h = GAME_CONFIG.HEIGHT;
    const bar = this.add.rectangle(w/2, h/2, 300, 8, 0x222244).setStrokeStyle(2, 0x00F0FF);
    const fill = this.add.rectangle(w/2 - 150, h/2, 0, 8, 0x00F0FF).setOrigin(0, 0.5);
    this.add.text(w/2, h/2 - 30, 'LOADING...', { fontSize: '24px', color: '#00F0FF', fontFamily: 'monospace' }).setOrigin(0.5);

    this.load.on('progress', (p) => fill.width = 300 * p);

    // アセット読み込み（失敗してもゲームは動くようフォールバック）
    this.load.image('player', 'assets/images/player.png');
    this.load.image('shadow', 'assets/images/shadow.png');
    this.load.image('coin', 'assets/images/coin.png');
    this.load.image('obstacle', 'assets/images/obstacle.png');
    this.load.image('background', 'assets/images/background.png');
    this.load.image('logo', 'assets/images/logo.png');
    this.load.image('icon', 'assets/images/icon.png');

    this.load.on('loaderror', (file) => {
      console.warn('Failed to load:', file.src);
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}
