class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const w = GAME_CONFIG.WIDTH;
    const h = GAME_CONFIG.HEIGHT;

    // 背景
    if (this.textures.exists('background')) {
      this.add.image(w/2, h/2, 'background').setDisplaySize(w, h).setAlpha(0.7);
    } else {
      this.add.rectangle(w/2, h/2, w, h, GAME_CONFIG.COLORS.BG);
    }

    // 装飾パーティクル（背景）
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Math.random() * w,
        Math.random() * h,
        Math.random() * 1.5 + 0.5,
        0xFFFFFF,
        Math.random() * 0.6 + 0.2
      );
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1
      });
    }

    // ロゴ
    if (this.textures.exists('logo')) {
      const logo = this.add.image(w/2, h/2 - 130, 'logo').setScale(0.4);
      // ロゴサイズを画面幅に合わせる
      const maxW = w * 0.7;
      if (logo.displayWidth > maxW) {
        logo.setScale(maxW / logo.width);
      }
      this.tweens.add({
        targets: logo,
        scaleX: logo.scaleX * 1.05,
        scaleY: logo.scaleY * 1.05,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    } else {
      this.add.text(w/2, h/2 - 130, 'SHADOW DASH', {
        fontSize: '64px', color: '#00F0FF', fontFamily: 'monospace', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // サブタイトル
    this.add.text(w/2, h/2 - 30, 'シャドウダッシュ', {
      fontSize: '28px', color: '#FFFFFF', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 説明
    this.add.text(w/2, h/2 + 20, '0.5秒前のあなたから逃げ続けろ', {
      fontSize: '18px', color: '#B0B0E0', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // ハイスコア
    const high = ScoreManager.getHighScore();
    this.add.text(w/2, h/2 + 70, `HIGH SCORE: ${high}`, {
      fontSize: '20px', color: '#FFD700', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // スタートボタン
    const startBtn = this.add.text(w/2, h/2 + 140, '▶ TAP TO START', {
      fontSize: '32px', color: '#00F0FF', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#1A1A3E', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: startBtn,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // チュートリアルボタン
    const tutBtn = this.add.text(w - 80, 30, '? TUTORIAL', {
      fontSize: '14px', color: '#FFFFFF', fontFamily: 'monospace',
      backgroundColor: '#3B0764', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const startGame = () => {
      try {
        if (window.AUDIO) window.AUDIO.resume();
        if (ScoreManager.isTutorialDone()) {
          this.scene.start('GameScene');
        } else {
          this.scene.start('TutorialScene');
        }
      } catch (e) {
        console.error('startGame error:', e);
        this.scene.start('GameScene');
      }
    };

    startBtn.on('pointerdown', startGame);
    this.input.on('pointerdown', (p, targets) => {
      if (targets.length === 0) startGame();
    });
    tutBtn.on('pointerdown', () => {
      this.scene.start('TutorialScene');
    });

    // クリーンアップ
    this.events.on('shutdown', () => {
      this.tweens.killAll();
      this.input.removeAllListeners();
    });
  }
}
