class Shadow extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.aura = scene.add.circle(0, 0, 30, GAME_CONFIG.COLORS.SHADOW, 0.4);
    this.add(this.aura);

    if (scene.textures.exists('shadow')) {
      this.sprite = scene.add.image(0, 0, 'shadow').setDisplaySize(GAME_CONFIG.SHADOW.DISPLAY_SIZE, GAME_CONFIG.SHADOW.DISPLAY_SIZE);
      this.sprite.setAlpha(0.85);
    } else {
      this.sprite = scene.add.circle(0, 0, GAME_CONFIG.SHADOW.RADIUS, GAME_CONFIG.COLORS.SHADOW);
    }
    this.add(this.sprite);

    this.speedMultiplier = GAME_CONFIG.SHADOW.INITIAL_SPEED_MULT;
    this.elapsedSec = 0;
  }

  update(time, delta, playerTrail) {
    if (!playerTrail || playerTrail.length === 0) return;

    this.elapsedSec += delta / 1000;

    // 0.5秒前のプレイヤー位置を取得
    const targetTime = time - GAME_CONFIG.SHADOW.DELAY_MS;
    let target = playerTrail[0];
    for (let i = playerTrail.length - 1; i >= 0; i--) {
      if (playerTrail[i].t <= targetTime) {
        target = playerTrail[i];
        break;
      }
    }

    // 影の速度倍率（時間で上昇）
    const mult = GAME_CONFIG.SHADOW.INITIAL_SPEED_MULT +
      Math.floor(this.elapsedSec / 10) * GAME_CONFIG.SHADOW.SPEED_INCREASE_PER_10S;
    this.speedMultiplier = Math.min(1.2, mult);

    // ターゲットへ滑らかに追従（速度倍率に応じてラープ係数を調整）
    const lerp = Math.min(1, 0.08 * this.speedMultiplier * (delta / 16));
    this.x = Phaser.Math.Linear(this.x, target.x, lerp);
    this.y = Phaser.Math.Linear(this.y, target.y, lerp);

    // 距離に応じてオーラ強さ変化
    if (target) {
      const dist = Math.hypot(this.x - target.x, this.y - target.y);
      const intensity = Phaser.Math.Clamp(1 - dist / 200, 0.3, 0.9);
      this.aura.setAlpha(intensity);
    }
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.elapsedSec = 0;
    this.speedMultiplier = GAME_CONFIG.SHADOW.INITIAL_SPEED_MULT;
  }
}
