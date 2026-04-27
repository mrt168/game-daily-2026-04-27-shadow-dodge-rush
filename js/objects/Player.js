class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    // グロウ円（背景）
    this.glow = scene.add.circle(0, 0, 28, GAME_CONFIG.COLORS.PLAYER, 0.3);
    this.add(this.glow);

    // PNG sprite if loaded, else fallback graphic circle
    if (scene.textures.exists('player')) {
      this.sprite = scene.add.image(0, 0, 'player').setDisplaySize(GAME_CONFIG.PLAYER.DISPLAY_SIZE, GAME_CONFIG.PLAYER.DISPLAY_SIZE);
    } else {
      this.sprite = scene.add.circle(0, 0, GAME_CONFIG.PLAYER.RADIUS, GAME_CONFIG.COLORS.PLAYER);
    }
    this.add(this.sprite);

    this.vx = 0;
    this.vy = 0;
    this.targetX = x;
    this.targetY = y;
    this.trail = []; // { x, y, t }
    this.isAlive = true;

    // パルスアニメ
    scene.tweens.add({
      targets: this.glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  update(time, delta) {
    if (!this.isAlive) return;

    // ターゲットへの加速
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      const angle = Math.atan2(dy, dx);
      const accel = GAME_CONFIG.PLAYER.ACCEL * (delta / 1000);
      this.vx += Math.cos(angle) * accel;
      this.vy += Math.sin(angle) * accel;
    } else {
      // ドラッグ
      const drag = GAME_CONFIG.PLAYER.DRAG * (delta / 1000);
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > 0) {
        const newSpeed = Math.max(0, speed - drag);
        const ratio = newSpeed / speed;
        this.vx *= ratio;
        this.vy *= ratio;
      }
    }

    // 速度制限
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > GAME_CONFIG.PLAYER.MAX_SPEED) {
      const ratio = GAME_CONFIG.PLAYER.MAX_SPEED / speed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // 位置更新
    this.x += this.vx * (delta / 1000);
    this.y += this.vy * (delta / 1000);

    // 画面端でクランプ
    const r = GAME_CONFIG.PLAYER.RADIUS;
    if (this.x < r) { this.x = r; this.vx = 0; }
    if (this.x > GAME_CONFIG.WIDTH - r) { this.x = GAME_CONFIG.WIDTH - r; this.vx = 0; }
    if (this.y < r) { this.y = r; this.vy = 0; }
    if (this.y > GAME_CONFIG.HEIGHT - r) { this.y = GAME_CONFIG.HEIGHT - r; this.vy = 0; }

    // 軌跡記録（最大250点で古いものから削除）
    this.trail.push({ x: this.x, y: this.y, t: time });
    if (this.trail.length > 250) this.trail.shift();
  }

  setTarget(x, y) {
    this.targetX = Phaser.Math.Clamp(x, 0, GAME_CONFIG.WIDTH);
    this.targetY = Phaser.Math.Clamp(y, 0, GAME_CONFIG.HEIGHT);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.targetX = x;
    this.targetY = y;
    this.trail = [];
    this.isAlive = true;
  }
}
