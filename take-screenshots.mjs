import { chromium } from "playwright";
import { mkdir } from "fs/promises";

await mkdir("screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
const page = await context.newPage();

page.on('console', msg => console.log('[console]', msg.type(), msg.text().slice(0, 200)));
page.on('pageerror', err => console.log('[pageerror]', err.message));

// チュートリアル状態をスキップしておく（メニューから直接ゲーム）
await page.addInitScript(() => {
  // 1回目はチュートリアル経由、2回目はskip
});
await page.goto("http://localhost:8099", { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(3500);

const getScene = async () => await page.evaluate(() => {
  const g = window.game;
  if (!g) return 'none';
  return g.scene.getScenes(true).map(s => s.scene.key).join(',');
});

console.log('Scene:', await getScene());

// 01: タイトル画面
await page.screenshot({ path: "screenshots/01-title.png" });

// メニューでスタートボタンをタップ
await page.click('canvas', { position: { x: 400, y: 440 } });
await page.waitForTimeout(1500);
console.log('After start tap, scene:', await getScene());
await page.screenshot({ path: "screenshots/02-tutorial-1.png" });

// チュートリアルでNEXTボタンを押す（y=520）
await page.click('canvas', { position: { x: 400, y: 520 } });
await page.waitForTimeout(1000);
console.log('After NEXT 1, scene:', await getScene());
await page.screenshot({ path: "screenshots/03-tutorial-2.png" });

await page.click('canvas', { position: { x: 400, y: 520 } });
await page.waitForTimeout(1000);
console.log('After NEXT 2, scene:', await getScene());

await page.click('canvas', { position: { x: 400, y: 520 } });
await page.waitForTimeout(1000);
console.log('After NEXT 3, scene:', await getScene());
await page.screenshot({ path: "screenshots/04-tutorial-final.png" });

// PLAYボタン
await page.click('canvas', { position: { x: 400, y: 520 } });
await page.waitForTimeout(2000);
console.log('After PLAY, scene:', await getScene());
await page.screenshot({ path: "screenshots/05-gameplay-1.png" });

// プレイ：マウスでスワイプ
for (let i = 0; i < 15; i++) {
  const x = 200 + Math.sin(i * 0.4) * 200;
  const y = 300 + Math.cos(i * 0.4) * 150;
  await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "screenshots/06-gameplay-2.png" });

// さらにプレイ
for (let i = 0; i < 15; i++) {
  const x = 100 + Math.random() * 600;
  const y = 100 + Math.random() * 400;
  await page.mouse.move(x, y, { steps: 3 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(350);
}
await page.screenshot({ path: "screenshots/07-gameplay-3.png" });
console.log('Mid-play scene:', await getScene());

// 中央停止でゲームオーバーを誘発
await page.mouse.move(400, 300);
await page.waitForTimeout(8000);
await page.screenshot({ path: "screenshots/08-gameover.png" });
console.log('Final scene:', await getScene());

await browser.close();
console.log("DONE");
