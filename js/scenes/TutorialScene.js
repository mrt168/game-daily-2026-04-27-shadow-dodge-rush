class TutorialScene extends Phaser.Scene {
  constructor() { super({ key: 'TutorialScene' }); }

  create() {
    const w = GAME_CONFIG.WIDTH;
    const h = GAME_CONFIG.HEIGHT;

    if (this.textures.exists('background')) {
      this.add.image(w/2, h/2, 'background').setDisplaySize(w, h).setAlpha(0.5);
    } else {
      this.add.rectangle(w/2, h/2, w, h, GAME_CONFIG.COLORS.BG);
    }

    this.step = 0;
    this.steps = [
      {
        text: 'STEP 1/4\n画面をスワイプして\nキャラクターを動かそう！',
        action: 'swipe'
      },
      {
        text: 'STEP 2/4\n紫の影が\n0.5秒遅れて追ってくる',
        action: 'observe'
      },
      {
        text: 'STEP 3/4\n影に触れたら\nゲームオーバー！',
        action: 'observe'
      },
      {
        text: 'STEP 4/4\n金のコインで\nボーナス獲得！\nタップで開始',
        action: 'tap'
      }
    ];

    // デモ用のキャラ
    this.demoPlayer = this.add.circle(w/2, h/2 + 30, 18, GAME_CONFIG.COLORS.PLAYER);
    this.demoPlayerGlow = this.add.circle(w/2, h/2 + 30, 28, GAME_CONFIG.COLORS.PLAYER, 0.3);
    this.demoShadow = this.add.circle(w/2 - 50, h/2 + 30, 22, GAME_CONFIG.COLORS.SHADOW);
    this.demoShadow.setAlpha(0.7);

    // ステップテキスト
    this.stepText = this.add.text(w/2, h/2 - 130, '', {
      fontSize: '28px', color: '#FFFFFF', fontFamily: 'sans-serif',
      align: 'center', backgroundColor: '#0A0E27CC', padding: { x: 16, y: 12 },
      lineSpacing: 8
    }).setOrigin(0.5);

    // 次へボタン
    this.nextBtn = this.add.text(w/2, h - 80, 'NEXT ▶', {
      fontSize: '24px', color: '#00F0FF', fontFamily: 'monospace',
      backgroundColor: '#1A1A3E', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // スキップボタン
    const skipBtn = this.add.text(w - 60, 30, 'SKIP ✕', {
      fontSize: '14px', color: '#FFFFFF', fontFamily: 'monospace',
      backgroundColor: '#3B0764', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => {
      try {
        ScoreManager.setTutorialDone();
        this.scene.start('GameScene');
      } catch (e) { console.error(e); }
    });

    this.nextBtn.on('pointerdown', () => this.advanceStep());

    this.showStep(0);

    this.events.on('shutdown', () => {
      this.tweens.killAll();
      this.input.removeAllListeners();
    });
  }

  showStep(idx) {
    const s = this.steps[idx];
    this.stepText.setText(s.text);

    // テキストアニメ
    this.stepText.setAlpha(0);
    this.tweens.add({ targets: this.stepText, alpha: 1, duration: 400 });

    // ステップごとのデモ
    this.tweens.killTweensOf(this.demoPlayer);
    this.tweens.killTweensOf(this.demoShadow);

    if (idx === 0) {
      // スワイプデモ
      this.tweens.add({
        targets: [this.demoPlayer, this.demoPlayerGlow],
        x: GAME_CONFIG.WIDTH/2 + 100,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    } else if (idx === 1) {
      // 影が追跡
      this.tweens.add({
        targets: [this.demoPlayer, this.demoPlayerGlow],
        x: GAME_CONFIG.WIDTH/2 + 80,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
      this.tweens.add({
        targets: this.demoShadow,
        x: GAME_CONFIG.WIDTH/2 + 30,
        duration: 1200,
        delay: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    } else if (idx === 2) {
      // 接触＝ゲームオーバー演出
      this.tweens.add({
        targets: this.demoShadow,
        x: GAME_CONFIG.WIDTH/2,
        y: GAME_CONFIG.HEIGHT/2 + 30,
        duration: 600,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.inOut'
      });
      this.tweens.add({
        targets: this.demoPlayerGlow,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.8,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    } else if (idx === 3) {
      // コインデモ
      if (this.demoCoin) this.demoCoin.destroy();
      this.demoCoin = this.add.star(GAME_CONFIG.WIDTH/2 + 80, GAME_CONFIG.HEIGHT/2 + 30, 5, 8, 16, GAME_CONFIG.COLORS.COIN);
      this.tweens.add({
        targets: this.demoCoin,
        angle: 360,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      this.nextBtn.setText('PLAY ▶');
    }
  }

  advanceStep() {
    this.step++;
    if (this.step >= this.steps.length) {
      try {
        ScoreManager.setTutorialDone();
        this.scene.start('GameScene');
      } catch (e) { console.error(e); }
    } else {
      this.showStep(this.step);
    }
  }
}
