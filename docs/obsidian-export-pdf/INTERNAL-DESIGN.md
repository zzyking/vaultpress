# Obsidian Export PDF - Internal Design

## 背景

目标：把 Obsidian 风格 Markdown（含部分 Obsidian 语法）导出为**视觉上接近阅读视图**的 PDF，并且尽量稳定、可回归、可维护。

## 最终路线

当前主线：

1. Markdown / Obsidian note
2. `lib/export_note_to_html.js` 预处理为 HTML
3. Microsoft Edge headless `--print-to-pdf`
4. 输出 PDF

## 为什么选这条路

### 为什么不是 Swift/WebKit

尝试过：
- `WKWebView.createPDF`
- `NSPrintOperation`
- Swift 脚本/解释执行桥接

问题：
- 分页行为不符合预期
- 容易出现裁剪/一页长卷
- 在当前执行环境下有卡死风险
- 实测出现过残留 Swift/WebKit 进程，导致严重 swap 压力

结论：废弃。

### 为什么不是 WeasyPrint

尝试过 `weasyprint`。

优点：
- 是更“正统”的 HTML/CSS → PDF 引擎
- print CSS 支持强

问题：
- 对当前这批中文/混排/Obsidian 风格内容，**视觉编排不如 Edge**
- 实际导出观感不如浏览器打印链

结论：保留作备选，不作默认。

### 为什么选 Edge

优点：
- 真实浏览器打印链
- 对中文、混排、图片、阅读型版式，实际效果更好
- 最终产物观感优于 WeasyPrint

缺点：
- 需要清理 headless 残留
- 日志和退出要额外处理

结论：当前默认后端。

## 预处理器职责

`export_note_to_html.js` 负责：

- 基础 Markdown → HTML
- Obsidian 语法兼容：
  - `[[note]]`
  - `[[note#heading]]`
  - `[[note#^block]]`
  - `![[note]]`
  - `![[note#heading]]`
  - `![[note#^block]]`
- callout 渲染
- block / heading anchor
- footnotes
- task list 样式修正
- MathJax 本地公式渲染
- Dataview / DataviewJS 占位展示（不执行）

## 已知限制

- 不是完整 Obsidian renderer
- 不执行 Dataview，只展示源码块
- 不保证所有插件语法
- 复杂主题 / 自定义 CSS 不会 1:1 复刻
- 数学公式当前使用 MathJax SVG，本地稳定但仍可能有极端 TeX 兼容边角

## 测试策略

使用 fixtures 做回归：

- `fixtures/`

覆盖：
- basic layout
- links / anchors
- embeds
- callouts
- print stress
- extensions

回归脚本：
- `bin/vaultpress-fixtures`
- 或 `lib/export_fixtures.sh`

## 后续优先级

1. Edge cleanup/logging 更干净
2. 样式继续向 Obsidian 阅读视图靠拢
3. 更多 fixture
4. 参数化（timeout / paper size / keep-temp）
5. 若未来公开，再补 README / LICENSE / examples / known issues
