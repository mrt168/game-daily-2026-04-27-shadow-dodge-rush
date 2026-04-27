// グローバルエラーハンドラ
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error || e.message);
  try {
    if (window.game && window.game.scene.isActive('GameScene')) {
      window.game.scene.stop('GameScene');
      window.game.scene.start('GameOverScene', { score: 0, error: true });
    }
  } catch (err) {}
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0A0E27',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
  },
  fps: { target: 60, forceSetTimeOut: false },
  render: { antialias: true, pixelArt: false },
  scene: [BootScene, MenuScene, TutorialScene, GameScene, GameOverScene]
};

window.game = new Phaser.Game(config);

// 入力フォーカス維持
window.addEventListener('focus', () => {
  try { if (window.AUDIO) window.AUDIO.resume(); } catch (e) {}
});
