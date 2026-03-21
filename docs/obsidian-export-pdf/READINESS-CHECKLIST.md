# Obsidian Export PDF - Readiness Checklist

对标参考：`/Users/king/Documents/md-to-pdf`

目标不是复制一个通用 Markdown→PDF CLI，而是评估这套内部工具在 **Obsidian-aware / 中文友好 / 导出质量优先** 这个方向上离公开版还有多远。

---

## 一、已领先 / 已有明显差异化优势

### 1. Obsidian 语义支持
当前内部版已经补了：
- `[[note]]`
- `[[note#heading]]`
- `[[note#^block]]`
- `![[note]]`
- `![[note#heading]]`
- `![[note#^block]]`
- callouts
- footnotes
- task list
- MathJax 本地渲染
- Dataview / DataviewJS 占位展示

`md-to-pdf` 本质上还是通用 Markdown 工具，没有这层 Obsidian-aware 语义。

### 2. 真实笔记导出质量导向
这套工具已经针对真实内容踩过并修过：
- embeds 递归/分页/视觉层次
- display math 居中与样式
- callout 内 code block
- code inline / block 样式边界
- print 右侧边框裁切
- 中文图文混排

这类“真实导出经验”本身就是优势。

### 3. 中文/研究型笔记适配
当前调优明显更贴近：
- 中文技术长文
- 研究笔记
- 图文论文阅读笔记
- Obsidian 风格知识库文档

---

## 二、已接近 / 只差工程化包装

### 1. 浏览器打印主链
我们当前也是：
- Markdown → HTML
- 浏览器 print → PDF

这条主线和 `md-to-pdf` 在大的技术方向上是同类的，只是我们目前是 Edge headless print，而对方是 Puppeteer/Chromium。

### 2. 公式能力
`md-to-pdf` README 里把 MathJax 作为可实现路径。
我们已经把 MathJax SVG 真接进主线，数学本身不虚。

### 3. 样式可继续产品化
现在虽然还没做成完整主题系统，但已有：
- 一套 print CSS
- fixtures 回归
- 真实笔记验收

继续收敛后，完全能形成公开可展示的视觉风格。

---

## 三、明显落后 / 公开版前必须补

### 1. CLI 完整度
当前内部版还缺：
- 正经参数解析
- `--help`
- 配置文件
- frontmatter config
- 输出参数的系统化定义
- 更明确的错误码和提示

### 2. 项目工程化
还缺：
- 更正式的 package 结构
- 安装/运行说明
- 测试脚本体系
- 版本管理
- LICENSE
- example outputs / screenshots

### 3. 通用能力
相比 `md-to-pdf`，我们还缺：
- header/footer
- page break 机制
- watch mode
- 多文件/批量 UX
- API 形态
- 外部 stylesheet/config 扩展能力
- 代码高亮主题切换

### 4. 日志与稳定性打磨
虽然主链现在稳定了，但公开版之前还应继续处理：
- 临时目录/日志的可控性
- timeout / cleanup 的用户可见行为
- 失败时更友好的定位信息

---

## 四、最值得优先补的 5 项

### P1. 正式 CLI 参数层
至少补：
- `--output`
- `--keep-temp`
- `--debug-html`
- `--fixture`
- `--paper-size`
- `--help`

原因：这是从“内部脚本”变“工具”的第一步。

### P2. Config / frontmatter 支持
当前已补一版 **markdown frontmatter**（轻量 key-value 形式），已可覆盖：
- `title`
- `paper-size`
- `margin`
- `print-background`
- `extra-css`

仍可继续补：
- 独立 config file
- 更完整 YAML / 嵌套配置
- CLI 与 frontmatter 的优先级文档

### P3. README + 示例截图 + 对比案例
要公开，就必须让人一眼看懂：
- 解决什么问题
- 和通用 md-to-pdf 有什么区别
- 输出效果长什么样

### P4. header/footer/page break
这块是通用 PDF 工具的标配能力。
不一定一口气做全，但至少要给：
- page break class
- 简单 header/footer 模板

### P5. 更系统的测试/验收脚本
现在有 fixtures，但还可以再补：
- 统一测试命令
- 真实样本回归说明
- 关键场景 checklist

---

## 五、公开版 readiness 判断

### 现在还不适合直接公开成“成熟产品”
原因：
- CLI 能力不完整
- 配置层不完整
- 文档和工程化包装不足
- 缺少清晰的外部使用路径

### 但已经适合进入“公开版准备阶段”
也就是：
- 差异化定位明确
- 主链已稳定
- 核心功能已成型
- 有真实样本和 fixtures 支撑

---

## 六、建议的公开定位

不要定位成：
- “another md-to-pdf”
- “通用 Markdown PDF CLI”

建议定位成：
- **Obsidian-aware Markdown to PDF exporter**
- **Export Obsidian-style notes to high-quality PDFs**
- **Browser-print-based PDF export for Obsidian-flavored notes**

---

## 七、结论

一句话：

> 在“通用 Markdown CLI 完整度”上，我们还没追上 `md-to-pdf`；
> 但在“Obsidian-aware 导出体验”上，这套工具已经有明确差异化优势，而且值得继续推成公开版。
