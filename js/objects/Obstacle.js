class Obstacle extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    this.radius = 18;

    this.glow = scene.add.circle(0, 0, 26, GAME_CONFIG.COLORS.OBSTACLE, 0.35);
    this.add(this.glow);

    if (scene.textures.exists('obstacle')) {
      this.sprite = scene.add.image(0, 0, 'obstacle').setDisplaySize(40, 40);
    } else {
      this.sprite = scene.add.circle(0, 0, this.radius, GAME_CONFIG.COLORS.OBSTACLE);
    }
    this.add(this.sprite);

    this.vx = (Math.random() * 2 - 1) * 60;
    this.vy = (Math.random() * 2 - 1) * 60;

    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 3000,
      repeat: -1
    });
  }

  update(time, delta) {
    this.x += this.vx * (delta / 1000);
    this.y += this.vy * (delta / 1000);
    if (this.x < this.radius || this.x > GAME_CONFIG.WIDTH - this.radius) this.vx *= -1;
    if (this.y < this.radius || this.y > GAME_CONFIG.HEIGHT - this.radius) this.vy *= -1;
    this.x = Phaser.Math.Clamp(this.x, this.radius, GAME_CONFIG.WIDTH - this.radius);
    this.y = Phaser.Math.Clamp(this.y, this.radius, GAME_CONFIG.HEIGHT - this.radius);
  }
}
