# 技術設計書: シャドウダッシュ

## 技術スタック
- Phaser 3.x（CDN読み込み、npm不要）
- Vanilla JavaScript（ES6+）
- HTML5 Canvas（800x600）
- Web Audio API（プログラム生成サウンド）
- localStorage（ハイスコア・チュートリアル状態）

## ファイル構成
```
shadow-dodge-rush/
  index.html              # エントリーポイント（Phaser CDN読込）
  style.css               # 最小CSS
  js/
    config.js             # Phaser設定、ゲーム定数
    main.js               # ゲーム起動、Scene登録
    scenes/
      BootScene.js        # アセット読み込み
      MenuScene.js        # タイトル画面
      TutorialScene.js    # チュートリアル
      GameScene.js        # メインゲーム
      GameOverScene.js    # リザルト・スコア共有
    objects/
      Player.js           # プレイヤー
      Shadow.js           # 影（軌跡トレース）
      Coin.js             # コイン
      Obstacle.js         # 障害物
    utils/
      AudioManager.js     # SE生成
      ScoreManager.js     # スコア・ハイスコア管理
  assets/
    images/
      player.png
      shadow.png
      coin.png
      obstacle.png
      background.png
      logo.png
      icon.png
```

## Scene設計

### BootScene
- 全アセット（PNG）読み込み
- ロード完了後、MenuScene に遷移

### MenuScene
- ロゴ表示
- 「タップで開始」テキスト
- ハイスコア表示
- 初回プレイなら TutorialScene へ、2回目以降は GameScene へ
- 「?」ボタンでチュートリアル再生

### TutorialScene
- 4ステップの段階的説明
  - Step 1: 「画面をスワイプしてキャラを動かそう！」（実際にスワイプさせる）
  - Step 2: 「影が遅れて追いかけてくる」（観察）
  - Step 3: 「影に触れたらゲームオーバー！」（観察）
  - Step 4: 「準備OK？タップでスタート！」（タップで開始）
- 完了後 localStorage に `tutorial_done=true`

### GameScene
- メインゲームループ
- プレイヤー、影、コイン、障害物の更新
- スコア、生存時間、コンボ表示
- 影との接触で GameOverScene へ
- 5秒ごとに小演出（"+5s SURVIVED!"）

### GameOverScene
- スコア・ハイスコア表示
- プレイヤーと影の軌跡をリプレイ表示
- 「リトライ」「シェア」ボタン
- シェアボタン: Canvas画像を生成しSNSシェア（Twitter Web Intent）

## ゲームオブジェクト設計

### Player
```js
{
  x, y: number,           // 現在座標
  velocityX, velocityY: number,
  trail: Array<{x, y, t}>,  // 軌跡（FIFO、最大100点）
  speed: 5,
  isAlive: true,
  update(): // スワイプ入力で移動
}
```

### Shadow
```js
{
  x, y: number,
  followDelay: 500ms,    // 0.5秒遅延
  speedMultiplier: 0.4,  // 初期0.4、徐々に上昇
  update(player.trail): // 0.5秒前のプレイヤー位置に追従
}
```

### Coin
- ランダム位置に出現
- 取得で +50 点、パーティクル演出

### Obstacle
- 10秒経過後にランダム出現
- 接触でスコア半減（即死ではない）

## 入力処理
- Phaser pointer 入力
- pointerdown → pointermove → pointerup でスワイプ検出
- スワイプ方向にプレイヤーを加速

## 衝突判定
- プレイヤー vs 影: 距離 < 半径合計 → ゲームオーバー
- プレイヤー vs コイン: 距離 < 半径合計 → 取得
- プレイヤー vs 障害物: 距離 < 半径合計 → ペナルティ

## フリーズ防止対策
- 全イベントハンドラに try/catch
- update() は軽量に（trail は最大100点でカット）
- Scene遷移時は `time.removeAllEvents()`, `tweens.killAll()`, `input.removeAllListeners()`
- 最大プレイ時間180秒で強制終了
- window.onerror で例外キャッチ → GameOverScene 強制遷移
