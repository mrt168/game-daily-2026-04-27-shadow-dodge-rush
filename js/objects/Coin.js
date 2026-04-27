class Coin extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    this.radius = 16;

    this.glow = scene.add.circle(0, 0, 22, GAME_CONFIG.COLORS.COIN, 0.3);
    this.add(this.glow);

    if (scene.textures.exists('coin')) {
      this.sprite = scene.add.image(0, 0, 'coin').setDisplaySize(34, 34);
    } else {
      this.sprite = scene.add.star(0, 0, 5, 8, 16, GAME_CONFIG.COLORS.COIN);
    }
    this.add(this.sprite);

    this.tween = scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2500,
      repeat: -1
    });
    scene.tweens.add({
      targets: this.glow,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  destroyAll() {
    if (this.tween) this.tween.stop();
    this.destroy();
  }
}
