class ScoreManager {
  static getHighScore() {
    try {
      return parseInt(localStorage.getItem(GAME_CONFIG.STORAGE.HIGHSCORE) || '0', 10);
    } catch (e) { return 0; }
  }
  static setHighScore(score) {
    try { localStorage.setItem(GAME_CONFIG.STORAGE.HIGHSCORE, String(score)); } catch (e) {}
  }
  static isTutorialDone() {
    try { return localStorage.getItem(GAME_CONFIG.STORAGE.TUTORIAL_DONE) === 'true'; }
    catch (e) { return false; }
  }
  static setTutorialDone() {
    try { localStorage.setItem(GAME_CONFIG.STORAGE.TUTORIAL_DONE, 'true'); } catch (e) {}
  }
}
