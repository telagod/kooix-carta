# @kooix/carta-mcp

[English](README.md) | [中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node->=18.18-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

**@kooix/carta-mcp** 是一个 [模型上下文协议 (MCP)](https://modelcontextprotocol.io) 服务器，为项目提供智能文件发现和受控编辑功能。它通过"卡片"提供标准化的项目元数据访问，并支持在带注释的代码区域进行安全的、有界限的编辑。

## ✨ 功能特色

- 🔍 **智能发现** - 自动扫描 `@SFC`（单文件）和 `@DFC`（目录）元数据卡片
- ✏️ **安全编辑** - 在 `LLM-EDIT` 块内进行带哈希验证的受控编辑
- 🤖 **智能生成** - 开发过程中智能生成缺失的卡片，渐进完善项目
- 📊 **审计日志** - 支持 JSONL 或 SQLite 格式的文件访问追踪
- 🔒 **只读模式** - 通过禁写模式保护生产环境
- 🎯 **TypeScript 原生** - 完全类型化，全面集成 SDK
- ⚡ **零安装** - 直接从 GitHub 发布版本运行，使用 npx

## 🚀 快速开始

### 从 GitHub Packages 安装（推荐）

直接从 GitHub 的 npm 仓库安装：

```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
npx carta-mcp serve --root . --audit jsonl
```

或者配置 npm 为此作用域使用 GitHub Packages：

```bash
npm config set @kooix:registry https://npm.pkg.github.com
npm install @kooix/carta-mcp@latest
npx carta-mcp serve --root . --audit jsonl
```

### 一次性运行（备选）

无需安装 - 直接从 GitHub 发布版本运行：

```bash
npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root . --audit jsonl
```

### SQLite 审计（可选）

启用高级 SQLite 审计日志：

```bash
npm install better-sqlite3 --save-optional
npx carta-mcp serve --root . --audit sqlite
```

## 📖 使用说明

### CLI 选项

```bash
carta-mcp serve [选项]
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `--root <目录>` | `.` | 暴露给客户端的工作区根目录 |
| `--audit <模式>` | `jsonl` | 审计模式：`jsonl`、`sqlite` 或 `none` |
| `--read-only` | `false` | 禁用写入操作（拒绝 `edits.apply`） |
| `--help` | - | 显示帮助信息 |

### 与 MCP 客户端集成

#### Claude Desktop

安装 GitHub Packages 后添加到您的 MCP 配置：

```bash
# 首先安装包
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com

# 然后添加到 Claude
claude mcp add kooix-carta -- npx carta-mcp serve --root .
```

或者使用一次性运行方法：

```bash
claude mcp add kooix-carta -- npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .
```

#### 其他 MCP 客户端

使用 carta-mcp CLI 配置 stdio 传输：

```json
{
  "mcpServers": {
    "kooix-carta": {
      "command": "npx",
      "args": [
        "--yes",
        "https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz",
        "serve",
        "--root",
        "."
      ]
    }
  }
}
```

## 🛠️ MCP 工具

本服务器提供四个 MCP 工具用于智能项目交互：

### `cards.scan`

**用途**：递归扫描项目卡片和可编辑块，支持智能自动生成。

**参数**：
```typescript
{
  root?: string;         // 可选的子目录路径
  include?: string[];    // 要包含的 glob 模式
  exclude?: string[];    // 要排除的 glob 模式
  autoGenerate?: boolean;// 启用自动卡片生成
  generateOptions?: {    // 自动生成配置
    template?: 'minimal' | 'detailed';     // 模板风格
    inferFromPath?: boolean;               // 从文件路径推断
    inferFromContent?: boolean;            // 从文件内容推断
    dryRun?: boolean;                      // 仅预览，不写入文件
  };
}
```

**返回**：发现的文件数组，包含元数据：
- 文件路径和 SHA-256 哈希
- `@SFC`/`@DFC` 卡片存在指示器
- `LLM-EDIT` 块位置和内容哈希
- **新功能**：生成的卡片信息和统计

**自动生成示例**：

```bash
# 预览将要生成的内容（干运行）
{
  "autoGenerate": true,
  "generateOptions": {
    "template": "minimal",
    "dryRun": true
  }
}

# 实际生成缺失的卡片
{
  "root": "src",
  "autoGenerate": true,
  "generateOptions": {
    "template": "detailed",
    "inferFromPath": true,
    "inferFromContent": true
  }
}
```

### `cards.get`

**用途**：从指定文件检索元数据和内容。

**参数**：
```typescript
{
  path: string; // 相对于服务器根目录的文件路径
}
```

**返回**：文件元数据包括：
- 文件路径和 SHA-256 哈希
- 原始 `@SFC`/`@DFC` YAML 内容（如果存在）
- 完整的文件结构信息

### `edits.apply`

**用途**：使用乐观锁定安全地替换 `LLM-EDIT` 块内的内容。

**参数**：
```typescript
{
  file: string;       // 目标文件路径
  blockId: string;    // LLM-EDIT 块标识符
  oldHash: string;    // 当前块内容哈希
  newContent: string; // 替换内容
  reason?: string;    // 可选的更改描述
}
```

**错误码**：
- `BOUNDARY_NOT_FOUND`：未找到块标识符
- `STALE_BLOCK`：哈希不匹配（内容已更改）
- `OUT_OF_BOUND_WRITE`：写入超出块边界
- `READ_ONLY_MODE`：服务器处于只读模式

### `io.readlog.append`

**用途**：记录文件访问事件用于审计跟踪。

**参数**：
```typescript
{
  runId: string;  // 唯一运行标识符
  path: string;   // 被访问的文件路径
  sha256: string; // 访问时的文件内容哈希
}
```

**输出**：记录到 `.kooix/logs/readlog.jsonl` 或 `.kooix/logs/readlog.sqlite`

## 📝 文件格式规范

### 项目卡片

使用 YAML 前置元数据定义项目元数据：

#### 单文件卡片（`@SFC`）
```markdown
# 我的组件

@SFC
name: user-profile
description: 用户资料组件，包含头像和详细信息
version: 1.2.0
tags: [component, user, ui]

组件实现如下...
```

#### 目录文件卡片（`@DFC`）
```markdown
# 模块文档

@DFC
name: auth-module
description: 身份验证和授权模块
structure:
  - controllers/
  - services/
  - middleware/

模块内容...
```

### 可编辑块

标记可以被 AI 工具安全修改的代码部分：

```typescript
function processUser(data: UserData) {
  /* LLM-EDIT:BEGIN validation-logic */
  if (!data.email || !data.name) {
    throw new Error('缺少必填字段');
  }
  /* LLM-EDIT:END validation-logic */

  return transformUserData(data);
}
```

**支持的注释风格**：
- `/* ... */` (JavaScript、TypeScript、CSS)
- `// ...` (单行注释)
- `# ...` (Python、Shell、YAML)
- `<!-- ... -->` (HTML、XML、Markdown)

**块规则**：
- 标识符在每个文件中必须唯一
- 内容会自动规范化行尾符
- 哈希验证防止并发修改冲突

## 🤖 智能生成功能

MCP 服务器可以在扫描过程中智能生成缺失的 `@SFC` 卡片，非常适合项目的渐进式完善。

### 智能推断

**基于路径的推断**：
- 从扩展名检测文件类型（`.tsx` → React TypeScript）
- 根据目录结构分类组件
- 基于项目模式自动生成标签

**基于内容的推断**：
- 函数 vs 类检测
- 导出模式分析
- 框架识别（React、Vue 等）
- 测试文件识别

### 模板类型

#### 简洁模板
```yaml
@SFC
name: component-name
description: 自动生成的描述
version: 1.0.0
tags: [typescript, component]
```

#### 详细模板
```yaml
@SFC
name: component-name
description: 自动生成的描述
version: 1.0.0
type: react-typescript
category: component
tags: [typescript, react, component]
created: 2025-09-24
author: auto-generated
```

### 使用示例

**开发工作流**：
```typescript
// 1. 扫描并预览生成
await mcpClient.callTool('cards.scan', {
  root: 'src',
  autoGenerate: true,
  generateOptions: { dryRun: true }
});

// 2. 实际生成卡片
await mcpClient.callTool('cards.scan', {
  root: 'src/components',
  autoGenerate: true,
  generateOptions: {
    template: 'detailed',
    inferFromContent: true
  }
});
```

**支持的文件类型**：
- **TypeScript/JavaScript**：`.ts`、`.tsx`、`.js`、`.jsx`
- **Vue 组件**：`.vue`
- **Python**：`.py`
- **Markdown**：`.md`

## 📊 审计日志

选择三种审计模式之一来跟踪文件访问：

### JSONL 模式（默认）
```bash
carta-mcp serve --audit jsonl
```
- 记录到 `.kooix/logs/readlog.jsonl`
- 人类可读的结构化格式
- 易于使用标准工具解析

### SQLite 模式
```bash
npm install better-sqlite3 --save-optional
carta-mcp serve --audit sqlite
```
- 记录到 `.kooix/logs/readlog.sqlite`
- 可查询的数据库格式
- 大量数据的更好性能

### 禁用
```bash
carta-mcp serve --audit none
```
- 无审计日志
- 最小开销
- 适用于开发环境

## 🔧 开发

### 本地开发

```bash
cd packages/kooix-carta-mcp
npm ci
npm run build
npm test
```

### 项目结构

```
packages/kooix-carta-mcp/
├── src/
│   ├── server.ts       # MCP 服务器实现
│   ├── scan.ts         # 卡片发现逻辑
│   ├── patch.ts        # 编辑块处理
│   ├── readlog.ts      # 审计日志
│   └── ...
├── bin/
│   └── cli.ts          # CLI 入口点
└── dist/               # 编译输出
```

### 环境要求

- **Node.js**：18.18 或更高版本
- **TypeScript**：5.4+（开发用）
- **模块系统**：ES 模块，NodeNext 解析

## 📦 发布流程

### 自动化发布

项目使用 GitHub Actions 进行自动化发布：

1. **更新版本**：在 `packages/kooix-carta-mcp/package.json` 中提升版本号
2. **创建标签**：`git tag vX.Y.Z && git push origin vX.Y.Z`
3. **GitHub 发布**：自动构建并附加 `.tgz` 资源

### CI/CD 工作流

- **`.github/workflows/ci.yml`**：持续集成（安装、构建、测试）
- **`.github/workflows/release.yml`**：发布自动化（由标签或 GitHub Releases 触发）

### 手动发布

```bash
# 构建和打包
npm run build
npm pack

# 上传到您首选的注册表或主机
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 获取指南。

### 快速贡献步骤

1. Fork 仓库
2. 创建功能分支
3. 进行更改并添加测试
4. 运行 `npm run build && npm test`
5. 提交 pull request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

<div align="center">

**为模型上下文协议生态系统构建 ❤️**

[文档](https://modelcontextprotocol.io) • [规范](https://github.com/modelcontextprotocol/specification) • [社区](https://github.com/modelcontextprotocol)

</div>
