# Dice & Decay 🎲

骰子 Roguelike × 打寶（ARPG loot）的手機網頁原型。靈感來自 **Dice of Kalma**（Yahtzee + Balatro 的骰子 Roguelike）與 **Path of Exile 2** 的打寶系統。

## 核心玩法

- **擲骰湊牌型**：擲骰 → 鎖定 → 重骰 → 湊出最好的牌型，分數 = 底分 × 倍率
- **骰子即裝備**：每顆骰子有稀有度，每一面是可帶詞綴的槽
- **打寶迴圈**：過關掉骰子與改造石，越深掉得越好；每 5 關一場 Boss
- **合成系統**：重塑詞綴、刻紋改點數、增減面數、提升稀有度、調整骰組上限
- **存檔**：進度存在瀏覽器 IndexedDB

## 開發

```bash
npm install
npm run dev      # 本機開發 http://localhost:5173
npm run build    # 產生 dist/
```

技術棧：Vite + React + TypeScript + Zustand，存檔用 idb-keyval。

## 部署

推到 `main` 會自動透過 GitHub Actions 部署到 GitHub Pages。
