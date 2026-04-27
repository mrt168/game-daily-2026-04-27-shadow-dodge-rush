class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  create() {
    const w = GAME_CONFIG.WIDTH;
    const h = GAME_CONFIG.HEIGHT;

    this.gameState = 'playing';
    this.startTime = this.time.now;
    this.score = 0;
    this.coinCount = 0;
    this.comboMult = 1;
    this.lastSafeTime = this.time.now;
    this.coins = [];
    this.obstacles = [];
    this.lastInputTime = this.time.now;
    this.lastMilestone = 0;
    this.frameLog = [];
    this._graceText = null;

    // 背景
    if (this.textures.exists('background')) {
      this.bg = this.add.image(w/2, h/2, 'background').setDisplaySize(w, h).setAlpha(0.5);
    } else {
      this.bg = this.add.rectangle(w/2, h/2, w, h, GAME_CONFIG.COLORS.BG);
    }

    // 軌跡描画用 Graphics
    this.trailGfx = this.add.graphics();
    this.trailGfx.setDepth(1);

    // プレイヤー・影
    this.player = new Player(this, w/2, h/2);
    this.player.setDepth(10);
    // 影は画面端の遠くから出現
    this.shadow = new Shadow(this, 80, h/2);
    this.shadow.setDepth(8);
    // 開始から1.5秒はグレース期間（衝突無効）
    this.graceUntil = this.time.now + 1500;

    // UI
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '24px', color: '#FFFFFF', fontFamily: 'monospace', fontStyle: 'bold'
    }).setDepth(20);
    this.timeText = this.add.text(w - 20, 20, 'TIME: 0s', {
      fontSize: '20px', color: '#00F0FF', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(20);
    this.comboText = this.add.text(w/2, 20, '', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setDepth(20);

    // 入力
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.isPointerDown = false;

    // タイマー
    this.coinTimer = this.time.addEvent({
      delay: GAME_CONFIG.GAME.COIN_SPAWN_INTERVAL_MS,
      loop: true,
      callback: this.spawnCoin,
      callbackScope: this
    });
    this.obstacleTimer = this.time.delayedCall(GAME_CONFIG.GAME.OBSTACLE_START_AT_MS, () => {
      this.obsSpawnTimer = this.time.addEvent({
        delay: GAME_CONFIG.GAME.OBSTACLE_SPAWN_INTERVAL_MS,
        loop: true,
        callback: this.spawnObstacle,
        callbackScope: this
      });
    });

    // 強制終了タイマー
    this.maxTimer = this.time.delayedCall(GAME_CONFIG.GAME.MAX_DURATION_MS, () => {
      if (this.gameState === 'playing') this.gameOver({ reason: 'timeout' });
    });

    // 初期コイン1個
    this.spawnCoin();

    // BGM
    if (window.AUDIO) {
      window.AUDIO.resume();
      window.AUDIO.startBGM();
    }

    // クリーンアップ
    this.events.on('shutdown', () => {
      this.gameState = 'shutdown';
      this.time.removeAllEvents();
      this.tweens.killAll();
      this.input.removeAllListeners();
      this.coins.forEach(c => { try { c.destroy(); } catch (e) {} });
      this.obstacles.forEach(o => { try { o.destroy(); } catch (e) {} });
      this.coins = [];
      this.obstacles = [];
      this._graceText = null;
      if (window.AUDIO) window.AUDIO.stopBGM();
    });
  }

  onPointerDown(pointer) {
    try {
      this.isPointerDown = true;
      this.lastInputTime = this.time.now;
      this.player.setTarget(pointer.x, pointer.y);
      if (window.AUDIO) window.AUDIO.swipe();
    } catch (e) { console.error('onPointerDown:', e); }
  }
  onPointerMove(pointer) {
    try {
      if (this.isPointerDown) {
        this.lastInputTime = this.time.now;
        this.player.setTarget(pointer.x, pointer.y);
      }
    } catch (e) { console.error('onPointerMove:', e); }
  }
  onPointerUp() { this.isPointerDown = false; }

  spawnCoin() {
    if (this.gameState !== 'playing') return;
    try {
      const margin = 60;
      const x = margin + Math.random() * (GAME_CONFIG.WIDTH - margin * 2);
      const y = margin + Math.random() * (GAME_CONFIG.HEIGHT - margin * 2);
      // プレイヤー近くは避ける
      if (Math.hypot(x - this.player.x, y - this.player.y) < 80) {
        return this.spawnCoin();
      }
      const coin = new Coin(this, x, y);
      coin.setDepth(5);
      this.coins.push(coin);
      // 12秒で消える
      this.time.delayedCall(12000, () => {
        const idx = this.coins.indexOf(coin);
        if (idx >= 0) {
          this.coins.splice(idx, 1);
          try { coin.destroyAll(); } catch (e) {}
        }
      });
    } catch (e) { console.error('spawnCoin:', e); }
  }

  spawnObstacle() {
    if (this.gameState !== 'playing') return;
    try {
      const margin = 60;
      const x = margin + Math.random() * (GAME_CONFIG.WIDTH - margin * 2);
      const y = margin + Math.random() * (GAME_CONFIG.HEIGHT - margin * 2);
      if (Math.hypot(x - this.player.x, y - this.player.y) < 100) {
        return this.spawnObstacle();
      }
      const obs = new Obstacle(this, x, y);
      obs.setDepth(6);
      this.obstacles.push(obs);
      // 最大5個まで
      if (this.obstacles.length > 5) {
        const old = this.obstacles.shift();
        try { old.destroy(); } catch (e) {}
      }
    } catch (e) { console.error('spawnObstacle:', e); }
  }

  update(time, delta) {
    if (this.gameState !== 'playing') return;

    try {
      this.player.update(time, delta);
      this.shadow.update(time, delta, this.player.trail);

      // 軌跡描画
      this.trailGfx.clear();
      this.trailGfx.lineStyle(2, GAME_CONFIG.COLORS.PLAYER, 0.4);
      const trail = this.player.trail;
      if (trail.length > 1) {
        this.trailGfx.beginPath();
        this.trailGfx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          this.trailGfx.lineTo(trail[i].x, trail[i].y);
        }
        this.trailGfx.strokePath();
      }

      // 障害物更新
      this.obstacles.forEach(o => o.update(time, delta));

      // スコア更新（時間ベース）
      const elapsedMs = time - this.startTime;
      const baseScore = Math.floor(elapsedMs / 100) * GAME_CONFIG.SCORE.PER_SECOND / 10;
      this.score = Math.floor(baseScore + this.coinCount * GAME_CONFIG.SCORE.COIN);

      // コンボ判定（影との距離）
      const distToShadow = Math.hypot(this.player.x - this.shadow.x, this.player.y - this.shadow.y);
      if (distToShadow > GAME_CONFIG.GAME.SAFE_DISTANCE) {
        if (time - this.lastSafeTime > GAME_CONFIG.GAME.COMBO_HOLD_MS) {
          if (this.comboMult < GAME_CONFIG.SCORE.COMBO_MULT_MAX) {
            this.comboMult++;
            this.lastSafeTime = time;
            if (window.AUDIO) window.AUDIO.combo();
            this.showFloatText(`COMBO x${this.comboMult}!`, GAME_CONFIG.WIDTH/2, 80, '#FFD700');
          }
        }
      } else {
        this.lastSafeTime = time;
      }

      // BGMテンポ（影が近いと速く）
      if (window.AUDIO) {
        const tempo = Phaser.Math.Clamp(2.0 - distToShadow / 200, 0.8, 2.0);
        window.AUDIO.setBGMTempo(tempo);
      }

      // 衝突判定: 影（グレース期間中はスキップ）
      if (time > this.graceUntil &&
          distToShadow < (GAME_CONFIG.PLAYER.RADIUS + GAME_CONFIG.SHADOW.RADIUS) * 0.7) {
        return this.gameOver({ reason: 'shadow' });
      }
      // グレース期間中の表示
      if (time <= this.graceUntil) {
        const remaining = Math.ceil((this.graceUntil - time) / 1000);
        if (!this._graceText || !this._graceText.scene) {
          this._graceText = this.add.text(GAME_CONFIG.WIDTH/2, GAME_CONFIG.HEIGHT/2 - 80, '', {
            fontSize: '36px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
          }).setOrigin(0.5).setDepth(40);
        }
        try { this._graceText.setText(`READY... ${remaining}`); } catch (e) { this._graceText = null; }
      } else if (this._graceText) {
        try { this._graceText.destroy(); } catch (e) {}
        this._graceText = null;
        this.showFloatText('GO!', GAME_CONFIG.WIDTH/2, GAME_CONFIG.HEIGHT/2 - 80, '#00F0FF');
      }

      // 衝突判定: コイン
      for (let i = this.coins.length - 1; i >= 0; i--) {
        const c = this.coins[i];
        if (Math.hypot(this.player.x - c.x, this.player.y - c.y) < GAME_CONFIG.PLAYER.RADIUS + c.radius) {
          this.coins.splice(i, 1);
          this.coinCount++;
          if (window.AUDIO) window.AUDIO.coin();
          this.showFloatText('+50', c.x, c.y, '#FFD700');
          // パーティクル
          for (let p = 0; p < 8; p++) {
            const angle = (p / 8) * Math.PI * 2;
            const particle = this.add.circle(c.x, c.y, 4, GAME_CONFIG.COLORS.COIN);
            this.tweens.add({
              targets: particle,
              x: c.x + Math.cos(angle) * 50,
              y: c.y + Math.sin(angle) * 50,
              alpha: 0,
              duration: 500,
              onComplete: () => particle.destroy()
            });
          }
          try { c.destroyAll(); } catch (e) {}
        }
      }

      // 衝突判定: 障害物
      for (const o of this.obstacles) {
        if (Math.hypot(this.player.x - o.x, this.player.y - o.y) < GAME_CONFIG.PLAYER.RADIUS + o.radius) {
          // ペナルティ：スコア半減 + ノックバック + 障害物消滅
          this.coinCount = Math.floor(this.coinCount / 2);
          if (window.AUDIO) window.AUDIO.death();
          this.cameras.main.shake(200, 0.01);
          this.showFloatText('OUCH! -SCORE', this.player.x, this.player.y - 30, '#FF3D6E');
          const idx = this.obstacles.indexOf(o);
          if (idx >= 0) this.obstacles.splice(idx, 1);
          try { o.destroy(); } catch (e) {}
          break;
        }
      }

      // 影との距離が近いとカメラシェイク
      if (distToShadow < 80) {
        this.cameras.main.shake(50, 0.003);
      }

      // UI更新
      this.scoreText.setText(`SCORE: ${this.score}`);
      const elapsed = Math.floor(elapsedMs / 1000);
      this.timeText.setText(`TIME: ${elapsed}s`);
      this.comboText.setText(this.comboMult > 1 ? `x${this.comboMult} COMBO` : '');

      // 5秒ごとマイルストーン演出
      if (elapsed > 0 && elapsed % 5 === 0 && elapsed !== this.lastMilestone) {
        this.lastMilestone = elapsed;
        this.showFloatText(`+${elapsed}s SURVIVED!`, GAME_CONFIG.WIDTH/2, GAME_CONFIG.HEIGHT/2 - 100, '#00F0FF');
        if (window.AUDIO) window.AUDIO.tick();
      }

    } catch (e) {
      console.error('update error:', e);
      this.gameOver({ reason: 'error', error: e.message });
    }
  }

  showFloatText(text, x, y, color = '#FFFFFF') {
    try {
      const t = this.add.text(x, y, text, {
        fontSize: '22px', color: color, fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(50);
      this.tweens.add({
        targets: t,
        y: y - 60,
        alpha: 0,
        duration: 1000,
        onComplete: () => t.destroy()
      });
    } catch (e) {}
  }

  gameOver(opts = {}) {
    if (this.gameState !== 'playing') return;
    this.gameState = 'gameover';
    try {
      this.player.isAlive = false;
      if (window.AUDIO) {
        window.AUDIO.death();
        window.AUDIO.stopBGM();
      }
      this.cameras.main.shake(400, 0.02);
      this.cameras.main.flash(200, 255, 80, 100);

      // プレイヤーの軌跡を保存（リプレイ用）
      const finalScore = this.score * this.comboMult;
      const playerTrail = this.player.trail.slice();
      const shadowFinalPos = { x: this.shadow.x, y: this.shadow.y };

      this.time.delayedCall(800, () => {
        this.scene.start('GameOverScene', {
          score: finalScore,
          time: Math.floor((this.time.now - this.startTime) / 1000),
          coins: this.coinCount,
          combo: this.comboMult,
          reason: opts.reason || 'shadow',
          playerTrail: playerTrail,
          shadowPos: shadowFinalPos
        });
      });
    } catch (e) {
      console.error('gameOver error:', e);
      this.scene.start('GameOverScene', { score: this.score, error: true });
    }
  }
}
