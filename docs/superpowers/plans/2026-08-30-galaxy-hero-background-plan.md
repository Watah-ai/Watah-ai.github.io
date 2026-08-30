# Galaxy 首頁背景實作計畫

1. 安裝 `three` 與 TypeScript 型別，維持現有 Vinext／React 架構。
2. 新增 client-only `GalaxyBackground`，集中管理 WebGLRenderer、Scene、Camera、BufferGeometry、ShaderMaterial、動畫影格、resize、visibility 與 context-lost 事件。
3. 以穩定亂數建立星臂、核心、吸積盤及遠方星點屬性；在 vertex shader 中依半徑計算差速旋轉、漂移與擾動，在 fragment shader 中繪製柔光圓形粒子與閃爍。
4. 依觸控、視窗寬度與裝置記憶體選擇粒子數與 pixel ratio；`prefers-reduced-motion` 時只渲染靜態畫格。
5. 將首頁 Hero 抽為獨立元件，使用全版深色背景、左側文字、右側 Galaxy、遮罩、CTA 與由市場資料動態計算的統計數字。
6. 讓首頁採深色導覽，其他頁面保留既有淺色導覽與內容；Canvas 使用 `pointer-events: none`，不影響按鈕。
7. 加入 CSS 降級背景，WebGL 初始化或 context 失敗時仍可完成首購流程。
8. 執行正式建置與 lint，啟動本機預覽後驗證首頁、問卷、範例報告、市場資料與方法頁。
9. 以瀏覽器檢查桌面與手機 viewport、主控台錯誤、resize、減少動態與返回首頁後的資源生命週期。
10. 建立新 Sites 版本並發布，不修改版本 2 的資料與推薦邏輯。
