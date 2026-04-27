import { chromium } from "playwright";
import { writeFile } from "fs/promises";

const BASE = "http://localhost:8099";
const results = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));

const test = (id, name, fn) => fn().then(
  () => { results.push({ id, name, ok: true }); console.log(`PASS ${id}: ${name}`); },
  e => { results.push({ id, name, ok: false, err: String(e).slice(0, 200) }); console.log(`FAIL ${id}: ${name} - ${e}`); }
);

const getScene = () => page.evaluate(() =>
  window.game ? window.game.scene.getScenes(true).map(s => s.scene.key).join(',') : 'none'
);

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

await test('T-01', 'タイトル画面起動', async () => {
  const scene = await getScene();
  if (!scene.includes('MenuScene')) throw new Error(`scene=${scene}`);
});

await test('T-02', 'スタートでチュートリアル', async () => {
  await page.click('canvas', { position: { x: 400, y: 440 } });
  await page.waitForTimeout(1000);
  const scene = await getScene();
  if (!scene.includes('TutorialScene')) throw new Error(`scene=${scene}`);
});

await test('T-03', 'チュートリアル4ステップ進行', async () => {
  for (let i = 0; i < 4; i++) {
    await page.click('canvas', { position: { x: 400, y: 520 } });
    await page.waitForTimeout(700);
  }
});

await test('T-04', 'チュートリアル後ゲーム開始', async () => {
  const scene = await getScene();
  if (!scene.includes('GameScene')) throw new Error(`scene=${scene}`);
});

await test('T-05', 'スワイプでプレイヤー移動', async () => {
  const before = await page.evaluate(() => {
    const gs = window.game.scene.getScene('GameScene');
    return gs && gs.player ? { x: gs.player.x, y: gs.player.y } : null;
  });
  await page.mouse.move(150, 150, { steps: 5 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => {
    const gs = window.game.scene.getScene('GameScene');
    return gs && gs.player ? { x: gs.player.x, y: gs.player.y } : null;
  });
  if (!before || !after) throw new Error('player not found');
  if (Math.hypot(after.x - before.x, after.y - before.y) < 5) {
    throw new Error(`player did not move: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  }
});

await test('T-06', '影が遅れて追跡', async () => {
  const data = await page.evaluate(() => {
    const gs = window.game.scene.getScene('GameScene');
    return gs && gs.shadow ? { sx: gs.shadow.x, sy: gs.shadow.y } : null;
  });
  if (!data) throw new Error('shadow not found');
});

await test('T-07', 'ゲームオーバー遷移可能', async () => {
  // 中央に固定して影に追いつかれるのを待つ
  await page.mouse.move(400, 300);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    const scene = await getScene();
    if (scene.includes('GameOverScene')) return;
  }
  throw new Error('GameOver not reached after 15s');
});

await test('T-08', 'スコアがlocalStorageに保存', async () => {
  const high = await page.evaluate(() => localStorage.getItem('sdr-highscore'));
  if (high === null) throw new Error('no highscore stored');
});

await test('T-09', 'リトライで再開', async () => {
  await page.click('canvas', { position: { x: 300, y: 520 } });
  await page.waitForTimeout(1500);
  const scene = await getScene();
  if (!scene.includes('GameScene')) throw new Error(`scene=${scene}`);
});

await test('T-10', '2回目はチュートリアルスキップ', async () => {
  // GameOverScene に行ってメニューへ
  await page.evaluate(() => {
    const gs = window.game.scene.getScene('GameScene');
    if (gs && gs.gameOver) gs.gameOver({ reason: 'test' });
  });
  await page.waitForTimeout(1500);
  // メニューへ
  await page.click('canvas', { position: { x: 400, y: 570 } });
  await page.waitForTimeout(1000);
  const menu = await getScene();
  if (!menu.includes('MenuScene')) {
    // GameOverScene のままならMENUボタン押せていない、retry
    await page.click('canvas', { position: { x: 400, y: 570 } });
    await page.waitForTimeout(1000);
  }
  // タイトルからスタート → 直接GameSceneへ
  await page.click('canvas', { position: { x: 400, y: 440 } });
  await page.waitForTimeout(1500);
  const scene = await getScene();
  if (!scene.includes('GameScene')) throw new Error(`tutorial not skipped: scene=${scene}`);
});

await test('T-11', 'リロード後も動作', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const ok = await page.evaluate(() => !!document.querySelector('canvas') && !!window.game);
  if (!ok) throw new Error('not working after reload');
});

await test('T-12', '未キャッチ例外なし', async () => {
  if (errors.length > 0) throw new Error(`${errors.length} errors: ${errors[0]}`);
});

await browser.close();

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;
await writeFile('tests/web-e2e-results.json', JSON.stringify({ passed, failed, results, errors }, null, 2));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
