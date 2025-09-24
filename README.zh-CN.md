[English](README.md) | [中文](README.zh-CN.md)

# @kooix/carta-mcp

`@kooix/carta-mcp` 是一套 Model Context Protocol (MCP) 服务器，实现了统一的“卡片”索引与受控编辑流程，便于 Codex CLI、Claude Code、Gemini CLI、OpenCode 等客户端解析代码仓库元数据并在标注区块内修改文件。

## 功能亮点
- **卡片扫描**：递归解析 `@SFC`（单文件卡片）与 `@DFC`（目录卡片）的 YAML 头部信息，并捕获 `LLM-EDIT` 标记块及其行号、内容哈希。
- **乐观锁补丁**：基于块内哈希比对和边界校验，确保写入操作安全、可回滚，并保持换行风格一致。
- **读取审计**：默认写入 JSONL 读取日志；可选安装 `better-sqlite3` 后切换到 SQLite 存储。
- **只读模式**：通过 `--read-only` 参数关闭写操作，仍可提供扫描与读取功能。
- **TypeScript 实现**：基于 MCP 官方 SDK 的 stdio 传输协议，提供 CLI 启动入口，易于集成。

## 安装
1. 访问 [GitHub Releases](https://github.com/telagod/kooix-carta/releases)，下载最新的 `kooix-carta-mcp-*.tgz` 资产。
2. 本地安装该压缩包：
   ```bash
   npm install /path/to/kooix-carta-mcp-x.y.z.tgz
   # 或直接引用发布资源 URL
   npm install https://github.com/telagod/kooix-carta/releases/download/vx.y.z/kooix-carta-mcp-x.y.z.tgz
   ```
3. 若需开启 SQLite 审计模式，可额外安装：
   ```bash
   npm install better-sqlite3 --save-optional
   ```

## 命令行用法
```bash
npx @kooix/carta-mcp serve --root . --audit jsonl
```

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--root <dir>` | 当前目录 | 向客户端暴露的工作空间根目录 |
| `--audit <jsonl|sqlite|none>` | `jsonl` | 读取审计日志去向；SQLite 需安装可选依赖 |
| `--read-only` | `false` | 阻止 `edits.apply` 写操作 |

示例：注册到 Claude Code 的本地 MCP 配置：
```bash
claude mcp add kooix-carta -- npx -y @kooix-carta-mcp serve --root .
```

## MCP 工具接口
### `cards.scan`
- **用途**：扫描仓库中的卡片与编辑块。
- **入参**：`root` / `include` / `exclude` 可选。
- **出参**：文件路径、SFC/DFC 状态、块起止行、文件哈希、块哈希等。

### `cards.get`
- **用途**：返回指定文件的 `@SFC` / `@DFC` 原始 YAML 片段及文件哈希。
- **入参**：`{ "path": "相对路径" }`
- **出参**：`{ path, sha256, sfc?, dfc? }`

### `edits.apply`
- **用途**：在 `LLM-EDIT` 块内替换正文，校验旧哈希确保一致性。
- **入参**：`file`、`blockId`、`oldHash`、`newContent`、`reason?`。
- **错误码**：`BOUNDARY_NOT_FOUND`、`STALE_BLOCK`、`OUT_OF_BOUND_WRITE`、`READ_ONLY_MODE`。

### `io.readlog.append`
- **用途**：记录客户端读取文件的哈希信息，用于审计。
- **入参**：`{ runId, path, sha256 }`

## 编辑块约定
在可编辑区域使用注释包裹，例如：
```ts
/* LLM-EDIT:BEGIN handler-body */
// 可编辑内容
/* LLM-EDIT:END handler-body */
```
服务端会自动去除块尾空行、统一换行符，并保持原始文件的行结尾格式。

## 审计模式
- `jsonl`：写入 `.kooix/logs/readlog.jsonl`。
- `sqlite`：写入 `.kooix/logs/readlog.sqlite`（需 `better-sqlite3`）。
- `none`：关闭读取审计。

## 开发流程
```bash
cd packages/kooix-carta-mcp
npm ci
npm run build
npm test
```
项目要求 Node.js ≥ 18.18，TypeScript `moduleResolution: NodeNext`。

## 持续集成
- `.github/workflows/ci.yml`：在 push / PR 时执行安装、构建、测试。
- `.github/workflows/release.yml`：由 `v*` 标签 push、GitHub Release 或手动触发，自动打包并将 `npm pack` 产物上传到 Release 或工作流产物中。

## 发布流程
1. 更新 `packages/kooix-carta-mcp/package.json` 中的版本号。
2. 提交代码并创建标签：`git tag vX.Y.Z`。
3. 推送标签或在 GitHub 中创建 Release。
4. 工作流会自动生成 `npm pack` 压缩包并附加到 Release，使用者可直接下载安装。

## 许可证
MIT
