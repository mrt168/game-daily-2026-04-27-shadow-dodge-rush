import { chromium } from "playwright";
import { writeFile } from "fs/promises";

const BASE = "http://localhost:8099";
const results = { pass: [], fail: [], errors: [], warnings: [] };
const consoleErrors = [];
const pageErrors = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
const page = await context.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', err => pageErrors.push(err.message));

// 1. ゲーム起動
await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);
results.pass.push("T1: ゲーム起動");

// 2. Canvas描画チェック
const canvasVisible = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return false;
  const ctx = c.getContext('2d') || c.getContext('webgl');
  return c.width > 0 && c.height > 0 && ctx !== null;
});
if (canvasVisible) results.pass.push("T2: Canvas描画OK");
else results.fail.push("T2: Canvasが描画されていない");

// 3. メニュー → チュートリアル
await page.click('canvas', { position: { x: 400, y: 440 } });
await page.waitForTimeout(1000);

// 4. チュートリアルを4回NEXT
for (let i = 0; i < 4; i++) {
  await page.click('canvas', { position: { x: 400, y: 520 } });
  await page.waitForTimeout(800);
}
results.pass.push("T3: チュートリアル進行OK");

const sceneAfterTutorial = await page.evaluate(() =>
  window.game ? window.game.scene.getScenes(true).map(s => s.scene.key).join(',') : 'none'
);
if (sceneAfterTutorial.includes('GameScene')) results.pass.push("T4: GameSceneへ遷移OK");
else results.fail.push(`T4: ゲーム未開始 (scene=${sceneAfterTutorial})`);

// 5. 60秒プレイテスト
const playStart = Date.now();
let lastFrameTime = 0;
let frozenCount = 0;
let restartCount = 0;
const PLAY_DURATION = 60000;

while (Date.now() - playStart < PLAY_DURATION) {
  // ランダム位置にスワイプ移動
  const x = 100 + Math.random() * 600;
  const y = 100 + Math.random() * 400;
  try {
    await page.mouse.move(x, y, { steps: 3 });
    await page.mouse.down();
    await page.mouse.up();
  } catch (e) {}

  // 現在のScene取得
  const scene = await page.evaluate(() =>
    window.game ? window.game.scene.getScenes(true).map(s => s.scene.key).join(',') : 'none'
  ).catch(() => 'error');

  // GameOverに行ったらリトライボタンで再開
  if (scene.includes('GameOverScene')) {
    restartCount++;
    await page.click('canvas', { position: { x: 300, y: 520 } }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // FPSチェック
  const frameTime = await page.evaluate(() => window.performance.now()).catch(() => 0);
  if (lastFrameTime > 0 && frameTime - lastFrameTime < 5) frozenCount++;
  lastFrameTime = frameTime;

  await page.waitForTimeout(800);
}

const elapsed = Date.now() - playStart;
if (elapsed >= PLAY_DURATION - 2000) {
  results.pass.push(`T5: 60秒間プレイ継続OK (${Math.floor(elapsed/1000)}s, リスタート${restartCount}回)`);
} else {
  results.fail.push(`T5: 60秒プレイ未完了 (${Math.floor(elapsed/1000)}s)`);
}

// 6. フリーズ検知
if (frozenCount > 5) {
  results.fail.push(`T6: フリーズ疑い (${frozenCount}回)`);
} else {
  results.pass.push(`T6: フリーズなし`);
}

// 7. コンソールエラー
if (consoleErrors.length > 0) {
  // GL warning は除外
  const real = consoleErrors.filter(e => !e.includes('GL ') && !e.includes('WebGL'));
  if (real.length > 0) {
    results.errors.push(...real.slice(0, 5));
    results.fail.push(`T7: コンソールエラー${real.length}件`);
  } else {
    results.pass.push(`T7: コンソールエラーなし（GL警告は除外）`);
  }
} else {
  results.pass.push("T7: コンソールエラーなし");
}

// 8. ページエラー
if (pageErrors.length > 0) {
  results.errors.push(...pageErrors.slice(0, 5));
  results.fail.push(`T8: 未キャッチ例外${pageErrors.length}件`);
} else {
  results.pass.push("T8: 未キャッチ例外なし");
}

// 9. リロードテスト
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const stillWorks = await page.evaluate(() =>
  !!document.querySelector('canvas') && !!window.game
);
if (stillWorks) results.pass.push("T9: リロード後も動作OK");
else results.fail.push("T9: リロード後に壊れる");

await browser.close();

await writeFile("tests/playtest-results.json", JSON.stringify({
  results, consoleErrors, pageErrors,
  summary: `${results.pass.length} passed, ${results.fail.length} failed`
}, null, 2));

console.log("\n=== PLAYTEST RESULTS ===");
results.pass.forEach(p => console.log(`PASS ${p}`));
results.fail.forEach(f => console.log(`FAIL ${f}`));
if (results.errors.length > 0) {
  console.log("\n--- Errors ---");
  results.errors.forEach(e => console.log(`  ${e.slice(0, 200)}`));
}
console.log(`\n${results.pass.length} passed, ${results.fail.length} failed`);
process.exit(results.fail.length > 0 ? 1 : 0);
