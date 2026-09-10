# TFT 裝備閃卡 · Set 18 / Patch 18.2

行動優先的雲頂之弈核心裝備合成練習：測驗模式 + 閃卡模式。僅含經典 8 元件、36 組合成（不含金鏟鏟、平底鍋、光明版、神器、紋章）。

## 功能

- **測驗模式**：顯示兩個基礎元件 → 選擇成裝名稱與主要效果（各 3–4 選項），即時回饋；答錯進入重練佇列
- **閃卡模式**：正面元件組合，點擊翻面顯示中文名稱與主要效果
- 進度存於 `localStorage`
- 深色簡潔 UI、大觸控目標、單欄、適配 375px 寬度

## 本機開發

```bash
npm i
npm run dev
```

建置：

```bash
npm run build
npm run preview
```

## GitHub Pages

目前以 **`docs/`**（`npm run build` 產物）從 `main` 分支部署。

線上網址：https://jadezzz.github.io/tft-item-flashcards/

若要改為 Actions 部署：

1. 將 `.github/workflows/deploy.yml` 加入 repo（需有 `workflow` OAuth scope 才能 push 工作流檔）
2. Settings → Pages → Source = **GitHub Actions**
3. 推送 `main` 後由 workflow 建置並部署（可刪除 `docs/`）

Vite `base` 已設為 `/tft-item-flashcards/`。

更新 `docs/` 靜態站：

```bash
npm run build && rm -rf docs && mkdir docs && cp -r dist/* docs/
```

## 資料

裝備資料：`src/data/items-18.2.json`（patch 18.2 關鍵被動摘要，36 組）。
