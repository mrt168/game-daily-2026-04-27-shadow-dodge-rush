class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.gameData = data || {};
  }

  create() {
    const w = GAME_CONFIG.WIDTH;
    const h = GAME_CONFIG.HEIGHT;

    // 背景
    if (this.textures.exists('background')) {
      this.add.image(w/2, h/2, 'background').setDisplaySize(w, h).setAlpha(0.4);
    }
    this.add.rectangle(w/2, h/2, w, h, GAME_CONFIG.COLORS.BG, 0.6);

    const score = this.gameData.score || 0;
    const time = this.gameData.time || 0;
    const coins = this.gameData.coins || 0;
    const combo = this.gameData.combo || 1;
    const reason = this.gameData.reason || 'shadow';

    const prevHigh = ScoreManager.getHighScore();
    const isNewRecord = score > prevHigh;
    if (isNewRecord) ScoreManager.setHighScore(score);

    // タイトル
    this.add.text(w/2, 60, 'GAME OVER', {
      fontSize: '54px', color: '#FF3D6E', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // 死亡理由
    let reasonText = '影に追いつかれた';
    if (reason === 'timeout') reasonText = '3分間プレイ完走！';
    if (reason === 'error') reasonText = '予期せぬエラー';
    this.add.text(w/2, 110, reasonText, {
      fontSize: '20px', color: '#FFFFFF', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 軌跡リプレイ表示
    const trail = this.gameData.playerTrail || [];
    const trailGfx = this.add.graphics();
    if (trail.length > 1) {
      trailGfx.lineStyle(3, GAME_CONFIG.COLORS.PLAYER, 0.8);
      trailGfx.beginPath();
      trailGfx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        trailGfx.lineTo(trail[i].x, trail[i].y);
      }
      trailGfx.strokePath();
    }

    // スコアパネル
    const panelY = 200;
    this.add.rectangle(w/2, panelY + 70, w - 80, 200, 0x000000, 0.6).setStrokeStyle(2, 0x00F0FF);

    if (isNewRecord) {
      this.add.text(w/2, panelY, '🎉 NEW RECORD! 🎉', {
        fontSize: '28px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      this.add.text(w/2, panelY, `HIGH: ${prevHigh}`, {
        fontSize: '20px', color: '#B0B0E0', fontFamily: 'monospace'
      }).setOrigin(0.5);
    }

    this.add.text(w/2, panelY + 50, `SCORE: ${score}`, {
      fontSize: '40px', color: '#00F0FF', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(w/2, panelY + 100, `生存: ${time}秒  /  コイン: ${coins}  /  コンボ: x${combo}`, {
      fontSize: '16px', color: '#FFFFFF', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // ボタン
    const retryBtn = this.add.text(w/2 - 100, h - 80, '🔄 RETRY', {
      fontSize: '28px', color: '#00F0FF', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#1A1A3E', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const shareBtn = this.add.text(w/2 + 100, h - 80, '📤 SHARE', {
      fontSize: '28px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#1A1A3E', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const menuBtn = this.add.text(w/2, h - 30, 'MENU', {
      fontSize: '16px', color: '#B0B0E0', fontFamily: 'monospace',
      backgroundColor: '#3B0764', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => {
      try {
        this.scene.start('GameScene');
      } catch (e) { console.error(e); }
    });

    shareBtn.on('pointerdown', () => {
      try {
        const url = window.location.href;
        const text = `シャドウダッシュで ${score} 点獲得！${time}秒生存しました。0.5秒前の自分から逃げ続けるカジュアルアクション！\n#shadowdash #カジュアルゲーム`;
        const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(tweet, '_blank');
      } catch (e) {
        console.error('share error:', e);
      }
    });

    menuBtn.on('pointerdown', () => {
      try {
        this.scene.start('MenuScene');
      } catch (e) { console.error(e); }
    });

    this.events.on('shutdown', () => {
      this.tweens.killAll();
      this.input.removeAllListeners();
    });
  }
}
